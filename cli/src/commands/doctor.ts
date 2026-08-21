import { Command } from 'commander';
import { theme } from '../utils/theme.js';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { getSystemsDir, listInstalled } from '../lib/storage.js';

export function registerDoctor(program: Command): void {
  program
    .command('doctor')
    .description('Diagnose claude-system setup (Node, claude, registry, gh, store)')
    .action(async () => {
      await runDoctor();
    });
}

async function runDoctor(): Promise<void> {
  let failed = false;
  const ok = (msg: string) => console.log(theme.success(msg));
  const fail = (msg: string) => { console.log(theme.error(msg)); failed = true; };
  const warn = (msg: string) => console.log(theme.warn(msg));
  const dim = (msg: string) => console.log(theme.dim(msg));

  // Node >=18
  try {
    const v = process.version.replace(/^v/, '');
    const maj = parseInt(v.split('.')[0] || '0', 10);
    if (maj >= 18) ok(`Node >=18 (v${v})`);
    else fail(`Node >=18 required (found v${v}) — upgrade at https://nodejs.org`);
  } catch {
    fail('Node check failed');
  }

  // claude CLI
  try {
    const out = execSync('claude --version 2>&1', { encoding: 'utf-8', timeout: 3000 }).trim();
    const loc = (() => { try { return execSync('which claude 2>/dev/null || where claude 2>nul', { encoding: 'utf-8' }).trim().split('\n')[0]; } catch { return 'unknown'; }})();
    ok(`claude CLI installed (${out} at ${loc})`);
  } catch {
    warn('claude CLI not found — install from https://docs.anthropic.com/claude-code');
    dim('  Some Systems shell out to `claude` — install it to use `claude-system run`');
  }

  // registry reachable (Vercel primary)
  try {
    const url = process.env.CLAUDE_SYSTEM_REGISTRY_URL || 'https://claude-system-tau.vercel.app/api/registry';
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    clearTimeout(t);
    if (r.ok) {
      const j = await r.json() as any;
      const n = j.systems ? j.systems.length : 0;
      ok(`registry reachable (${url} — ${n} systems)`);
    } else {
      fail(`registry unreachable (${url} — ${r.status} ${r.statusText}) — fallback to raw will be used`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    fail(`registry unreachable — ${msg} — fallback to raw`);
  }

  // Supabase
  if (process.env.SUPABASE_URL) {
    try {
      const url = process.env.SUPABASE_URL;
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 5000);
      const r = await fetch(url, { signal: controller.signal });
      clearTimeout(t);
      if (r.ok || r.status === 401 || r.status === 403) ok(`Supabase reachable (${url})`);
      else fail(`Supabase unreachable (${url} — ${r.status})`);
    } catch (e) {
      fail(`Supabase unreachable — ${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
    dim('Supabase not configured (SUPABASE_URL not set) — skip');
  }

  // gh auth
  try {
    const out = execSync('gh auth status 2>&1', { encoding: 'utf-8', timeout: 3000 });
    if (out.includes('Logged in') || out.includes('active account')) {
      let user = 'unknown';
      try { user = execSync('gh api user --jq .login 2>&1', { encoding: 'utf-8', timeout: 3000 }).trim(); } catch {}
      ok(`gh auth (logged in as ${user})`);
    } else {
      warn('gh not logged in — run `gh auth login -h github.com` for Systems that use gh');
    }
  } catch {
    warn('gh not logged in — run `gh auth login -h github.com`');
  }

  // install dir
  try {
    const dir = getSystemsDir();
    const exists = existsSync(dir);
    if (exists) {
      const installed = await listInstalled();
      ok(`install dir ${dir} (exists, ${installed.length} installed)`);
    } else {
      warn(`install dir ${dir} (not yet created — run claude-system install <name>)`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('EACCES') || msg.includes('permission')) {
      fail(`install dir permission error — check permissions on ~/.claude-system — ${msg}`);
      dim('  Hint: check permissions on ~/.claude-system — run doctor');
    } else {
      warn(`install dir check failed — ${msg}`);
    }
  }

  if (failed) {
    dim('');
    dim('Some checks failed — see hints above. Run with NO_COLOR=1 for plain output.');
    process.exit(1);
  } else {
    dim('');
    dim('All checks passed · claude-system is ready');
  }
}
