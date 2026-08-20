/**
 * theme.ts — Claude Code CLI theme
 *
 * Keep it thin, professional, not flashy. Matches Claude Code's own CLI:
 * muted palette, minimal box language, same help/error/success phrasing.
 */

// ANSI helpers — no extra deps, works in all terminals.
// Respect NO_COLOR and non-TTY.
const enabled = !process.env.NO_COLOR && process.stdout.isTTY !== false;

function ansi(code: string, text: string): string {
  if (!enabled) return text;
  return `\x1b[${code}m${text}\x1b[0m`;
}

export const theme = {
  // colors — muted, Claude-like
  dim: (s: string) => ansi('2', s),
  bold: (s: string) => ansi('1', s),
  cyan: (s: string) => ansi('36', s),
  green: (s: string) => ansi('32', s),
  red: (s: string) => ansi('31', s),
  yellow: (s: string) => ansi('33', s),
  magenta: (s: string) => ansi('35', s),
  gray: (s: string) => ansi('90', s),

  // compound
  primary: (s: string) => ansi('36', s), // cyan is primary
  accent: (s: string) => ansi('33', s),

  // symbols — same language as Claude Code
  success: (s: string) => `${ansi('32', '✓')} ${s}`,
  error: (s: string) => `${ansi('31', '✗')} ${s}`,
  warn: (s: string) => `${ansi('33', '⚠')} ${s}`,
  info: (s: string) => `${ansi('36', '›')} ${s}`,
  bullet: (s: string) => `${ansi('90', '·')} ${s}`,

  // box — simple, not flashy
  box: (title: string, lines: string[]): string => {
    const width = Math.max(title.length, ...lines.map((l) => stripAnsi(l).length));
    const pad = (str: string, len: number) => str + ' '.repeat(Math.max(0, len - stripAnsi(str).length));
    const top = ansi('90', `┌─ ${title} ${'─'.repeat(Math.max(0, width - title.length - 1))}┐`);
    const bottom = ansi('90', `└${'─'.repeat(width + 4)}┘`);
    const body = lines.map((l) => `${ansi('90', '│')} ${pad(l, width)} ${ansi('90', '│')}`).join('\n');
    return [top, body, bottom].join('\n');
  },
};

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

// Helpers for common messages
export function formatSuccess(message: string): string {
  return theme.success(message);
}

export function formatError(message: string): string {
  return theme.error(theme.red(message));
}

export function formatWarning(message: string): string {
  return theme.warn(theme.yellow(message));
}

export function formatInfo(message: string): string {
  return theme.info(theme.dim(message));
}

// Help formatting helpers — commander will call these
export function helpHeader(text: string): string {
  return theme.bold(text);
}

export function helpSection(title: string, body: string): string {
  return `${theme.cyan(title)}\n  ${body}`;
}
