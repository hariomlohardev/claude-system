/**
 * storage.ts — local state in ~/.claude-system
 * - ~/.claude-system/systems/<name>/  full copy of systems/<name>/
 * - ~/.claude-system/systems.json     bookkeeping: { systems: { <name>: { version, installedAt, setupDone, installedFiles } } }
 */
import { homedir } from 'node:os';
import { join, relative, sep, posix } from 'node:path';
import { mkdir, readFile, writeFile, rm, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

export interface InstalledFileEntry {
  path: string; // POSIX relative from System root
  sha256: string; // hex
}

export interface InstalledSystemMeta {
  version: string;
  installedAt: string; // ISO timestamp
  setupDone: boolean;
  installedFiles?: InstalledFileEntry[];
}

export interface SystemsJson {
  systems: Record<string, InstalledSystemMeta>;
}

function getHomeDir(): string {
  // Allow override for tests
  if (process.env.CLAUDE_SYSTEM_HOME) return process.env.CLAUDE_SYSTEM_HOME;
  return join(homedir(), '.claude-system');
}

export function getStorageDir(): string {
  return getHomeDir();
}

export function getSystemsDir(): string {
  return join(getHomeDir(), 'systems');
}

export function getSystemsJsonPath(): string {
  return join(getHomeDir(), 'systems.json');
}

export function getSystemInstallPath(name: string): string {
  return join(getSystemsDir(), name);
}

export async function ensureStorageDir(): Promise<void> {
  await mkdir(getSystemsDir(), { recursive: true });
}

export async function readSystemsJson(): Promise<SystemsJson> {
  const path = getSystemsJsonPath();
  if (!existsSync(path)) {
    return { systems: {} };
  }
  try {
    const raw = await readFile(path, 'utf-8');
    const parsed = JSON.parse(raw);
    // Basic shape check — if corrupted, return empty and let caller handle
    if (!parsed || typeof parsed !== 'object' || !parsed.systems || typeof parsed.systems !== 'object') {
      return { systems: {} };
    }
    return parsed as SystemsJson;
  } catch {
    return { systems: {} };
  }
}

export async function writeSystemsJson(data: SystemsJson): Promise<void> {
  await ensureStorageDir();
  const path = getSystemsJsonPath();
  await writeFile(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export async function isInstalled(name: string): Promise<boolean> {
  const meta = await readSystemsJson();
  if (meta.systems[name]) return true;
  // Also check directory exists (in case systems.json is out of sync)
  try {
    await stat(getSystemInstallPath(name));
    return true;
  } catch {
    return false;
  }
}

export async function getInstalledVersion(name: string): Promise<string | null> {
  const meta = await readSystemsJson();
  return meta.systems[name]?.version ?? null;
}

export async function listInstalled(): Promise<Array<{ name: string; meta: InstalledSystemMeta }>> {
  const meta = await readSystemsJson();
  // Include entries from systems.json
  const result: Array<{ name: string; meta: InstalledSystemMeta }> = Object.entries(meta.systems).map(([name, m]) => ({
    name,
    meta: m as InstalledSystemMeta,
  }));

  // Also scan directory for any folders not in json (defensive)
  try {
    const entries = await readdir(getSystemsDir(), { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory() && !meta.systems[e.name]) {
        // Skip .bak directories
        if (e.name.includes('.bak.')) continue;
        // Try to read system.json for version
        try {
          const raw = await readFile(join(getSystemsDir(), e.name, 'system.json'), 'utf-8');
          const json = JSON.parse(raw);
          result.push({
            name: e.name,
            meta: {
              version: json.version ?? 'unknown',
              installedAt: 'unknown',
              setupDone: false,
            },
          });
        } catch {
          result.push({
            name: e.name,
            meta: { version: 'unknown', installedAt: 'unknown', setupDone: false },
          });
        }
      }
    }
  } catch {
    // no systems dir yet
  }

  return result;
}

export async function recordInstall(name: string, version: string): Promise<void> {
  const data = await readSystemsJson();
  data.systems[name] = {
    version,
    installedAt: new Date().toISOString(),
    setupDone: data.systems[name]?.setupDone ?? false,
  };
  await writeSystemsJson(data);
}

export async function recordSetupDone(name: string, done: boolean): Promise<void> {
  const data = await readSystemsJson();
  if (data.systems[name]) {
    data.systems[name].setupDone = done;
    await writeSystemsJson(data);
  }
}

export async function updateInstallVersion(name: string, newVersion: string): Promise<void> {
  const data = await readSystemsJson();
  if (data.systems[name]) {
    // Preserve setupDone per spec (do not reset on update for v1)
    data.systems[name].version = newVersion;
    await writeSystemsJson(data);
  } else {
    // If not in json but directory exists, create entry
    data.systems[name] = {
      version: newVersion,
      installedAt: new Date().toISOString(),
      setupDone: false,
    };
    await writeSystemsJson(data);
  }
}

export async function removeSystem(name: string): Promise<void> {
  const path = getSystemInstallPath(name);
  // Remove directory
  await rm(path, { recursive: true, force: true });
  // Remove from json
  const data = await readSystemsJson();
  if (data.systems[name]) {
    delete data.systems[name];
    await writeSystemsJson(data);
  }
}

export async function getSetupDone(name: string): Promise<boolean> {
  const data = await readSystemsJson();
  return data.systems[name]?.setupDone ?? false;
}

// --- installedFiles manifest helpers ---

export async function hashFile(filePath: string): Promise<string> {
  const data = await readFile(filePath);
  return createHash('sha256').update(data).digest('hex');
}

export async function collectInstalledFiles(systemPath: string): Promise<InstalledFileEntry[]> {
  const files: InstalledFileEntry[] = [];
  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else if (e.isFile()) {
        const rel = relative(systemPath, full).split(sep).join(posix.sep);
        // Skip if rel is empty or outside (should not happen)
        if (!rel || rel.startsWith('..')) continue;
        const sha256 = await hashFile(full);
        files.push({ path: rel, sha256 });
      }
    }
  }
  await walk(systemPath);
  files.sort((a, b) => a.path.localeCompare(b.path));
  return files;
}

export async function saveInstalledFiles(name: string): Promise<void> {
  const systemPath = getSystemInstallPath(name);
  const files = await collectInstalledFiles(systemPath);
  const data = await readSystemsJson();
  if (data.systems[name]) {
    data.systems[name].installedFiles = files;
    await writeSystemsJson(data);
  }
}

export async function getInstalledFiles(name: string): Promise<InstalledFileEntry[] | undefined> {
  const data = await readSystemsJson();
  return data.systems[name]?.installedFiles;
}
