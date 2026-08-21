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
import { downloadSystemFromGitHub } from '../lib/systemDownloader.js';
import { theme } from '../utils/theme.js';
import { handleError } from '../utils/errors.js';
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
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
    try {
      const { readFileSync } = await import('node:fs');
      let data = '';
      try {
        data = readFileSync(0, 'utf-8');
      } catch {
        data = '';
      }
      const line = data.split(/\r?\n/)[0]?.trim().toLowerCase() ?? '';
      if (line === 'o' || line === 'b' || line === 'a') return line as 'o' | 'b' | 'a';
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

    const newer = isNewer(entry.version, meta.version);

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
      console.log(theme.info(`Local edits detected for ${theme.cyan(sysName)} ${theme.dim(`(v${meta.version} → v${entry.version})`)} — offering restore...`));
    } else {
      console.log(theme.info(`Updating ${theme.cyan(sysName)} ${theme.dim(`v${meta.version} → v${entry.version}`)}...`));
    }

    if (hasEdits) {
      const choice = await promptChoice(sysName, changed, untracked);
      if (choice === 'a') {
        console.log(theme.yellow('Aborted — no changes made. Back up your edits and re-run update with [o] or [b].'));
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
      } else if (choice === 'o') {
      }
    } else {
    }

    let sourcePath = findRepoSystemSource(sysName);
    let via: 'local' | 'download' = 'local';
    if (!sourcePath) {
      console.log(theme.dim(`  › Local source not found — fetching "systems/${sysName}/" from GitHub…`));
      try {
        const downloaded = await downloadSystemFromGitHub({ name: sysName });
        sourcePath = downloaded;
        via = 'download';
        console.log(theme.dim(`    via: download from GitHub (main)`));
      } catch (err) {
        console.error(theme.dim(`  download failed: ${err instanceof Error ? err.message : String(err)}`));
      }
    }

    if (!sourcePath) {
      console.error(theme.error(`  Source for "${sysName}" not found locally — cannot update offline.`));
      skipped++;
      continue;
    }

    const prevSetupDone = meta.setupDone;

    try {
      try { await rm(destPath, { recursive: true, force: true }); } catch {}
      await mkdir(destPath, { recursive: true });
      await cp(sourcePath, destPath, { recursive: true, force: true });
      await updateInstallVersion(sysName, entry.version);
      if (prevSetupDone) {
        await recordSetupDone(sysName, true);
      }
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
  }
}
