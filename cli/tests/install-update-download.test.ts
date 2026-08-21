import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { rm, mkdir, writeFile, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp } from 'node:fs/promises';
import { downloadSystemFromGitHub } from '../src/lib/systemDownloader.js';

describe('install + update via shared downloader — generic path', () => {
  let origFetch: typeof globalThis.fetch;
  const tmpDirs: string[] = [];
  const tmpHomes: string[] = [];

  beforeEach(() => {
    origFetch = globalThis.fetch;
  });

  afterEach(async () => {
    globalThis.fetch = origFetch;
    for (const d of tmpDirs.splice(0)) {
      try {
        const tmpRoot = dirname(dirname(d));
        await rm(tmpRoot, { recursive: true, force: true });
      } catch {}
    }
    for (const h of tmpHomes.splice(0)) {
      try { await rm(h, { recursive: true, force: true }); } catch {}
    }
    delete process.env.CLAUDE_SYSTEM_REPO_ROOT;
    delete process.env.CLAUDE_SYSTEM_HOME;
  });

  function track(dir: string): string {
    tmpDirs.push(dir);
    return dir;
  }

  it('install fallback uses shared downloader and includes extra-agent.md', async () => {
    // Simulate install.ts fallback: findRepoSystemSource returns null, so download is used.
    // Mock GitHub Contents to include an extra file the old hardcoded list would have missed.
    const listingRoot = [
      { name: 'system.json', path: 'systems/test-system/system.json', type: 'file', download_url: 'https://raw.githubusercontent.com/hariomlohardev/claude-system/main/systems/test-system/system.json' },
      { name: 'CLAUDE.md', path: 'systems/test-system/CLAUDE.md', type: 'file', download_url: 'https://raw.githubusercontent.com/hariomlohardev/claude-system/main/systems/test-system/CLAUDE.md' },
      { name: 'agents', path: 'systems/test-system/.claude/agents', type: 'dir', url: 'https://api.github.com/repos/hariomlohardev/claude-system/contents/systems/test-system/.claude/agents' },
    ];
    const listingAgents = [
      { name: 'extra-agent.md', path: 'systems/test-system/.claude/agents/extra-agent.md', type: 'file', download_url: 'https://raw.githubusercontent.com/hariomlohardev/claude-system/main/systems/test-system/.claude/agents/extra-agent.md' },
    ];

    globalThis.fetch = (async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/contents/systems/test-system?ref=')) return new Response(JSON.stringify(listingRoot), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (u.includes('/contents/systems/test-system/.claude/agents?ref=')) return new Response(JSON.stringify(listingAgents), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (u.includes('system.json')) return new Response('{"name":"test-system","version":"0.1.0"}', { status: 200 });
      if (u.includes('CLAUDE.md')) return new Response('# test', { status: 200 });
      if (u.includes('extra-agent.md')) return new Response('# extra — proves generic walk', { status: 200 });
      return new Response('not found', { status: 404 });
    }) as never;

    // Force "local not found" — point repo root to empty tmp
    const fakeRepo = await mkdtemp(join(tmpdir(), 'fake-repo-'));
    tmpHomes.push(fakeRepo);
    process.env.CLAUDE_SYSTEM_REPO_ROOT = fakeRepo;
    const { findRepoSystemSource } = await import('../src/lib/repo.js');
    expect(findRepoSystemSource('test-system')).toBeNull();

    const src = track(await downloadSystemFromGitHub({ name: 'test-system' }));
    expect(existsSync(join(src, '.claude/agents/extra-agent.md'))).toBe(true);
    // Simulate install's cp to dest
    const tmpHome = await mkdtemp(join(tmpdir(), 'cs-home-'));
    tmpHomes.push(tmpHome);
    process.env.CLAUDE_SYSTEM_HOME = tmpHome;
    const dest = join(tmpHome, 'systems', 'test-system');
    const { cp } = await import('node:fs/promises');
    await mkdir(dest, { recursive: true });
    await cp(src, dest, { recursive: true, force: true });
    expect(existsSync(join(dest, '.claude/agents/extra-agent.md'))).toBe(true);
  });

  it('update fallback also benefits from generic walk — extra file present', async () => {
    const listingRoot = [
      { name: 'system.json', path: 'systems/test-system/system.json', type: 'file', download_url: 'https://raw.githubusercontent.com/hariomlohardev/claude-system/main/systems/test-system/system.json' },
      { name: 'commands', path: 'systems/test-system/.claude/commands', type: 'dir', url: 'https://api.github.com/repos/hariomlohardev/claude-system/contents/systems/test-system/.claude/commands' },
    ];
    const listingCommands = [
      { name: 'extra-command.md', path: 'systems/test-system/.claude/commands/extra-command.md', type: 'file', download_url: 'https://raw.githubusercontent.com/hariomlohardev/claude-system/main/systems/test-system/.claude/commands/extra-command.md' },
    ];

    globalThis.fetch = (async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/contents/systems/test-system?ref=')) return new Response(JSON.stringify(listingRoot), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (u.includes('/contents/systems/test-system/.claude/commands?ref=')) return new Response(JSON.stringify(listingCommands), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (u.includes('system.json')) return new Response('{"name":"test-system"}', { status: 200 });
      if (u.includes('extra-command.md')) return new Response('# extra command', { status: 200 });
      return new Response('not found', { status: 404 });
    }) as never;

    const fakeRepo = await mkdtemp(join(tmpdir(), 'fake-repo-2-'));
    tmpHomes.push(fakeRepo);
    process.env.CLAUDE_SYSTEM_REPO_ROOT = fakeRepo;
    const { findRepoSystemSource } = await import('../src/lib/repo.js');
    expect(findRepoSystemSource('test-system')).toBeNull();

    const src = track(await downloadSystemFromGitHub({ name: 'test-system' }));
    expect(existsSync(join(src, '.claude/commands/extra-command.md'))).toBe(true);
  });

  it('both install.ts and update.ts import systemDownloader and contain no hardcode', async () => {
    const install = await readFile(join(process.cwd(), 'cli/src/commands/install.ts'), 'utf-8').catch(async () => await readFile(join(process.cwd(), 'src/commands/install.ts'), 'utf-8').catch(() => ''));
    // In tests, cwd is cli/ or repo root — try both
    let installText: string;
    let updateText: string;
    try {
      installText = await readFile(join(process.cwd(), 'src/commands/install.ts'), 'utf-8');
    } catch {
      installText = await readFile('D:/Projects/claude-system/cli/src/commands/install.ts', 'utf-8');
    }
    try {
      updateText = await readFile(join(process.cwd(), 'src/commands/update.ts'), 'utf-8');
    } catch {
      updateText = await readFile('D:/Projects/claude-system/cli/src/commands/update.ts', 'utf-8');
    }
    expect(installText).toContain('systemDownloader');
    expect(updateText).toContain('systemDownloader');
    expect(installText).not.toContain('knownAgents');
    expect(installText).not.toContain('knownCommands');
    expect(installText).not.toContain('We have listing');
    expect(updateText).not.toContain('knownAgents');
    expect(updateText).not.toContain('knownCommands');
  });

  it('InstalledFiles manifest still collected after generic download', async () => {
    const listingRoot = [
      { name: 'system.json', path: 'systems/test-system/system.json', type: 'file', download_url: 'https://raw.githubusercontent.com/hariomlohardev/claude-system/main/systems/test-system/system.json' },
      { name: 'CLAUDE.md', path: 'systems/test-system/CLAUDE.md', type: 'file', download_url: 'https://raw.githubusercontent.com/hariomlohardev/claude-system/main/systems/test-system/CLAUDE.md' },
    ];
    globalThis.fetch = (async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/contents/')) return new Response(JSON.stringify(listingRoot), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (u.includes('system.json')) return new Response('{"name":"test-system","version":"0.1.0"}', { status: 200 });
      if (u.includes('CLAUDE.md')) return new Response('# hi', { status: 200 });
      return new Response('not found', { status: 404 });
    }) as never;

    const src = track(await downloadSystemFromGitHub({ name: 'test-system' }));
    const tmpHome = await mkdtemp(join(tmpdir(), 'cs-home-manifest-'));
    tmpHomes.push(tmpHome);
    process.env.CLAUDE_SYSTEM_HOME = tmpHome;
    const dest = join(tmpHome, 'systems', 'test-system');
    const { cp } = await import('node:fs/promises');
    const { collectInstalledFiles } = await import('../src/lib/storage.js');
    await mkdir(dest, { recursive: true });
    await cp(src, dest, { recursive: true, force: true });
    const files = await collectInstalledFiles(dest);
    expect(files.some((f) => f.path === 'system.json')).toBe(true);
    expect(files.some((f) => f.path === 'CLAUDE.md')).toBe(true);
    expect(files.every((f) => typeof f.sha256 === 'string' && f.sha256.length === 64)).toBe(true);
  });
});
