/**
 * errors.ts — shared error types and formatting
 */
import { theme } from './theme.js';

export class CliError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number = 1,
    public readonly hint?: string,
  ) {
    super(message);
    this.name = 'CliError';
  }
}

export function handleError(err: unknown): never {
  if (err instanceof CliError) {
    console.error(theme.error(theme.red(err.message)));
    if (err.hint) {
      console.error(theme.dim(`  ${err.hint}`));
    }
    // Polish: add contextual hints for common errors even when CliError already has hint
    if (err.message.includes('not installed') || err.message.includes('ENOENT')) {
      console.error(theme.dim('  Hint: claude-system install <name> or claude-system list --available'));
    }
    if (err.message.includes('EACCES') || err.message.includes('permission')) {
      console.error(theme.dim('  Hint: check permissions on ~/.claude-system — run claude-system doctor'));
    }
    process.exit(err.exitCode);
  }
  if (err instanceof Error) {
    const msg = err.message;
    console.error(theme.error(theme.red(msg)));
    if (msg.includes('ENOENT') || msg.includes('not installed') || msg.includes('not found')) {
      console.error(theme.dim('  Hint: claude-system install <name> or claude-system list --available'));
    }
    if (msg.includes('EACCES') || msg.includes('permission denied') || msg.includes('EACCES')) {
      console.error(theme.dim('  Hint: check permissions on ~/.claude-system — run claude-system doctor'));
    }
    if (process.env.DEBUG) {
      console.error(theme.dim(err.stack ?? ''));
    }
    process.exit(1);
  }
  console.error(theme.error(String(err)));
  process.exit(1);
}

export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${String(x)}`);
}
