/**
 * setupRunner.ts — setup.sh once-only consent flow
 * Only on first `run`, never on install, never on subsequent runs.
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { theme } from '../utils/theme.js';
import { getSetupDone, recordSetupDone } from './storage.js';

export interface SetupResult {
  didRun: boolean;
  success: boolean;
  message?: string;
}

function extractWhyMessage(content: string): string {
  // Author must include echo/comment explaining why setup is needed.
  // We surface the first meaningful WHY/echo/comment block.
  // Look for lines containing WHY, or echo "...", or comments after shebang.
  const lines = content.split('\n');
  const candidates: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#!')) continue;
    if (line.startsWith('# WHY')) {
      candidates.push(line.replace(/^#\s*WHY:?\s*/i, '').trim());
    } else if (line.startsWith('# why')) {
      candidates.push(line.replace(/^#\s*why:?\s*/i, '').trim());
    } else if (line.startsWith('#') && line.length > 10 && !line.startsWith('# shellcheck')) {
      // Generic comment as fallback, but prefer WHY-tagged
      if (candidates.length === 0) candidates.push(line.replace(/^#\s*/, '').trim());
    } else if (line.startsWith('echo ')) {
      const m = line.match(/echo\s+["'](.+?)["']/);
      if (m && m[1]) candidates.push(m[1].trim());
    }
  }

  if (candidates.length > 0) {
    // Return first non-empty meaningful candidate, truncated
    const why = candidates.find((c) => c.length > 5) ?? candidates[0];
    return why ?? 'This System requires initial setup (installs dependencies, verifies prerequisites).';
  }

  // Fallback — surface first 2 non-comment lines as hint
  const echoLines = lines.filter((l) => l.trim().startsWith('echo')).slice(0, 2).join(' ');
  if (echoLines) return echoLines.slice(0, 200);
  return 'This System requires initial setup (installs dependencies, verifies prerequisites).';
}

export async function promptConsent(whyMessage: string): Promise<boolean> {
  // Themed consent prompt like Claude Code's confirmations
  console.log('');
  console.log(theme.box('Setup required', [theme.yellow(whyMessage.slice(0, 80)), theme.dim('This executes shell code from the System.')] ));
  console.log(theme.dim('  The System will run setup.sh inside ~/.claude-system/systems/<name>/'));
  console.log('');

  // If not a TTY (CI/test), default to no — require explicit interaction
  if (!process.stdin.isTTY) {
    console.log(theme.dim('  Non-interactive terminal — skipping setup. Run in a TTY to consent.'));
    return false;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer: string = await new Promise((resolve) => {
    rl.question(theme.bold('  Are you sure you want to continue? (y/N) '), (ans) => {
      rl.close();
      resolve(ans.trim().toLowerCase());
    });
  });

  return answer === 'y' || answer === 'yes';
}

function runScript(scriptPath: string, cwd: string): Promise<{ exitCode: number; output: string }> {
  return new Promise((resolve) => {
    const child = spawn('bash', [scriptPath], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });

    let output = '';
    child.stdout?.on('data', (d) => {
      const s = d.toString();
      output += s;
      process.stdout.write(s);
    });
    child.stderr?.on('data', (d) => {
      const s = d.toString();
      output += s;
      process.stderr.write(theme.dim(s));
    });

    child.on('close', (code) => {
      resolve({ exitCode: code ?? 1, output });
    });
    child.on('error', (err) => {
      resolve({ exitCode: 1, output: output + `\nFailed to execute setup.sh: ${err.message}` });
    });
  });
}

export async function maybeRunSetup(name: string, systemPath: string, opts?: { promptFn?: (msg: string) => Promise<boolean> }): Promise<SetupResult> {
  const setupPath = join(systemPath, 'setup.sh');

  if (!existsSync(setupPath)) {
    return { didRun: false, success: true };
  }

  const setupDone = await getSetupDone(name);
  if (setupDone) {
    // Never run again, even if prerequisites later become invalid — intentional for v1
    return { didRun: false, success: true };
  }

  // First run with setup.sh present and setupDone === false
  let whyMessage = 'Initial setup required.';
  try {
    const content = await readFile(setupPath, 'utf-8');
    whyMessage = extractWhyMessage(content);
  } catch {
    // ignore, use default
  }

  const prompt = opts?.promptFn ?? promptConsent;
  const consented = await prompt(whyMessage);
  if (!consented) {
    console.log(theme.dim('\n  Setup skipped. Run will be aborted. Next `claude-system run ' + name + '` will prompt again.'));
    return { didRun: false, success: false, message: 'User declined setup consent' };
  }

  console.log(theme.info(`\n  Running setup.sh for ${name}...`));
  console.log(theme.dim(`  ${setupPath}`));
  console.log('');

  const result = await runScript(setupPath, systemPath);

  if (result.exitCode !== 0) {
    // Surface output as-is, do NOT set setupDone, do NOT run system
    console.error('');
    console.error(theme.error(`setup.sh failed with exit code ${result.exitCode}`));
    console.error(theme.dim('  Its output is shown above. Fix the issue and run again — setup will be re-prompted.'));
    return { didRun: true, success: false, message: result.output };
  }

  console.log('');
  console.log(theme.success(`setup.sh completed successfully.`));
  await recordSetupDone(name, true);
  return { didRun: true, success: true };
}

export function getSetupPath(name: string, systemPath: string): string {
  return join(systemPath, 'setup.sh');
}
