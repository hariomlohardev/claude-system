import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { maybeRunSetup } from '../src/lib/setupRunner.js';
import * as storage from '../src/lib/storage.js';

describe('setupRunner — once-only consent', () => {
  let tmpHome: string;
  let tmpSystem: string;
  let origHome: string | undefined;

  beforeEach(async () => {
    tmpHome = await mkdtemp(join(tmpdir(), 'claude-system-setup-test-'));
    origHome = process.env.CLAUDE_SYSTEM_HOME;
    process.env.CLAUDE_SYSTEM_HOME = tmpHome;
    tmpSystem = join(tmpHome, 'systems', 'my-system');
    await mkdir(tmpSystem, { recursive: true });
  });

  afterEach(async () => {
    if (origHome === undefined) delete process.env.CLAUDE_SYSTEM_HOME;
    else process.env.CLAUDE_SYSTEM_HOME = origHome;
    await rm(tmpHome, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('skips if no setup.sh', async () => {
    await storage.recordInstall('my-system', '1.0.0');
    const res = await maybeRunSetup('my-system', tmpSystem);
    expect(res.didRun).toBe(false);
    expect(res.success).toBe(true);
  });

  it('skips if setupDone already true', async () => {
    await writeFile(join(tmpSystem, 'setup.sh'), '#!/bin/bash\necho "setup"\n', 'utf-8');
    await storage.recordInstall('my-system', '1.0.0');
    await storage.recordSetupDone('my-system', true);
    const res = await maybeRunSetup('my-system', tmpSystem);
    expect(res.didRun).toBe(false);
  });

  it('aborts if user declines consent (non-TTY defaults to no)', async () => {
    await writeFile(join(tmpSystem, 'setup.sh'), '# WHY: need to install deps\necho "why"\n', 'utf-8');
    await storage.recordInstall('my-system', '1.0.0');
    // process.stdin.isTTY is false in vitest, so promptConsent returns false
    const res = await maybeRunSetup('my-system', tmpSystem);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/declined/);
    // setupDone should remain false
    expect(await storage.getSetupDone('my-system')).toBe(false);
  });

  it('runs setup.sh and sets setupDone on success (mocked consent)', async () => {
    // Create a simple setup.sh that exits 0
    await writeFile(join(tmpSystem, 'setup.sh'), '#!/bin/bash\n# WHY: test setup\necho "setup ok"\nexit 0\n', 'utf-8');
    await storage.recordInstall('my-system', '1.0.0');

    const res = await maybeRunSetup('my-system', tmpSystem, { promptFn: async () => true });
    expect(res.didRun).toBe(true);
    expect(res.success).toBe(true);
    expect(await storage.getSetupDone('my-system')).toBe(true);
  });

  it('does not set setupDone if setup.sh fails', async () => {
    await writeFile(join(tmpSystem, 'setup.sh'), '#!/bin/bash\necho "fail"\nexit 1\n', 'utf-8');
    await storage.recordInstall('my-system', '1.0.0');

    const res = await maybeRunSetup('my-system', tmpSystem, { promptFn: async () => true });
    expect(res.didRun).toBe(true);
    expect(res.success).toBe(false);
    expect(await storage.getSetupDone('my-system')).toBe(false);
  });
});
