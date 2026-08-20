import { Command } from 'commander';
import { getRegistrySource } from '../lib/registry.js';
import {
  listInstalled,
  getSystemInstallPath,
  updateInstallVersion,
  getSetupDone,
  recordSetupDone,
} from '../lib/storage.js';
import { findRepoSystemSource } from '../lib/repo.js';
import { theme } from '../utils/theme.js';
import { handleError } from '../utils/errors.js';
import { cp } from 'node:fs/promises';
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

    if (!isNewer(entry.version, meta.version)) {
      console.log(theme.dim(`  ${sysName} is up-to-date (${theme.cyan(`v${meta.version}`)})`));
      skipped++;
      continue;
    }

    console.log(theme.info(`Updating ${theme.cyan(sysName)} ${theme.dim(`v${meta.version} → v${entry.version}`)}...`));

    const sourcePath = findRepoSystemSource(sysName);
    if (!sourcePath) {
      console.error(theme.error(`  Source for "${sysName}" not found locally — cannot update offline.`));
      skipped++;
      continue;
    }

    const destPath = getSystemInstallPath(sysName);
    // Preserve setupDone — do NOT reset on update for v1
    const prevSetupDone = meta.setupDone;

    try {
      await cp(sourcePath, destPath, { recursive: true, force: true });
      await updateInstallVersion(sysName, entry.version);
      // Ensure setupDone preserved (updateInstallVersion already preserves, but be explicit if needed)
      if (prevSetupDone) {
        await recordSetupDone(sysName, true);
      }
      console.log(theme.success(`  Updated ${theme.cyan(sysName)} to ${theme.cyan(`v${entry.version}`)}`));
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
