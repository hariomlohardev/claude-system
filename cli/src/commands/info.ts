import { Command } from 'commander';
import { findInRegistry, getRegistrySource } from '../lib/registry.js';
import { getSystemInstallPath, isInstalled, getInstalledVersion, getSystemsDir } from '../lib/storage.js';
import { theme } from '../utils/theme.js';
import { handleError } from '../utils/errors.js';
import { existsSync } from 'node:fs';

export function registerInfo(program: Command): void {
  program
    .command('info')
    .description('Show detailed info for a System')
    .argument('<system>', 'System name (kebab-case)')
    .action(async (name: string) => {
      try {
        await runInfo(name);
      } catch (err) {
        handleError(err);
      }
    });
}

async function runInfo(name: string): Promise<void> {
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    console.error(theme.error(`Invalid System name "${name}". Must be kebab-case.`));
    process.exit(1);
  }

  let entry;
  try {
    entry = await findInRegistry(name);
  } catch (err) {
    throw new Error(`Failed to fetch registry: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!entry) {
    console.error(theme.error(`System "${name}" not found in registry.`));
    console.error(theme.dim(`  Try: claude-system search ${name}`));
    console.error(theme.dim(`  Or:  claude-system list`));
    process.exit(1);
  }

  const installed = await isInstalled(name);
  const installedVersion = installed ? await getInstalledVersion(name) : null;
  const installPath = getSystemInstallPath(name);
  const hasSetup = installed && existsSync(`${installPath}/setup.sh`);

  // Header
  console.log('');
  console.log(theme.bold(theme.cyan(entry.displayName)) + theme.dim(`  v${entry.version}`));
  console.log(theme.dim(`  ${entry.name}  ·  ${entry.category ?? 'other'}  ·  ${entry.license}`));
  console.log('');

  // Description
  console.log(theme.bold('Description'));
  console.log(`  ${entry.description}`);
  console.log('');

  // Author
  console.log(theme.bold('Author'));
  console.log(`  ${entry.author.name}${entry.author.github ? `  ${theme.dim(`@${entry.author.github}`)}` : ''}${entry.author.url ? `  ${theme.cyan(entry.author.url)}` : ''}`);
  console.log('');

  // Keywords
  console.log(theme.bold('Keywords'));
  console.log(`  ${entry.keywords.map((k) => theme.dim(k)).join(', ')}`);
  console.log('');

  // Fetch full system.json for permissions/repository/bugs if available (from installed copy or registry entry doesn't have them)
  // Registry entry is subset — permissions not included. We need to note that.
  // Try to read installed system.json for richer info
  let permissions: string[] | null = null;
  let repository: string | null = null;
  let bugsUrl: string | null = null;
  let homepage: string | null = null;

  if (installed) {
    try {
      const { readFile } = await import('node:fs/promises');
      const { join } = await import('node:path');
      const raw = await readFile(join(installPath, 'system.json'), 'utf-8');
      const json = JSON.parse(raw);
      permissions = json.permissions ?? null;
      repository = json.repository ?? null;
      bugsUrl = json.bugs?.url ?? null;
      homepage = json.homepage ?? null;
    } catch {
      // ignore
    }
  }

  // If not installed, we can't know permissions — note that registry is subset
  if (permissions !== null) {
    console.log(theme.bold('Permissions'));
    if (permissions.length === 0) {
      console.log(`  ${theme.green('[]')}  ${theme.dim('(no special capabilities declared)')}`);
    } else {
      for (const p of permissions) {
        console.log(`  ${theme.yellow('·')} ${p}`);
      }
    }
    console.log('');
  } else {
    console.log(theme.bold('Permissions'));
    console.log(theme.dim('  (install to see declared permissions — registry shows summary only)'));
    if (!installed) console.log(theme.dim(`  After install: cat ${installPath}/system.json | jq .permissions`));
    console.log('');
  }

  // Links
  console.log(theme.bold('Links'));
  if (repository) console.log(`  repository  ${theme.cyan(repository)}`);
  if (bugsUrl) console.log(`  bugs        ${theme.cyan(bugsUrl)}`);
  else if (repository) console.log(`  bugs        ${theme.dim(`${repository}/issues (inferred from repository)`)}`);
  else console.log(`  bugs        ${theme.dim('https://github.com/hariomlohardev/claude-system/issues (monorepo, tagged ' + name + ')')}`);
  if (homepage) console.log(`  homepage    ${theme.cyan(homepage)}`);
  console.log(`  path        ${theme.dim(entry.path)}`);
  console.log('');

  // Install status
  console.log(theme.bold('Install status'));
  if (installed) {
    console.log(`  ${theme.green('● installed')}  ${theme.dim(installPath)}  ${theme.dim(`v${installedVersion ?? 'unknown'}`)}`);
    if (hasSetup) {
      const { getSetupDone } = await import('../lib/storage.js');
      const done = await getSetupDone(name);
      if (done) console.log(`  setup.sh    ${theme.green('done')} ${theme.dim('(will not run again)')}`);
      else console.log(`  setup.sh    ${theme.yellow('pending')} ${theme.dim('(will prompt on next run)')}`);
    }
  } else {
    console.log(`  ${theme.dim('○ not installed')}  ${theme.dim(`— would install to ${installPath}`)}`);
    console.log(theme.dim(`  Install with: ${theme.cyan(`claude-system install ${name}`)}`));
  }
  console.log('');

  // Setup note
  if (hasSetup || (!installed && permissions === null)) {
    // If we haven't seen setup.sh, still warn generically if permissions suggest shell:exec
    // But per spec, only show setup.sh note if it exists
    if (hasSetup) {
      console.log(theme.warn('This System ships setup.sh — it will execute shell code on first run (with consent).'));
      console.log('');
    }
  }
}
