/**
 * registry.ts — RegistrySource abstraction (forward-compat for marketplace)
 * v1: Vercel (Supabase) is primary, GitHub raw + local are fallbacks.
 */
import { registryIndexSchema, type RegistryIndex, type RegistryEntry } from '../utils/validation.js';
import { theme } from '../utils/theme.js';

export interface RegistrySource {
  /** Fetch the registry index fresh — no cache, every call hits the network (or file). */
  fetchIndex(): Promise<RegistryIndex>;
  /** Human label for logs/debugging */
  readonly label: string;
}

const VERCEL_REGISTRY_URL =
  'https://claude-system-tau.vercel.app/api/registry';

const GITHUB_FALLBACK_URL =
  'https://raw.githubusercontent.com/hariomlohardev/claude-system/main/registry/index.json';

// Allow override for dev/tests: env var or local file
function getRegistryUrl(): string {
  if (process.env.CLAUDE_SYSTEM_REGISTRY_URL) return process.env.CLAUDE_SYSTEM_REGISTRY_URL!;
  return VERCEL_REGISTRY_URL;
}

/**
 * GitHubRegistry — v1 canonical source.
 * Fetches fresh from the release/raw URL on every call. No TTL cache.
 * Falls back to reading a local registry/index.json if present (useful for offline dev/test).
 */
export class GitHubRegistry implements RegistrySource {
  readonly label = 'github';

  constructor(private readonly url: string = GITHUB_FALLBACK_URL) {}

  async fetchIndex(): Promise<RegistryIndex> {
    // If url is a file path (starts with / or ./ or file://), read from disk — useful for tests
    if (this.url.startsWith('file://') || this.url.startsWith('/') || this.url.startsWith('./') || this.url.endsWith('.json') && !this.url.startsWith('http')) {
      const filePath = this.url.replace(/^file:\/\//, '');
      const { readFile } = await import('node:fs/promises');
      try {
        const raw = await readFile(filePath, 'utf-8');
        const json = JSON.parse(raw);
        const parsed = registryIndexSchema.safeParse(json);
        if (!parsed.success) {
          throw new Error(`Registry at ${filePath} failed validation: ${parsed.error.message}`);
        }
        return parsed.data;
      } catch (err) {
        // If local file read fails, try network fetch as fallback if url looks like http
        if (this.url.startsWith('http')) {
          return this.fetchFromNetwork(this.url);
        }
        throw err;
      }
    }

    return this.fetchFromNetwork(this.url);
  }

  private async fetchFromNetwork(url: string): Promise<RegistryIndex> {
    // Always fresh — no cache headers that imply staleness is okay
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      });
    } catch (err) {
      // Network failure — try local fallback if dev is running from repo root
      const localFallback = await this.tryLocalFallback();
      if (localFallback) return localFallback;
      throw new Error(`Failed to fetch registry from ${url}: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (!res.ok) {
      const localFallback = await this.tryLocalFallback();
      if (localFallback) return localFallback;
      throw new Error(`Registry fetch failed: ${res.status} ${res.statusText} from ${url}`);
    }

    const json: any = await res.json();
    const parsed = registryIndexSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error(`Registry at ${url} is invalid: ${parsed.error.message}`);
    }

    // Dev convenience: if remote is empty but local has content (unpushed), prefer local
    // This makes `claude-system list` useful right after `node scripts/generate-index.js` without pushing.
    if (parsed.data.systems.length === 0) {
      const local = await this.tryLocalFallback();
      if (local && local.systems.length > 0) {
        return local;
      }
    }

    return parsed.data;
  }

  private async tryLocalFallback(): Promise<RegistryIndex | null> {
    // When running from the repo root during dev, prefer the checked-in registry/index.json
    // This makes `claude-system list` work offline in dev without needing network.
    try {
      const { readFile } = await import('node:fs/promises');
      const { resolve, dirname } = await import('node:path');
      const { fileURLToPath } = await import('node:url');
      // dist is cli/dist, so repo root is ../../
      const here = dirname(fileURLToPath(import.meta.url));
      const candidates = [
        resolve(here, '../../registry/index.json'),
        resolve(here, '../../../registry/index.json'),
        resolve(process.cwd(), 'registry/index.json'),
      ];
      for (const p of candidates) {
        try {
          const raw = await readFile(p, 'utf-8');
          const json = JSON.parse(raw);
          const parsed = registryIndexSchema.safeParse(json);
          if (parsed.success) {
            // Only use fallback if network was unavailable — we already tried network first
            // Caller will only reach here on network error, so returning local is correct.
            return parsed.data;
          }
        } catch {
          continue;
        }
      }
    } catch {
      // ignore
    }
    return null;
  }
}


/**
 * VercelRegistry — primary source (Supabase via Vercel).
 * Tries Vercel first, falls back to GitHub raw, then local file.
 * Keeps file:// support for tests via env override or direct url param.
 */
export class VercelRegistry implements RegistrySource {
  readonly label = 'vercel';

  constructor(private readonly url: string = getRegistryUrl()) {}

  async fetchIndex(): Promise<RegistryIndex> {
    if (this.url.startsWith('file://') || this.url.startsWith('/') || this.url.startsWith('./') || this.url.endsWith('.json') && !this.url.startsWith('http')) {
      const filePath = this.url.replace(/^file:\/\//, '');
      const { readFile } = await import('node:fs/promises');
      try {
        const raw = await readFile(filePath, 'utf-8');
        const json = JSON.parse(raw);
        const parsed = registryIndexSchema.safeParse(json);
        if (!parsed.success) {
          throw new Error(`Registry at ${filePath} failed validation: ${parsed.error.message}`);
        }
        return parsed.data;
      } catch (err) {
        if (this.url.startsWith('http')) {
          return this.fetchFromNetwork(this.url);
        }
        throw err;
      }
    }

    return this.fetchFromNetwork(this.url);
  }

  private async fetchFromNetwork(url: string): Promise<RegistryIndex> {
    let res: Response | null = null;
    let lastErr: string | null = null;
    try {
      res = await fetch(url, {
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const json: any = await res.json();
        // Normalize Vercel shape: ensure displayName vs display_name, strip extra keys before strict validation
        // (handles both live Vercel with extra fields and future clean shape)
        if (json && Array.isArray(json.systems)) {
          json.systems = json.systems.map((s: any) => ({
            name: s.name,
            displayName: s.displayName ?? s.display_name,
            version: s.version,
            description: s.description,
            keywords: s.keywords,
            category: s.category,
            author: s.author,
            license: s.license,
            path: s.path,
          }));
        }
        const parsed = registryIndexSchema.safeParse(json);
        if (parsed.success) {
          if (parsed.data.systems.length === 0) {
            const local = await this.tryLocalFallback();
            if (local && local.systems.length > 0) return local;
          }
          return parsed.data;
        }
        lastErr = `Vercel response invalid: ${parsed.error.message}`;
      } else {
        lastErr = `${res.status} ${res.statusText}`;
      }
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
    }

    try {
      const ghRes = await fetch(GITHUB_FALLBACK_URL, {
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      });
      if (ghRes.ok) {
        const json: any = await ghRes.json();
        const parsed = registryIndexSchema.safeParse(json);
        if (parsed.success) {
          if (parsed.data.systems.length === 0) {
            const local = await this.tryLocalFallback();
            if (local && local.systems.length > 0) return local;
          }
          console.error(theme.dim(`  (fell back to GitHub registry: ${lastErr})`));
          return parsed.data;
        }
      }
    } catch {}

    const localFallback = await this.tryLocalFallback();
    if (localFallback) {
      console.error(theme.dim(`  (fell back to local registry/index.json: ${lastErr})`));
      return localFallback;
    }

    throw new Error(`Registry fetch failed (Vercel ${lastErr}) from ${url}`);
  }

  private async tryLocalFallback(): Promise<RegistryIndex | null> {
    try {
      const { readFile } = await import('node:fs/promises');
      const { resolve, dirname } = await import('node:path');
      const { fileURLToPath } = await import('node:url');
      const here = dirname(fileURLToPath(import.meta.url));
      const candidates = [
        resolve(here, '../../registry/index.json'),
        resolve(here, '../../../registry/index.json'),
        resolve(process.cwd(), 'registry/index.json'),
      ];
      for (const p of candidates) {
        try {
          const raw = await readFile(p, 'utf-8');
          const json = JSON.parse(raw);
          const parsed = registryIndexSchema.safeParse(json);
          if (parsed.success) {
            return parsed.data;
          }
        } catch {
          continue;
        }
      }
    } catch {
    }
    return null;
  }
}

// Convenience — default singleton
let defaultSource: RegistrySource | null = null;

export function getRegistrySource(): RegistrySource {
  if (!defaultSource) defaultSource = new VercelRegistry();
  return defaultSource;
}

export function setRegistrySource(source: RegistrySource): void {
  defaultSource = source;
}

// Helpers for commands
export async function findInRegistry(name: string, source: RegistrySource = getRegistrySource()): Promise<RegistryEntry | null> {
  const index = await source.fetchIndex();
  return index.systems.find((s) => s.name === name) ?? null;
}

export async function searchRegistry(query: string, source: RegistrySource = getRegistrySource()): Promise<RegistryEntry[]> {
  const index = await source.fetchIndex();
  const q = query.toLowerCase();
  return index.systems.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.displayName.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.keywords.some((k) => k.toLowerCase().includes(q)),
  );
}
