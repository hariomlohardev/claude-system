import { Command } from 'commander';
import { getRegistrySource } from '../lib/registry.js';
import {
  listInstalled,
  getSystemInstallPath,
  updateInstallVersion,
  getSetupDone,
  recordSetupDone,
  collectInstalledFiles,
  saveInstalledFiles,
} from '../lib/storage.js';
import { findRepoSystemSource } from '../lib/repo.js';
import { theme } from '../utils/theme.js';
import { handleError } from '../utils/errors.js';
import { cp, mkdir, readdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createInterface } from 'node:readline';
import { isNewer } from '../lib/version.js';

export function registerUpdate(program: Command): void {
  program
    .command('update')
    .description('Update installed Systems to the latest registry version')
    .argument('[system]', 'System name to update (omit with --all)')
    .option('--all', 'update all installed Systems')
    .action(async (name: string | undefined, opts: { all?: boolean }) => {
      try {
        await runUpdate(name, opts);
      } catch (err) {
        handleError(err);
      }
    });
}

async function downloadSystemFromGitHub(name: string, entryPath: string): Promise<string | null> {
  const baseRaw = `https://raw.githubusercontent.com/hariomlohardev/claude-system/main/${entryPath}`;
  const tmpBase = join(tmpdir(), `claude-system-download-${name}-${Date.now()}`);
  await mkdir(tmpBase, { recursive: true });
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
  const filesToFetch: string[] = ['system.json', 'CLAUDE.md', 'README.md', 'settings.json', '.claude/config.json'];
  const knownAgents = ['fit-scorer.md', 'issue-hunter.md', 'issue-triager.md', 'portfolio-curator.md', 'repo-archaeologist.md', 'repo-scout.md', 'shadow-reviewer.md'];
  const knownCommands = ['find-issues.md', 'history.md', 'portfolio.md', 'solve-issue.md', 'understand.md'];
  for (const a of knownAgents) filesToFetch.push(`.claude/agents/${a}`);
  for (const c of knownCommands) filesToFetch.push(`.claude/commands/${c}`);
  filesToFetch.push('.claude/state/.gitkeep');
  filesToFetch.push('PORTFOLIO.example.md');
  for (const rel of filesToFetch) {
    const dest = join(tmpBase, rel);
    await fetchFile(rel, dest);
  }
  if (!existsSync(join(tmpBase, 'system.json'))) return null;
  try { await mkdir(join(tmpBase, '.claude/state/drafts'), { recursive: true }); } catch {}
  return tmpBase;
}

function formatTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

async function promptChoice(sysName: string, changed: string[], untracked: string[]): Promise<'o' | 'b' | 'a'> {
  console.log(theme.yellow(`  ⚠ Local edits detected in "${sysName}":`));
  if (changed.length) console.log(theme.dim(`    Modified: ${changed.join(', ')}`));
  if (untracked.length) console.log(theme.dim(`    Untracked: ${untracked.join(', ')}`));
  console.log(theme.dim(`  Overwriting will lose these changes.`));
  console.log('');
  console.log(theme.dim(`  [o]verwrite  — overwrite without backup`));
  console.log(theme.dim(`  [b]ackup     — copy current folder to ~/.claude-system/systems/${sysName}.bak.<YYYY-MM-DD_HH-mm-ss>/ then overwrite`));
  console.log(theme.dim(`  [a]bort      — do nothing (default, just press Enter)`));
  console.log('');
  // Use stderr for prompt? Keep stdout so piped tests capture it
  const isTTY = !!process.stdin.isTTY && !!process.stdout.isTTY;
  if (isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const ans: string = await new Promise((resolve) => {
      rl.question(theme.dim('  Choice [a/b/o] (default: a): '), (a) => {
        rl.close();
        resolve(a);
      });
    });
    const c = ans.trim().toLowerCase() || 'a';
    if (c === 'o' || c === 'b' || c === 'a') return c as 'o' | 'b' | 'a';
    return 'a';
  } else {
    // Non-TTY (piped) — read piped input if any
    try {
      const { readFileSync } = await import('node:fs');
      let data = '';
      try {
        // read piped stdin (will be empty string on EOF, "b\n"/"o\n"/"\n" when piped)
        data = readFileSync(0, 'utf-8');
      } catch {
        data = '';
      }
      const line = data.split(/\r?\n/)[0]?.trim().toLowerCase() ?? '';
      if (line === 'o' || line === 'b' || line === 'a') return line as 'o' | 'b' | 'a';
      // Also handle case where piped data contains just "b" without newline? Already handled.
      // If data is empty or just newline, default abort
      // For CI with no piped data, we abort
      // To honor spec: non-TTY with no explicit o/b aborts without overwriting
      return 'a';
    } catch {
      return 'a';
    }
  }
}

async function runUpdate(name: string | undefined, opts: { all?: boolean }): Promise<void> {
  if (!name && !opts.all) {
    console.error(theme.error('Specify a System name or use --all.'));
    console.error(theme.dim('  Usage: claude-system update <system>'));
    console.error(theme.dim('         claude-system update --all'));
    process.exit(1);
  }
  if (name && opts.all) {
    console.error(theme.error('Specify either <system> or --all, not both.'));
    process.exit(1);
  }

  const installed = await listInstalled();
  if (installed.length === 0) {
    console.log(theme.dim('No Systems installed.'));
    console.log(theme.dim('  Install one with: claude-system install <name>'));
    return;
  }

  let targets: typeof installed;
  if (opts.all) {
    targets = installed;
  } else {
    const found = installed.find((i) => i.name === name);
    if (!found) {
      console.error(theme.error(`System "${name}" is not installed.`));
      console.error(theme.dim('  Try: claude-system list --installed'));
      process.exit(1);
    }
    targets = [found];
  }

  // Fetch fresh registry once
  const source = getRegistrySource();
  let index;
  try {
    index = await source.fetchIndex();
  } catch (err) {
    console.error(theme.error(`Failed to fetch registry: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }

  const registryMap = new Map(index.systems.map((s) => [s.name, s]));

  let updated = 0;
  let skipped = 0;

  for (const { name: sysName, meta } of targets) {
    const entry = registryMap.get(sysName);
    if (!entry) {
      console.log(theme.warn(`Skipping ${theme.cyan(sysName)} — not found in registry (maybe removed).`));
      skipped++;
      continue;
    }

    // Determine if version is newer
    const newer = isNewer(entry.version, meta.version);

    // If up-to-date and no edits workflow would be silent, but if edits exist we still want to prompt
    // So we need to detect edits first to decide.
    const destPath = getSystemInstallPath(sysName);
    let changed: string[] = [];
    let untracked: string[] = [];
    let currentFiles: Array<{ path: string; sha256: string }> = [];
    try {
      currentFiles = await collectInstalledFiles(destPath);
    } catch {
      currentFiles = [];
    }

    const manifest = meta.installedFiles;
    if (!manifest || manifest.length === 0) {
      // Old install without manifest — treat every file as untracked to prompt
      if (currentFiles.length > 0) {
        untracked = currentFiles.map((f) => f.path);
      }
    } else {
      const manifestMap = new Map(manifest.map((f) => [f.path, f.sha256]));
      const currentMap = new Map(currentFiles.map((f) => [f.path, f.sha256]));
      for (const cf of currentFiles) {
        const expected = manifestMap.get(cf.path);
        if (expected === undefined) {
          untracked.push(cf.path);
        } else if (expected !== cf.sha256) {
          changed.push(cf.path);
        }
      }
      // Check for deleted files (in manifest but not on disk)
      for (const mf of manifest) {
        if (!currentMap.has(mf.path)) {
          changed.push(`${mf.path} (deleted)`);
        }
      }
    }

    const hasEdits = changed.length > 0 || untracked.length > 0;

    if (!newer) {
      if (!hasEdits) {
        console.log(theme.dim(`  ${sysName} is up-to-date (${theme.cyan(`v${meta.version}`)})`));
        skipped++;
        continue;
      }
      // Has edits but version not newer — still offer to restore/overwrite
      console.log(theme.info(`Local edits detected for ${theme.cyan(sysName)} ${theme.dim(`(v${meta.version} → v${entry.version})`)} — offering restore...`));
    } else {
      console.log(theme.info(`Updating ${theme.cyan(sysName)} ${theme.dim(`v${meta.version} → v${entry.version}`)}...`));
    }

    // If edits exist, prompt
    if (hasEdits) {
      const choice = await promptChoice(sysName, changed, untracked);
      if (choice === 'a') {
        console.log(theme.yellow('Aborted — no changes made. Back up your edits and re-run update with [o] or [b].'));
        // For single target, exit 1 to signal abort; for --all, skip and continue
        if (!opts.all) {
          process.exit(1);
        } else {
          skipped++;
          continue;
        }
      } else if (choice === 'b') {
        const stamp = formatTimestamp();
        const backupPath = `${destPath}.bak.${stamp}`;
        try {
          await cp(destPath, backupPath, { recursive: true, force: true });
          console.log(theme.dim(`  › Backed up to ${backupPath}`));
        } catch (err) {
          console.error(theme.error(`  Failed to backup "${sysName}": ${err instanceof Error ? err.message : String(err)}`));
          if (!opts.all) process.exit(1);
          skipped++;
          continue;
        }
        // proceed to overwrite below
      } else if (choice === 'o') {
        // proceed without backup
      }
    } else {
      // No edits — proceed silently (no prompt)
    }

    // Resolve source for overwrite — prefer local, fallback to download
    let sourcePath = findRepoSystemSource(sysName);
    let via: 'local' | 'download' = 'local';
    if (!sourcePath) {
      // Try download fallback similar to install
      console.log(theme.dim(`  › Local source not found — fetching "systems/${sysName}/" from GitHub raw…`));
      const downloaded = await downloadSystemFromGitHub(sysName, entry.path || `systems/${sysName}`);
      if (downloaded) {
        sourcePath = downloaded;
        via = 'download';
        console.log(theme.dim(`    via: download from raw.githubusercontent.com (main)`));
      }
    }

    if (!sourcePath) {
      console.error(theme.error(`  Source for "${sysName}" not found locally — cannot update offline.`));
      skipped++;
      continue;
    }

    // Preserve setupDone — do NOT reset on update for v1
    const prevSetupDone = meta.setupDone;

    try {
      // Clean destination first so untracked files are removed (flat overwrite, not merge)
      try { await rm(destPath, { recursive: true, force: true }); } catch {}
      await mkdir(destPath, { recursive: true });
      await cp(sourcePath, destPath, { recursive: true, force: true });
      await updateInstallVersion(sysName, entry.version);
      // Ensure setupDone preserved (updateInstallVersion already preserves, but be explicit if needed)
      if (prevSetupDone) {
        await recordSetupDone(sysName, true);
      }
      // Re-hash manifest to new files
      try {
        await saveInstalledFiles(sysName);
      } catch {}
      console.log(theme.success(`  Updated ${theme.cyan(sysName)} to ${theme.cyan(`v${entry.version}`)}`) + (via === 'download' ? theme.dim(' (via download)') : ''));
      updated++;
    } catch (err) {
      console.error(theme.error(`  Failed to update "${sysName}": ${err instanceof Error ? err.message : String(err)}`));
      skipped++;
    }
  }

  console.log('');
  if (opts.all) {
    if (updated === 0) console.log(theme.dim('Nothing to update — all Systems are up-to-date.'));
    else console.log(theme.success(`Updated ${updated} System(s).${skipped > 0 ? theme.dim(` ${skipped} skipped.`) : ''}`));
  } else if (updated === 0 && skipped > 0) {
    // single update with no newer version — already printed up-to-date
  }
}
