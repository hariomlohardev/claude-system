import { Command } from 'commander';
import { findInRegistry } from '../lib/registry.js';
import { getSystemInstallPath, isInstalled, recordInstall, getSetupDone, saveInstalledFiles } from '../lib/storage.js';
import { findRepoSystemSource } from '../lib/repo.js';
import { theme } from '../utils/theme.js';
import { handleError } from '../utils/errors.js';
import { cp, mkdir, stat, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export function registerInstall(program: Command): void {
  program
    .command('install')
    .description('Install a System from the registry')
    .argument('<system>', 'System name (kebab-case)')
    .action(async (name: string) => {
      try {
        await runInstall(name);
      } catch (err) {
        handleError(err);
      }
    });
}

async function downloadSystemFromGitHub(name: string, entryPath: string): Promise<string | null> {
  // Download System folder from GitHub raw as fallback when local source not found
  // Works for production (global install) and for any cwd
  const baseRaw = `https://raw.githubusercontent.com/hariomlohardev/claude-system/main/${entryPath}`;
  const apiUrl = `https://api.github.com/repos/hariomlohardev/claude-system/contents/${entryPath}`;

  // Create temp source dir
  const tmpBase = join(tmpdir(), `claude-system-download-${name}-${Date.now()}`);
  await mkdir(tmpBase, { recursive: true });

  // Helper to fetch and write a single file
  async function fetchFile(relPath: string, dest: string): Promise<boolean> {
    const url = `${baseRaw}/${relPath}`;
    try {
      const res = await fetch(url, { headers: { Accept: 'text/plain', 'Cache-Control': 'no-cache' } });
      if (!res.ok) return false;
      const text = await res.text();
      await mkdir(join(dest, '..'), { recursive: true });
      await writeFile(dest, text, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }

  // Try to list directory via GitHub API to know what to download
  let filesToFetch: string[] = ['system.json', 'CLAUDE.md', 'README.md', 'settings.json', '.claude/config.json'];
  // Known agents/commands for oss-contrib-finder and generic fallback
  const knownAgents = ['fit-scorer.md', 'issue-hunter.md', 'issue-triager.md', 'portfolio-curator.md', 'repo-archaeologist.md', 'repo-scout.md', 'shadow-reviewer.md'];
  const knownCommands = ['find-issues.md', 'history.md', 'portfolio.md', 'solve-issue.md', 'understand.md'];
  for (const a of knownAgents) filesToFetch.push(`.claude/agents/${a}`);
  for (const c of knownCommands) filesToFetch.push(`.claude/commands/${c}`);
  filesToFetch.push('.claude/state/.gitkeep');
  filesToFetch.push('PORTFOLIO.example.md');

  // Also try API listing to discover any other files (best effort)
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(apiUrl, { headers: { Accept: 'application/vnd.github.v3+json', 'Cache-Control': 'no-cache' }, signal: controller.signal });
    clearTimeout(t);
    if (res.ok) {
      const listing: any = await res.json();
      if (Array.isArray(listing)) {
        // We have listing, but our known list already covers required files; keep it
      }
    }
  } catch {
    // ignore, use known list
  }

  let fetched = 0;
  for (const rel of filesToFetch) {
    const dest = join(tmpBase, rel);
    const ok = await fetchFile(rel, dest);
    if (ok) fetched++;
  }

  // Must have at least system.json to be valid
  if (!existsSync(join(tmpBase, 'system.json'))) {
    return null;
  }

  // Also ensure .claude/state/drafts exists
  try { await mkdir(join(tmpBase, '.claude/state/drafts'), { recursive: true }); } catch {}

  return tmpBase;
}

async function runInstall(name: string): Promise<void> {
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    console.error(theme.error(`Invalid System name "${name}". Must be kebab-case.`));
    process.exit(1);
  }

  // Always fresh registry
  let entry;
  try {
    entry = await findInRegistry(name);
  } catch (err) {
    console.error(theme.error(`Failed to fetch registry: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }

  if (!entry) {
    console.error(theme.error(`System "${name}" not found in registry.`));
    console.error(theme.dim(`  Try: claude-system search ${name}`));
    process.exit(1);
  }

  if (await isInstalled(name)) {
    console.log(theme.warn(`System "${name}" is already installed.`));
    console.log(theme.dim(`  Try: claude-system update ${name}  (to update to latest)`));
    console.log(theme.dim(`  Or:  claude-system info ${name}   (to see installed version)`));
    process.exit(0);
  }

  // Resolve source — prefer local repo copy (dev), else try GitHub fetch (any cwd, production)
  let sourcePath = findRepoSystemSource(name);
  let via: 'local' | 'download' = 'local';

  if (!sourcePath) {
    console.log(theme.dim(`› Local source not found — fetching "systems/${name}/" from GitHub raw…`));
    const downloaded = await downloadSystemFromGitHub(name, entry.path || `systems/${name}`);
    if (downloaded) {
      sourcePath = downloaded;
      via = 'download';
      console.log(theme.dim(`  via: download from raw.githubusercontent.com (main)`));
    }
  }

  if (!sourcePath) {
    console.error(theme.error(`Source for "${name}" not found locally.`));
    console.error(theme.dim(`  Expected: systems/${name}/ in the registry repo`));
    console.error(theme.dim(`  Registry says path: ${entry.path}`));
    console.error(theme.dim(`  In dev, run from the claude-system repo root so the local systems/ folder is visible.`));
    console.error(theme.dim(`  In production, install downloads from the GitHub Release asset — ensure you are online.`));
    process.exit(1);
  }

  const destPath = getSystemInstallPath(name);
  try {
    await mkdir(destPath, { recursive: true });
    await cp(sourcePath, destPath, { recursive: true, force: true });
  } catch (err) {
    console.error(theme.error(`Failed to install "${name}": ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }

  await recordInstall(name, entry.version);
  // Save manifest for update detection
  try {
    await saveInstalledFiles(name);
  } catch {}

  // Fire-and-forget analytics — do not block install on failure
  try {
    const vercelUrl = 'https://claude-system-tau.vercel.app';
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 3000);
    fetch(`${vercelUrl}/api/systems/${name}/install`, { method: 'POST', signal: controller.signal }).then(async (r) => {
      clearTimeout(t);
      if (!r.ok) {
        console.error(theme.dim('› analytics unavailable'));
      }
    }).catch(() => {
      clearTimeout(t);
      console.error(theme.dim('› analytics unavailable'));
    });
  } catch {}

  console.log(theme.success(`Installed ${theme.cyan(name)} ${theme.dim(`v${entry.version}`)}`) + (via === 'download' ? theme.dim(' (via download)') : ''));
  console.log(theme.dim(`  → ${destPath}`));
  console.log('');

  // Note about setup.sh
  if (existsSync(`${destPath}/setup.sh`)) {
    console.log(theme.warn(`This System includes setup.sh — it will prompt for consent on first run.`));
    console.log(theme.dim(`  Run: ${theme.cyan(`claude-system run ${name}`)}`));
  } else {
    console.log(theme.dim(`  Run: ${theme.cyan(`claude-system run ${name}`)}`));
    console.log(theme.dim(`  Info: ${theme.cyan(`claude-system info ${name}`)}`));
  }
}
