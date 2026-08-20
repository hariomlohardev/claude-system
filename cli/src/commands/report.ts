import { Command } from 'commander';
import { findInRegistry, getRegistrySource } from '../lib/registry.js';
import { getSystemInstallPath, isInstalled } from '../lib/storage.js';
import { theme } from '../utils/theme.js';
import { handleError } from '../utils/errors.js';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { exec } from 'node:child_process';

const MONOREPO_ISSUES = 'https://github.com/hariomlohardev/claude-system/issues';

function buildIssueUrl(systemName: string, bugsUrl: string | null, repository: string | null): string {
  let base: string;
  if (bugsUrl) base = bugsUrl;
  else if (repository) base = `${repository.replace(/\/$/, '')}/issues`;
  else base = MONOREPO_ISSUES;

  // If base is already an issues URL, add new issue template params
  // GitHub new issue URL: /issues/new?title=[system]&body=...
  const isGitHub = base.includes('github.com');
  if (isGitHub) {
    // If base ends with /issues, turn into /issues/new
    const newBase = base.endsWith('/issues') ? `${base}/new` : base.includes('/issues/new') ? base : `${base}/new`;
    const title = encodeURIComponent(`[${systemName}] `);
    const body = encodeURIComponent(
      `<!-- Describe the issue with the System "${systemName}" -->\n\n**System:** ${systemName}\n**Version:** \n**Steps to reproduce:**\n1. \n\n**Expected:**\n\n**Actual:**\n`,
    );
    const labels = !bugsUrl && !repository ? `&labels=system:${systemName}` : '';
    return `${newBase}?title=${title}&body=${body}${labels}`;
  }

  return base;
}

function openUrl(url: string): void {
  const platform = process.platform;
  let cmd: string;
  if (platform === 'darwin') cmd = `open "${url}"`;
  else if (platform === 'win32') cmd = `start "" "${url}"`;
  else cmd = `xdg-open "${url}"`;

  exec(cmd, (err) => {
    if (err) {
      console.log(theme.dim('  Could not open browser automatically. Please open the URL manually.'));
    } else {
      console.log(theme.success('Opened in browser.'));
    }
  });
}

export function registerReport(program: Command): void {
  program
    .command('report')
    .description('Open the issue tracker for a System')
    .argument('<system>', 'System name (kebab-case)')
    .option('--no-open', 'print the URL instead of opening it')
    .action(async (name: string, opts: { open?: boolean }) => {
      try {
        await runReport(name, opts);
      } catch (err) {
        handleError(err);
      }
    });
}

async function runReport(name: string, opts: { open?: boolean }): Promise<void> {
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    console.error(theme.error(`Invalid System name "${name}".`));
    process.exit(1);
  }

  let bugsUrl: string | null = null;
  let repository: string | null = null;

  // Prefer installed system.json if present
  if (await isInstalled(name)) {
    const p = join(getSystemInstallPath(name), 'system.json');
    if (existsSync(p)) {
      try {
        const raw = await readFile(p, 'utf-8');
        const json = JSON.parse(raw);
        bugsUrl = json.bugs?.url ?? null;
        repository = json.repository ?? null;
      } catch {}
    }
  }

  // Fallback to registry if not installed or missing fields
  if (!bugsUrl && !repository) {
    try {
      const entry = await findInRegistry(name);
      if (entry) {
        // Registry entry doesn't have bugs/repository — try to fetch full manifest via registry source?
        // For now, if not installed we can't know, so use monorepo fallback
      }
    } catch {
      // ignore registry fetch failure — use fallback
    }

    // Try reading from local repo systems/<name>/system.json as last resort (dev)
    if (!bugsUrl && !repository) {
      const candidates = [
        join(process.cwd(), 'systems', name, 'system.json'),
        join(process.cwd(), '..', 'systems', name, 'system.json'),
      ];
      for (const c of candidates) {
        if (existsSync(c)) {
          try {
            const raw = await readFile(c, 'utf-8');
            const json = JSON.parse(raw);
            bugsUrl = json.bugs?.url ?? null;
            repository = json.repository ?? null;
            if (bugsUrl || repository) break;
          } catch {}
        }
      }
    }
  }

  const url = buildIssueUrl(name, bugsUrl, repository);

  console.log(theme.bold(`Issue tracker for ${theme.cyan(name)}`));
  if (bugsUrl) console.log(theme.dim(`  bugs.url: ${bugsUrl}`));
  else if (repository) console.log(theme.dim(`  repository: ${repository} → ${url}`));
  else console.log(theme.dim(`  fallback: ${MONOREPO_ISSUES} (tagged system:${name})`));
  console.log('');
  console.log(`  ${theme.cyan(url)}`);
  console.log('');

  const shouldOpen = opts.open !== false;
  if (shouldOpen) {
    console.log(theme.dim('  Opening in browser...'));
    openUrl(url);
  } else {
    console.log(theme.dim('  (--no-open: not opening browser)'));
  }
}
