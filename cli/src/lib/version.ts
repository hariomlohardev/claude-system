/**
 * version.ts — semver compare (minimal, no extra dep)
 * Only handles MAJOR.MINOR.PATCH with optional prerelease.
 */

export function parseSemver(v: string): { major: number; minor: number; patch: number; prerelease: string | null } | null {
  const m = v.match(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(.+))?(?:\+.+)?$/);
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] ?? null,
  };
}

/**
 * Returns -1 if a < b, 0 if equal, 1 if a > b.
 * Prerelease is considered lower than release.
 */
export function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) {
    // fallback to string compare if not semver
    if (a === b) return 0;
    return a < b ? -1 : 1;
  }
  if (pa.major !== pb.major) return pa.major < pb.major ? -1 : 1;
  if (pa.minor !== pb.minor) return pa.minor < pb.minor ? -1 : 1;
  if (pa.patch !== pb.patch) return pa.patch < pb.patch ? -1 : 1;
  // prerelease handling: null (release) > any prerelease
  if (pa.prerelease === pb.prerelease) return 0;
  if (pa.prerelease === null) return 1;
  if (pb.prerelease === null) return -1;
  return pa.prerelease < pb.prerelease ? -1 : pa.prerelease > pb.prerelease ? 1 : 0;
}

export function isNewer(registryVersion: string, installedVersion: string): boolean {
  return compareSemver(registryVersion, installedVersion) > 0;
}
