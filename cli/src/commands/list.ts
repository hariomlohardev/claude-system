import { Command } from 'commander';
import { getRegistrySource } from '../lib/registry.js';
import { listInstalled, getSystemsDir } from '../lib/storage.js';
import { theme } from '../utils/theme.js';
import { formatTable, truncate } from '../utils/format.js';
import { handleError } from '../utils/errors.js';
import type { RegistryEntry } from '../utils/validation.js';

export function registerList(program: Command): void {
  program
    .command('list')
    .description('List available or installed Systems')
    .option('--installed', 'list only installed Systems')
    .option('--available', 'list all Systems from the registry (default)')
    .option('--category <category>', 'filter by category')
    .action(async (opts) => {
      try {
        await runList(opts);
      } catch (err) {
        handleError(err);
      }
    });
}

async function runList(opts: { installed?: boolean; available?: boolean; category?: string }): Promise<void> {
  const category = opts.category;
  const showInstalled = opts.installed && !opts.available;
  const showAvailable = !opts.installed || opts.available;

  if (showInstalled) {
    // --installed = read from ~/.claude-system/systems.json, no registry fetch
    const installed = await listInstalled();
    let filtered = installed;
    if (category) {
      // Need registry to know category for installed items — fetch minimal
      // For v1, filter by reading installed system.json directly
      const { readFile } = await import('node:fs/promises');
      const { join } = await import('node:path');
      const { getSystemsDir } = await import('../lib/storage.js');
      const results: typeof installed = [];
      for (const item of installed) {
        try {
          const raw = await readFile(join(getSystemsDir(), item.name, 'system.json'), 'utf-8');
          const json = JSON.parse(raw);
          if (!category || json.category === category || (!json.category && category === 'other')) {
            results.push(item);
          }
        } catch {
          // if can't read, include if no category filter
          if (!category) results.push(item);
        }
      }
      filtered = results;
    }

    if (filtered.length === 0) {
      console.log(theme.dim('No Systems installed.'));
      console.log(theme.dim(`  Install one with: ${theme.cyan('claude-system install <name>')}`));
      console.log(theme.dim(`  Installed dir: ${getSystemsDir()}`));
      return;
    }

    const rows = filtered.map(({ name, meta }) => [
      theme.cyan(name),
      meta.version,
      meta.setupDone ? theme.green('ready') : theme.yellow('setup pending'),
      meta.installedAt !== 'unknown' ? new Date(meta.installedAt).toLocaleDateString() : 'unknown',
    ]);

    console.log(theme.bold(`Installed Systems (${filtered.length})`));
    console.log(formatTable(rows, [{ header: 'NAME' }, { header: 'VERSION' }, { header: 'STATUS' }, { header: 'INSTALLED' }]));
    return;
  }

  // --available (default) — fetch fresh registry
  const source = getRegistrySource();
  let systems: RegistryEntry[];
  try {
    const index = await source.fetchIndex();
    systems = index.systems;
  } catch (err) {
    throw new Error(`Failed to fetch registry: ${err instanceof Error ? err.message : String(err)}`);
  }

  let filtered = systems;
  if (category) {
    filtered = systems.filter((s) => s.category === category || (!s.category && category === 'other'));
  }

  if (filtered.length === 0) {
    const hint = category ? ` in category "${category}"` : '';
    console.log(theme.dim(`No Systems found${hint}.`));
    if (category) console.log(theme.dim(`  Available categories: open-source, frontend, backend, testing, security, docs, research, devops, other`));
    return;
  }

  const rows = filtered.map((s) => [
    theme.cyan(s.name),
    s.displayName,
    s.version,
    s.category ?? 'other',
    truncate(s.description, 50),
  ]);

  console.log(theme.bold(`Available Systems (${filtered.length})`));
  console.log(theme.dim(`  Registry: fresh fetch — no cache`));
  console.log(
    formatTable(rows, [
      { header: 'NAME', width: 18 },
      { header: 'DISPLAY NAME', width: 22 },
      { header: 'VERSION', width: 10 },
      { header: 'CATEGORY', width: 12 },
      { header: 'DESCRIPTION', truncate: 50 },
    ]),
  );
}
