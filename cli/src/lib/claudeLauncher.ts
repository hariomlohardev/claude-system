/**
 * claudeLauncher.ts — shell out to the real `claude` CLI
 * Never reimplements Claude Code; just launches it in the right System context.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { theme } from '../utils/theme.js';

export interface LaunchOptions {
  systemPath: string;
  systemName: string;
  passthroughArgs: string[];
}

export function launchClaude(options: LaunchOptions): Promise<number> {
  const { systemPath, passthroughArgs } = options;

  // Verify systemPath exists
  if (!existsSync(systemPath)) {
    console.error(theme.error(`System directory not found: ${systemPath}`));
    console.error(theme.dim(`  Try: claude-system install ${options.systemName}`));
    return Promise.resolve(1);
  }

  // Build claude args — forward everything after --
  // In v1 we simply spawn `claude` with the system directory as cwd,
  // so that claude picks up that System's CLAUDE.md, .claude/commands, agents, hooks.
  const claudeArgs = [...passthroughArgs];

  console.log(theme.info(`Launching Claude Code in ${theme.cyan(systemPath)}`));
  if (claudeArgs.length > 0) {
    console.log(theme.dim(`  claude ${claudeArgs.join(' ')}`));
  }
  console.log('');

  return new Promise((resolve) => {
    const child = spawn('claude', claudeArgs, {
      cwd: systemPath,
      stdio: 'inherit',
      env: process.env,
    });

    child.on('close', (code) => {
      resolve(code ?? 0);
    });

    child.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        console.error(theme.error('`claude` CLI not found.'));
        console.error(theme.dim('  Install Claude Code: https://docs.anthropic.com/en/docs/claude-code'));
        console.error(theme.dim('  Or ensure `claude` is on your PATH and try again.'));
        resolve(1);
      } else {
        console.error(theme.error(`Failed to launch claude: ${err.message}`));
        resolve(1);
      }
    });
  });
}

// For testing — allow mocking
export let _launchFn = launchClaude;
export function setLaunchFn(fn: typeof launchClaude): void {
  _launchFn = fn;
}
