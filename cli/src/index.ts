#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { theme } from './utils/theme.js';

// Commands
import { registerList } from './commands/list.js';
import { registerSearch } from './commands/search.js';
import { registerInfo } from './commands/info.js';
import { registerInstall } from './commands/install.js';
import { registerRemove } from './commands/remove.js';
import { registerUpdate } from './commands/update.js';
import { registerRun } from './commands/run.js';
import { registerCreate } from './commands/create.js';
import { registerValidate } from './commands/validate.js';
import { registerReport } from './commands/report.js';

function getVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const pkgPath = join(here, '../package.json');
    const raw = readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(raw);
    return pkg.version ?? '0.1.0';
  } catch {
    return '0.1.0';
  }
}

const program = new Command();

program
  .name('claude-system')
  .description(
    `${theme.bold('claude-system')} — ${theme.dim('package-management and ecosystem layer for Claude Code Systems')}\n` +
      theme.dim('Manages environments around Claude Code and shells out to the real `claude` CLI.'),
  )
  .version(getVersion(), '-v, --version', 'output the version number')
  .helpOption('-h, --help', 'display help for command')
  .addHelpText(
    'after',
    `\n${theme.cyan('Examples:')}\n` +
      `  ${theme.dim('$')} ${theme.cyan('claude-system list')}                         ${theme.dim('# browse available Systems')}\n` +
      `  ${theme.dim('$')} ${theme.cyan('claude-system search frontend')}              ${theme.dim('# keyword search')}\n` +
      `  ${theme.dim('$')} ${theme.cyan('claude-system info example-system')}         ${theme.dim('# detailed manifest')}\n` +
      `  ${theme.dim('$')} ${theme.cyan('claude-system install example-system')}      ${theme.dim('# install globally to ~/.claude-system')}\n` +
      `  ${theme.dim('$')} ${theme.cyan('claude-system run example-system')}          ${theme.dim('# launch Claude Code in that System')}\n` +
      `  ${theme.dim('$')} ${theme.cyan('claude-system run example-system -- --help')} ${theme.dim('# pass args to claude')}\n` +
      `\n${theme.dim('Docs:')} ${theme.cyan('docs/creating-a-system.md')}  ${theme.dim('·')} ${theme.cyan('docs/security.md')}  ${theme.dim('·')} ${theme.cyan('SYSTEM_SPEC.md')}\n`,
  );

// Custom help formatting to match Claude Code style — muted, clean
program.configureHelp({
  sortSubcommands: true,
  showGlobalOptions: true,
});

// Register commands
registerList(program);
registerSearch(program);
registerInfo(program);
registerInstall(program);
registerRemove(program);
registerUpdate(program);
registerRun(program);
registerCreate(program);
registerValidate(program);
registerReport(program);

// Global error handling for unknown commands
program.on('command:*', (operands) => {
  console.error(theme.error(`Unknown command: ${operands[0]}`));
  console.error(theme.dim(`  Try: claude-system --help`));
  process.exit(1);
});

// Parse and run
program.parseAsync(process.argv).catch((err) => {
  console.error(theme.error(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
