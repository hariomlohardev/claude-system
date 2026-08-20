/**
 * repo.ts — locate the source System folder for install/update
 * In dev (running from repo), copy from local filesystem.
 * In installed binary, fetch from GitHub.
 */
import { existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export function findRepoSystemSource(name: string): string | null {
  const candidates: string[] = [];

  // From cli/dist location, repo root is ../../
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    candidates.push(resolve(here, '../../systems', name));
    candidates.push(resolve(here, '../../../systems', name));
  } catch {
    // ignore
  }

  // From cwd
  candidates.push(resolve(process.cwd(), 'systems', name));
  candidates.push(resolve(process.cwd(), '..', 'systems', name));

  // From env override
  if (process.env.CLAUDE_SYSTEM_REPO_ROOT) {
    candidates.unshift(join(process.env.CLAUDE_SYSTEM_REPO_ROOT, 'systems', name));
  }

  for (const p of candidates) {
    if (existsSync(p) && existsSync(join(p, 'system.json'))) {
      return p;
    }
  }
  return null;
}

export function findTemplateSource(): string | null {
  const candidates: string[] = [];
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    candidates.push(resolve(here, '../../template/starter-system'));
    candidates.push(resolve(here, '../../../template/starter-system'));
  } catch {}
  candidates.push(resolve(process.cwd(), 'template/starter-system'));
  if (process.env.CLAUDE_SYSTEM_REPO_ROOT) {
    candidates.unshift(join(process.env.CLAUDE_SYSTEM_REPO_ROOT, 'template/starter-system'));
  }
  for (const p of candidates) {
    if (existsSync(p) && existsSync(join(p, 'system.json'))) return p;
  }
  return null;
}
