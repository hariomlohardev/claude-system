/**
 * format.ts — table-like output helpers, Claude Code themed
 */
import { theme } from './theme.js';

export interface TableColumn {
  header: string;
  width?: number;
  truncate?: number;
}

export function formatTable(
  rows: string[][],
  columns: TableColumn[],
  options: { showHeader?: boolean } = {},
): string {
  const showHeader = options.showHeader ?? true;
  const colWidths = columns.map((c, i) => {
    const headerLen = c.header.length;
    const maxRowLen = Math.max(...rows.map((r) => (r[i] ?? '').length), 0);
    const desired = c.width ?? Math.max(headerLen, maxRowLen);
    if (c.truncate) return Math.min(desired, c.truncate);
    return desired;
  });

  const lines: string[] = [];

  if (showHeader) {
    const header = columns.map((c, i) => pad(c.header, colWidths[i]!)).join('  ');
    lines.push(theme.bold(theme.cyan(header)));
    lines.push(theme.dim(colWidths.map((w) => '─'.repeat(w)).join('  ')));
  }

  for (const row of rows) {
    const line = row
      .map((cell, i) => {
        const w = colWidths[i]!;
        const truncated = columns[i]?.truncate && cell.length > columns[i]!.truncate! ? cell.slice(0, columns[i]!.truncate! - 3) + '...' : cell;
        return pad(truncated, w);
      })
      .join('  ');
    lines.push(line);
  }

  return lines.join('\n');
}

function pad(str: string, len: number): string {
  const stripped = str.replace(/\x1b\[[0-9;]*m/g, '');
  if (stripped.length >= len) return str;
  return str + ' '.repeat(len - stripped.length);
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + '...';
}
