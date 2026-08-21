import { Command } from 'commander';
import { getSystemInstallPath, isInstalled } from '../lib/storage.js';
import { maybeRunSetup } from '../lib/setupRunner.js';
import { launchClaude } from '../lib/claudeLauncher.js';
import { theme } from '../utils/theme.js';
import { handleError } from '../utils/errors.js';
import { existsSync } from 'node:fs';

export function registerRun(program: Command): void {
  program
    .command('run')
    .description('Run a System in Claude Code (handles setup.sh once-only flow)')
    .argument('<system>', 'System name (kebab-case)')
    .allowUnknownOption(true)
    .allowExcessArguments(true)
    .action(async (name: string, _opts: unknown, command: Command) => {
      try {
        // commander strips --, so args after <name> are passthrough
        const claudeArgs = command.args.slice(1);
        await runSystem(name, claudeArgs);
      } catch (err) {
        handleError(err);
      }
    });
}

async function runSystem(name: string, claudeArgs: string[]): Promise<void> {
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    console.error(theme.error(`Invalid System name "${name}".`));
    process.exit(1);
  }

  if (!(await isInstalled(name))) {
    console.error(theme.error(`System "${name}" is not installed.`));
    console.error(theme.dim(`  Install it first: ${theme.cyan(`claude-system install ${name}`)}`));
    console.error(theme.dim(`  Or browse: ${theme.cyan('claude-system list')}`));
    process.exit(1);
  }

  const systemPath = getSystemInstallPath(name);

  if (!existsSync(systemPath)) {
    console.error(theme.error(`Installed path missing: ${systemPath}`));
    console.error(theme.dim(`  Try: claude-system install ${name}`));
    process.exit(1);
  }

  // setup.sh once-only flow
  const setupResult = await maybeRunSetup(name, systemPath);
  if (!setupResult.success && setupResult.didRun === false && setupResult.message === 'User declined setup consent') {
    // User declined — abort run, do not set setupDone
    console.log(theme.dim('\nRun aborted.'));
    process.exit(0);
  }
  if (setupResult.didRun && !setupResult.success) {
    // setup.sh failed — do not run system, do not set setupDone (so next run re-prompts)
    process.exit(1);
  }

  // Launch claude inside the System directory
  const exitCode = await launchClaude({ systemPath, systemName: name, passthroughArgs: claudeArgs });
  process.exit(exitCode);
}
