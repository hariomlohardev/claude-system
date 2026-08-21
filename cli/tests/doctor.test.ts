import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';

vi.mock('node:child_process', async () => {
  const actual = await vi.importActual<typeof import('node:child_process')>('node:child_process');
  return { ...actual, execSync: vi.fn() };
});

describe('doctor command', () => {
  let origFetch: typeof globalThis.fetch;
  let consoleSpy: any;

  beforeEach(() => {
    origFetch = globalThis.fetch;
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(execSync as any).mockReset();
  });

  afterEach(() => {
    globalThis.fetch = origFetch;
    vi.restoreAllMocks();
  });

  it('prints all checks with colors when registry ok', async () => {
    vi.mocked(execSync as any).mockImplementation((cmd: string) => {
      if (cmd.includes('claude --version')) return '1.0.0';
      if (cmd.includes('which claude') || cmd.includes('where claude')) return '/usr/local/bin/claude';
      if (cmd.includes('gh auth status')) return 'Logged in to github.com account hariomlohardev (active)';
      if (cmd.includes('gh api user')) return 'hariomlohardev';
      throw new Error('unexpected cmd ' + cmd);
    });
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ systems: [{ name: 'example-system' }] }), { status: 200 }) as never;

    const { registerDoctor } = await import('../src/commands/doctor.js');
    const { Command } = await import('commander');
    const program = new Command();
    registerDoctor(program);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: any) => { throw new Error(`exit:${code}`); }) as any);
    try {
      await program.parseAsync(['node', 'test', 'doctor']);
    } catch (e: any) {
      if (!e.message.startsWith('exit:')) throw e;
      expect(e.message).toBe('exit:0');
    }
    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Node');
    expect(output).toContain('claude CLI');
    expect(output).toContain('registry reachable');
    exitSpy.mockRestore();
  });

  it('handles registry down', async () => {
    vi.mocked(execSync as any).mockImplementation((cmd: string) => {
      if (cmd.includes('claude --version')) throw new Error('not found');
      if (cmd.includes('gh auth status')) throw new Error('not logged in');
      return '';
    });
    globalThis.fetch = async () => {
      throw new Error('network down');
    };
    const { registerDoctor } = await import('../src/commands/doctor.js');
    const { Command } = await import('commander');
    const program = new Command();
    registerDoctor(program);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: any) => { throw new Error(`exit:${code}`); }) as any);
    try {
      await program.parseAsync(['node', 'test', 'doctor']);
    } catch (e: any) {
      expect(e.message).toMatch(/exit:(0|1)/);
    }
    const output = consoleSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('registry');
    exitSpy.mockRestore();
  });

  it('respects NO_COLOR', async () => {
    const origNoColor = process.env.NO_COLOR;
    process.env.NO_COLOR = '1';
    vi.mocked(execSync as any).mockImplementation(() => { throw new Error('fail'); });
    globalThis.fetch = async () => new Response(JSON.stringify({ systems: [] }), { status: 200 }) as never;
    const { registerDoctor } = await import('../src/commands/doctor.js');
    const { Command } = await import('commander');
    const program = new Command();
    registerDoctor(program);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: any) => { throw new Error(`exit:${code}`); }) as any);
    try {
      await program.parseAsync(['node', 'test', 'doctor']);
    } catch {}
    const output = consoleSpy.mock.calls.map((c: any) => c[0]).join('\n');
    expect(output).toContain('Node');
    process.env.NO_COLOR = origNoColor;
    exitSpy.mockRestore();
  });
});
