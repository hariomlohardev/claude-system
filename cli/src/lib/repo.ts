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

  // Explicit override for tests — highest priority
  if (process.env.CLAUDE_SYSTEM_REPO_ROOT) {
    candidates.push(join(process.env.CLAUDE_SYSTEM_REPO_ROOT, 'systems', name));
  }

  // From cli/dist location — robust from any cwd (global install or dev)
  // cli/dist/lib/repo.js → repo is ../../.. ; cli/dist/index.js → repo is ../..
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    // here is cli/dist/lib (when compiled) or cli/dist (if flat)
    // Try repo root at 3 levels up (lib case), 2 levels up (dist case), and 1 level up (edge)
    candidates.push(resolve(here, '../../../systems', name)); // lib → repo
    candidates.push(resolve(here, '../../systems', name));   // dist → repo  or lib→cli (fallback)
    candidates.push(resolve(here, '../systems', name));      // edge
  } catch {
    // ignore
  }

  // From cwd — last resort for dev when running from repo root
  candidates.push(resolve(process.cwd(), 'systems', name));
  candidates.push(resolve(process.cwd(), '..', 'systems', name));

  for (const p of candidates) {
    if (existsSync(p) && existsSync(join(p, 'system.json'))) {
      return p;
    }
  }
  return null;
}

export function findTemplateSource(): string | null {
  const candidates: string[] = [];
  if (process.env.CLAUDE_SYSTEM_REPO_ROOT) {
    candidates.unshift(join(process.env.CLAUDE_SYSTEM_REPO_ROOT, 'template/starter-system'));
  }
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    candidates.push(resolve(here, '../../../template/starter-system')); // lib → repo
    candidates.push(resolve(here, '../../template/starter-system'));   // dist → repo
    candidates.push(resolve(here, '../template/starter-system'));
  } catch {}
  candidates.push(resolve(process.cwd(), 'template/starter-system'));
  for (const p of candidates) {
    if (existsSync(p) && existsSync(join(p, 'system.json'))) return p;
  }
  return null;
}
