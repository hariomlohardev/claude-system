/**
 * systemDownloader.ts — generic System download via GitHub Contents API
 * No hardcoded file lists. Works for any System, any agent/command count.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp } from 'node:fs/promises';

type Fetch = typeof fetch;

export async function downloadSystemFromGitHub(opts: {
  name: string;
  owner?: string;
  repo?: string;
  ref?: string;
  fetchImpl?: Fetch;
}): Promise<string> {
  const owner = opts.owner ?? 'hariomlohardev';
  const repo = opts.repo ?? 'claude-system';
  const ref = opts.ref ?? 'main';
  const fetchImpl = opts.fetchImpl ?? fetch;

  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/systems/${opts.name}`;

  const files: Array<{ path: string; download_url: string | null; type: 'file' | 'dir'; url?: string }> = [];
  const queue: string[] = [`${apiBase}?ref=${ref}`];

  while (queue.length) {
    const url = queue.shift()!;
    const res = await fetchImpl(url, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    } as never);
    if (!res.ok) {
      const remaining = (res.headers as Headers)?.get?.('x-ratelimit-remaining') ?? '';
      const body = await res.text().catch(() => '');
      const rateInfo = remaining !== '' ? ` (x-ratelimit-remaining: ${remaining})` : '';
      throw new Error(`GitHub contents ${res.status} for ${url}${rateInfo}: ${body}`.trim());
    }
    const data: unknown = await res.json();
    const entries: Array<{
      type: string;
      path?: string;
      download_url?: string | null;
      url?: string;
      name?: string;
    }> = Array.isArray(data) ? (data as never[]) : [data as never];
    for (const e of entries) {
      if (e.type === 'file' && e.path) {
        files.push({ path: e.path as string, download_url: (e.download_url as string | null) ?? null, type: 'file' });
      } else if (e.type === 'dir' && e.url) {
        queue.push(`${e.url}?ref=${ref}`);
      }
    }
  }

  if (files.length === 0) throw new Error(`No files found for systems/${opts.name} at ${ref}`);

  const tmpRoot = await mkdtemp(join(tmpdir(), `cs-${opts.name}-`));

  for (const f of files) {
    const url = f.download_url ?? `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${f.path}`;
    const r = await fetchImpl(url as never);
    if (!r.ok) {
      const body = await r.text().catch(() => '');
      throw new Error(`download ${r.status} ${url}: ${body}`.trim());
    }
    const buf = Buffer.from(await r.arrayBuffer());
    const out = join(tmpRoot, f.path);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, buf);
  }

  // Must have at least system.json to be valid — else the download is corrupt
  const systemJsonPath = join(tmpRoot, 'systems', opts.name, 'system.json');
  const { existsSync } = await import('node:fs');
  if (!existsSync(systemJsonPath)) throw new Error(`No files found for systems/${opts.name} at ${ref} — missing system.json`);

  // Ensure drafts dir exists even if empty in git (not listed by Contents API)
  try { await mkdir(join(tmpRoot, 'systems', opts.name, '.claude/state/drafts'), { recursive: true }); } catch {}

  return join(tmpRoot, 'systems', opts.name);
}

// Helper for tests to list without downloading — kept minimal.
export async function listSystemFilesFromGitHub(
  opts: Parameters<typeof downloadSystemFromGitHub>[0],
): Promise<string[]> {
  const dir = await downloadSystemFromGitHub(opts);
  // Return the downloaded dir's existence as proof; caller inspects via fs.
  // For mock-friendly tests, just return the dir in an array.
  return [dir];
}
