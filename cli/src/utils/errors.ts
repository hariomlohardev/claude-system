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
    process.exit(err.exitCode);
  }
  if (err instanceof Error) {
    console.error(theme.error(theme.red(err.message)));
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
