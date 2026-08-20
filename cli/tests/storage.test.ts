import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  getStorageDir,
  getSystemsDir,
  getSystemsJsonPath,
  readSystemsJson,
  writeSystemsJson,
  recordInstall,
  isInstalled,
  listInstalled,
  removeSystem,
  updateInstallVersion,
  getSetupDone,
  recordSetupDone,
} from '../src/lib/storage.js';

describe('storage', () => {
  let tmpHome: string;
  let origEnv: string | undefined;

  beforeEach(async () => {
    tmpHome = await mkdtemp(join(tmpdir(), 'claude-system-test-'));
    origEnv = process.env.CLAUDE_SYSTEM_HOME;
    process.env.CLAUDE_SYSTEM_HOME = tmpHome;
  });

  afterEach(async () => {
    if (origEnv === undefined) delete process.env.CLAUDE_SYSTEM_HOME;
    else process.env.CLAUDE_SYSTEM_HOME = origEnv;
    await rm(tmpHome, { recursive: true, force: true });
  });

  it('creates storage dir and returns empty systems.json initially', async () => {
    const data = await readSystemsJson();
    expect(data.systems).toEqual({});
  });

  it('records install and persists', async () => {
    await recordInstall('example-system', '1.0.0');
    expect(await isInstalled('example-system')).toBe(true);
    const data = await readSystemsJson();
    expect(data.systems['example-system']?.version).toBe('1.0.0');
    expect(data.systems['example-system']?.setupDone).toBe(false);
  });

  it('lists installed', async () => {
    await recordInstall('a', '0.1.0');
    await recordInstall('b', '0.2.0');
    const list = await listInstalled();
    expect(list.map((x) => x.name).sort()).toEqual(['a', 'b']);
  });

  it('preserves setupDone on version update', async () => {
    await recordInstall('example-system', '1.0.0');
    await recordSetupDone('example-system', true);
    await updateInstallVersion('example-system', '1.1.0');
    const data = await readSystemsJson();
    expect(data.systems['example-system']?.version).toBe('1.1.0');
    expect(data.systems['example-system']?.setupDone).toBe(true);
  });

  it('getSetupDone defaults to false', async () => {
    expect(await getSetupDone('nonexistent')).toBe(false);
    await recordInstall('x', '1.0.0');
    expect(await getSetupDone('x')).toBe(false);
    await recordSetupDone('x', true);
    expect(await getSetupDone('x')).toBe(true);
  });

  it('removes system', async () => {
    await recordInstall('todelete', '1.0.0');
    // Create directory to test removal
    await mkdir(join(getSystemsDir(), 'todelete'), { recursive: true });
    await writeFile(join(getSystemsDir(), 'todelete', 'system.json'), '{}');
    await removeSystem('todelete');
    expect(await isInstalled('todelete')).toBe(false);
    const data = await readSystemsJson();
    expect(data.systems['todelete']).toBeUndefined();
  });

  it('readSystemsJson handles corrupted file', async () => {
    await mkdir(tmpHome, { recursive: true });
    await writeFile(getSystemsJsonPath(), 'not json', 'utf-8');
    const data = await readSystemsJson();
    expect(data.systems).toEqual({});
  });
});
