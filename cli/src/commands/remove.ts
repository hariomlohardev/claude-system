import { Command } from 'commander';
import { getSystemInstallPath, isInstalled, removeSystem } from '../lib/storage.js';
import { theme } from '../utils/theme.js';
import { handleError } from '../utils/errors.js';

export function registerRemove(program: Command): void {
  program
    .command('remove')
    .alias('uninstall')
    .description('Remove an installed System — deletes ~/.claude-system/systems/<name>/ and its entry in systems.json. This deletes everything in that folder, including any files you added there. Back up first if needed.')
    .argument('<system>', 'System name (kebab-case)')
    .action(async (name: string) => {
      try {
        await runRemove(name);
      } catch (err) {
        handleError(err);
      }
    });
}

async function runRemove(name: string): Promise<void> {
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    console.error(theme.error(`Invalid System name "${name}".`));
    process.exit(1);
  }

  if (!(await isInstalled(name))) {
    console.error(theme.error(`System "${name}" is not installed.`));
    console.error(theme.dim(`  Installed dir: ${getSystemInstallPath(name)}`));
    console.error(theme.dim(`  Try: claude-system list --installed`));
    process.exit(1);
  }

  const path = getSystemInstallPath(name);
  try {
    await removeSystem(name);
  } catch (err) {
    console.error(theme.error(`Failed to remove "${name}": ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }

  console.log(theme.success(`Removed ${theme.cyan(name)}`));
  console.log(theme.dim(`  ← ${path}`));
}
