import { Command } from 'commander';
import { searchRegistry } from '../lib/registry.js';
import { theme } from '../utils/theme.js';
import { formatTable, truncate } from '../utils/format.js';
import { handleError } from '../utils/errors.js';

export function registerSearch(program: Command): void {
  program
    .command('search')
    .description('Search Systems by keyword')
    .argument('<query>', 'search query (matches name, displayName, description, keywords)')
    .action(async (query: string) => {
      try {
        await runSearch(query);
      } catch (err) {
        handleError(err);
      }
    });
}

async function runSearch(query: string): Promise<void> {
  if (!query || !query.trim()) {
    console.error(theme.error('Query is required.'));
    console.error(theme.dim('  Usage: claude-system search <query>'));
    process.exit(1);
  }

  let results;
  try {
    results = await searchRegistry(query.trim());
  } catch (err) {
    throw new Error(`Failed to search registry: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (results.length === 0) {
    console.log(theme.dim(`No Systems matched "${query}".`));
    console.log(theme.dim(`  Try: claude-system list`));
    return;
  }

  console.log(theme.bold(`Search results for "${query}" (${results.length})`));
  console.log(theme.dim(`  Registry: fresh fetch — no cache`));

  const rows = results.map((s) => [
    theme.cyan(s.name),
    s.displayName,
    s.version,
    s.category ?? 'other',
    truncate(s.description, 50),
  ]);

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
