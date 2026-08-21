import { Command } from 'commander';
import { findInRegistry } from '../lib/registry.js';
import { getSystemInstallPath, isInstalled, recordInstall, getSetupDone } from '../lib/storage.js';
import { findRepoSystemSource } from '../lib/repo.js';
import { theme } from '../utils/theme.js';
import { handleError } from '../utils/errors.js';
import { cp, mkdir, stat } from 'node:fs/promises';
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

  // Resolve source — prefer local repo copy (dev), else try GitHub fetch
  const sourcePath = findRepoSystemSource(name);

  if (!sourcePath) {
    // Try to explain that we need to fetch from GitHub — but for v1 we only support local copy
    // In a real release asset flow, we'd download from GitHub Releases.
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
    // Node 16.7+ has cp
    await cp(sourcePath, destPath, { recursive: true, force: true });
  } catch (err) {
    console.error(theme.error(`Failed to install "${name}": ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }

  await recordInstall(name, entry.version);

  // Fire-and-forget analytics — do not block install on failure
  try {
    const vercelUrl = 'https://claude-system-tau.vercel.app';
    // Use native fetch with short timeout, ignore errors
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

  console.log(theme.success(`Installed ${theme.cyan(name)} ${theme.dim(`v${entry.version}`)}`));
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
