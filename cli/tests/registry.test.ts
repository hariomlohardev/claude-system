import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GitHubRegistry, setRegistrySource, getRegistrySource } from '../src/lib/registry.js';

const sampleIndex = {
  $schema: '../schemas/registry-index.schema.json',
  generatedAt: new Date().toISOString(),
  systems: [
    {
      name: 'example-system',
      displayName: 'Example',
      version: '0.1.0',
      description: 'A valid description long enough for the registry entry.',
      author: { name: 'Test' },
      license: 'MIT',
      keywords: ['example'],
      path: 'systems/example-system',
    },
    {
      name: 'frontend',
      displayName: 'Frontend',
      version: '1.2.0',
      description: 'Frontend system for UI work with a long enough description.',
      author: { name: 'Author' },
      license: 'MIT',
      keywords: ['frontend', 'ui'],
      category: 'frontend' as const,
      path: 'systems/frontend',
    },
  ],
};

describe('GitHubRegistry (always fresh, no cache)', () => {
  let tmpFile: string;
  let origFetch: typeof globalThis.fetch;

  beforeEach(async () => {
    const dir = await mkdtemp(join(tmpdir(), 'registry-test-'));
    tmpFile = join(dir, 'index.json');
    await writeFile(tmpFile, JSON.stringify(sampleIndex), 'utf-8');
    origFetch = globalThis.fetch;
  });

  afterEach(async () => {
    globalThis.fetch = origFetch;
    try { await rm(tmpFile, { force: true }); await rm(join(tmpFile, '..'), { recursive: true, force: true }); } catch {}
  });

  it('fetches via file:// url and validates', async () => {
    const reg = new GitHubRegistry(`file://${tmpFile}`);
    const idx = await reg.fetchIndex();
    expect(idx.systems.length).toBe(2);
    expect(idx.systems[0]!.name).toBe('example-system');
  });

  it('always fetches fresh (no cache) — calls fetch each time', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls++;
      return new Response(JSON.stringify(sampleIndex), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as never;

    const reg = new GitHubRegistry('https://example.com/registry/index.json');
    // Mock local fallback to fail, so it uses network
    // We can't easily mock tryLocalFallback, so we just test fetch is called
    await reg.fetchIndex();
    expect(calls).toBe(1);
    await reg.fetchIndex();
    expect(calls).toBe(2);
  });

  it('searches across name, displayName, description, keywords', async () => {
    const reg = new GitHubRegistry(`file://${tmpFile}`);
    setRegistrySource(reg);
    const { searchRegistry } = await import('../src/lib/registry.js');
    const results = await searchRegistry('frontend');
    expect(results.length).toBe(1);
    expect(results[0]!.name).toBe('frontend');

    const byKeyword = await searchRegistry('example');
    expect(byKeyword.length).toBe(1);

    const byDesc = await searchRegistry('UI work');
    expect(byDesc.length).toBe(1);
  });
});
