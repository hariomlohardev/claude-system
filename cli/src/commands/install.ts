import { Command } from 'commander';
import { findInRegistry } from '../lib/registry.js';
import { getSystemInstallPath, isInstalled, recordInstall, saveInstalledFiles } from '../lib/storage.js';
import { findRepoSystemSource } from '../lib/repo.js';
import { downloadSystemFromGitHub } from '../lib/systemDownloader.js';
import { theme } from '../utils/theme.js';
import { handleError } from '../utils/errors.js';
import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

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
    console.log(theme.dim(`› Local source not found — fetching "systems/${name}/" from GitHub…`));
    try {
      const downloaded = await downloadSystemFromGitHub({ name });
      sourcePath = downloaded;
      via = 'download';
      console.log(theme.dim(`  via: download from GitHub (main)`));
    } catch (err) {
      console.error(theme.dim(`  download failed: ${err instanceof Error ? err.message : String(err)}`));
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
