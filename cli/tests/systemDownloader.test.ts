import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { downloadSystemFromGitHub } from '../src/lib/systemDownloader.js';

describe('systemDownloader — generic Contents API walk', () => {
  let origFetch: typeof globalThis.fetch;
  const tmpDirs: string[] = [];

  beforeEach(() => {
    origFetch = globalThis.fetch;
  });

  afterEach(async () => {
    globalThis.fetch = origFetch;
    for (const d of tmpDirs.splice(0)) {
      try {
        // d is .../systems/test-system — tmpRoot is two levels up
        const tmpRoot = dirname(dirname(d));
        await rm(tmpRoot, { recursive: true, force: true });
      } catch {}
    }
  });

  function track(dir: string): string {
    tmpDirs.push(dir);
    return dir;
  }

  it('downloads every file in the listing, including extra-agent.md that hardcode would miss', async () => {
    const listingRoot = [
      { name: 'system.json', path: 'systems/test-system/system.json', type: 'file', download_url: 'https://raw.githubusercontent.com/hariomlohardev/claude-system/main/systems/test-system/system.json' },
      { name: 'CLAUDE.md', path: 'systems/test-system/CLAUDE.md', type: 'file', download_url: 'https://raw.githubusercontent.com/hariomlohardev/claude-system/main/systems/test-system/CLAUDE.md' },
      { name: 'agents', path: 'systems/test-system/.claude/agents', type: 'dir', url: 'https://api.github.com/repos/hariomlohardev/claude-system/contents/systems/test-system/.claude/agents' },
    ];
    const listingAgents = [
      { name: 'extra-agent.md', path: 'systems/test-system/.claude/agents/extra-agent.md', type: 'file', download_url: 'https://raw.githubusercontent.com/hariomlohardev/claude-system/main/systems/test-system/.claude/agents/extra-agent.md' },
      { name: 'fit-scorer.md', path: 'systems/test-system/.claude/agents/fit-scorer.md', type: 'file', download_url: 'https://raw.githubusercontent.com/hariomlohardev/claude-system/main/systems/test-system/.claude/agents/fit-scorer.md' },
    ];

    globalThis.fetch = (async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/contents/systems/test-system?ref=')) {
        return new Response(JSON.stringify(listingRoot), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (u.includes('/contents/systems/test-system/.claude/agents?ref=')) {
        return new Response(JSON.stringify(listingAgents), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (u.includes('systems/test-system/system.json')) return new Response('{"name":"test-system"}', { status: 200 });
      if (u.includes('CLAUDE.md')) return new Response('# CLAUDE', { status: 200 });
      if (u.includes('extra-agent.md')) return new Response('# extra agent — would have been missed by hardcoded list', { status: 200 });
      if (u.includes('fit-scorer.md')) return new Response('# fit scorer', { status: 200 });
      return new Response('not found', { status: 404 });
    }) as never;

    const dir = track(await downloadSystemFromGitHub({ name: 'test-system' }));
    expect(existsSync(join(dir, 'system.json'))).toBe(true);
    expect(existsSync(join(dir, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(dir, '.claude/agents/extra-agent.md'))).toBe(true);
    expect(existsSync(join(dir, '.claude/agents/fit-scorer.md'))).toBe(true);
    const extra = readFileSync(join(dir, '.claude/agents/extra-agent.md'), 'utf-8');
    expect(extra).toContain('extra agent');
  });

  it('recurses into subdirs — queue walks agents/ dir on second fetch', async () => {
    const listingRoot = [
      { name: 'system.json', path: 'systems/test-system/system.json', type: 'file', download_url: 'https://raw.githubusercontent.com/hariomlohardev/claude-system/main/systems/test-system/system.json' },
      { name: 'commands', path: 'systems/test-system/.claude/commands', type: 'dir', url: 'https://api.github.com/repos/hariomlohardev/claude-system/contents/systems/test-system/.claude/commands' },
    ];
    const listingCommands = [
      { name: 'new-command.md', path: 'systems/test-system/.claude/commands/new-command.md', type: 'file', download_url: 'https://raw.githubusercontent.com/hariomlohardev/claude-system/main/systems/test-system/.claude/commands/new-command.md' },
    ];

    let apiCalls = 0;
    globalThis.fetch = (async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/contents/systems/test-system?ref=')) {
        apiCalls++;
        return new Response(JSON.stringify(listingRoot), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (u.includes('/contents/systems/test-system/.claude/commands?ref=')) {
        apiCalls++;
        return new Response(JSON.stringify(listingCommands), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (u.includes('system.json')) return new Response('{"name":"test-system"}', { status: 200 });
      if (u.includes('new-command.md')) return new Response('# new command', { status: 200 });
      return new Response('not found', { status: 404 });
    }) as never;

    const dir = track(await downloadSystemFromGitHub({ name: 'test-system' }));
    expect(apiCalls).toBe(2);
    expect(existsSync(join(dir, '.claude/commands/new-command.md'))).toBe(true);
  });

  it('throws on 404 for missing System', async () => {
    globalThis.fetch = (async () => new Response('not found', { status: 404 })) as never;
    await expect(downloadSystemFromGitHub({ name: 'test-system' })).rejects.toThrow(/404/);
  });

  it('throws on 403 and surfaces x-ratelimit-remaining', async () => {
    globalThis.fetch = (async () => new Response('rate limit exceeded', { status: 403, headers: { 'x-ratelimit-remaining': '0' } })) as never;
    await expect(downloadSystemFromGitHub({ name: 'test-system' })).rejects.toThrow(/403.*x-ratelimit-remaining.*0|rate limit/i);
  });

  it('throws when no files found', async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })) as never;
    await expect(downloadSystemFromGitHub({ name: 'test-system' })).rejects.toThrow(/No files found/);
  });

  it('uses injected fetchImpl when provided (no global mock needed)', async () => {
    const listingRoot = [
      { name: 'system.json', path: 'systems/test-system/system.json', type: 'file', download_url: 'https://raw.githubusercontent.com/hariomlohardev/claude-system/main/systems/test-system/system.json' },
    ];
    const mockFetch = (async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/contents/')) return new Response(JSON.stringify(listingRoot), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return new Response('{"name":"test-system"}', { status: 200 });
    }) as unknown as typeof fetch;

    const dir = track(await downloadSystemFromGitHub({ name: 'test-system', fetchImpl: mockFetch }));
    expect(existsSync(join(dir, 'system.json'))).toBe(true);
  });
});
