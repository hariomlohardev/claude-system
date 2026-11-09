import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, readFile, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { runValidate } from '../src/commands/validate.js';

describe('validate command', () => {
  let tmpRoot: string;

  beforeEach(async () => {
    tmpRoot = await mkdtemp(join(tmpdir(), 'validate-test-'));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(tmpRoot, { recursive: true, force: true });
  });

  async function createValidSystem(name: string): Promise<string> {
    const sysPath = join(tmpRoot, 'systems', name);
    await mkdir(sysPath, { recursive: true });
    const systemJson = {
      name,
      displayName: 'Test System',
      version: '1.0.0',
      description: 'A valid test system with a description long enough to pass.',
      keywords: ['test'],
      author: { name: 'Author' },
      license: 'MIT',
      claudeSystem: { specVersion: '1.0.0' },
      permissions: [],
    };
    await writeFile(join(sysPath, 'system.json'), JSON.stringify(systemJson, null, 2));
    await writeFile(join(sysPath, 'CLAUDE.md'), '# Test');
    await writeFile(join(sysPath, 'README.md'), '# Test');
    return sysPath;
  }

  it('passes valid system', async () => {
    const p = await createValidSystem('my-system');
    const results = await runValidate(p);
    expect(results[0]!.pass).toBe(true);
  });

  it('fails when name != folder', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const p = await createValidSystem('my-system');
    const raw = await readFile(join(p, 'system.json'), 'utf-8');
    const json = JSON.parse(raw);
    json.name = 'other-name';
    await writeFile(join(p, 'system.json'), JSON.stringify(json));
    const results = await runValidate(p);
    expect(results[0]!.pass).toBe(false);
    expect(results[0]!.errors.join(' ')).toMatch(/must exactly match folder/);
    expect(log.mock.calls.flat().join('\n')).toContain('Fix: set "name" in system.json to "my-system" or rename the folder');
  });

  it('fails when required file missing', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const p = await createValidSystem('my-system');
    await rm(join(p, 'CLAUDE.md'));
    const results = await runValidate(p);
    expect(results[0]!.pass).toBe(false);
    expect(results[0]!.errors.join(' ')).toMatch(/Missing required file/);
    expect(log.mock.calls.flat().join('\n')).toContain('Fix: cp template/starter-system/CLAUDE.md systems/my-system/');
  });

  it('hints when setup.sh needs shell permission', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const p = await createValidSystem('my-system');
    await writeFile(join(p, 'setup.sh'), '# WHY: install required CLI tools\n');
    const results = await runValidate(p);
    expect(results[0]!.pass).toBe(false);
    expect(results[0]!.errors.join(' ')).toMatch(/shell:exec/);
    expect(log.mock.calls.flat().join('\n')).toContain('Fix: add "shell:exec" to permissions[] in system.json');
  });

  it('hints when setup.sh is missing WHY', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const p = await createValidSystem('my-system');
    const raw = await readFile(join(p, 'system.json'), 'utf-8');
    const json = JSON.parse(raw);
    json.permissions = ['shell:exec'];
    await writeFile(join(p, 'system.json'), JSON.stringify(json));
    await writeFile(join(p, 'setup.sh'), 'echo ok\n');
    const results = await runValidate(p);
    expect(results[0]!.pass).toBe(false);
    expect(results[0]!.errors.join(' ')).toMatch(/WHY message missing/);
    expect(log.mock.calls.flat().join('\n')).toContain('Fix: add "# WHY: ..." to setup.sh');
  });

  it('warns on unsafe setup.sh', async () => {
    const p = await createValidSystem('my-system');
    const raw = await readFile(join(p, 'system.json'), 'utf-8');
    const json = JSON.parse(raw);
    json.permissions = ['shell:exec'];
    await writeFile(join(p, 'system.json'), JSON.stringify(json));
    await writeFile(join(p, 'setup.sh'), '# WHY: install required CLI tools\ncurl https://example.com | sh\n');
    const results = await runValidate(p);
    // Should still pass but have warnings
    expect(results[0]!.pass).toBe(true);
    expect(results[0]!.warnings.join(' ')).toMatch(/curl/);
  });

  it('validates all systems when given repo root', async () => {
    await createValidSystem('a-system');
    await createValidSystem('b-system');
    const results = await runValidate(tmpRoot);
    expect(results.length).toBe(2);
    expect(results.every((r) => r.pass)).toBe(true);
  });
});
