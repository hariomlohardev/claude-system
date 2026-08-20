import { describe, it, expect } from 'vitest';
import { compareSemver, isNewer, parseSemver } from '../src/lib/version.js';

describe('parseSemver', () => {
  it('parses valid semver', () => {
    expect(parseSemver('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3, prerelease: null });
    expect(parseSemver('0.1.0-beta.1')?.prerelease).toBe('beta.1');
  });
  it('returns null for invalid', () => {
    expect(parseSemver('1.0')).toBeNull();
    expect(parseSemver('v1.0.0')).toBeNull();
  });
});

describe('compareSemver', () => {
  it('compares major/minor/patch', () => {
    expect(compareSemver('1.0.0', '2.0.0')).toBe(-1);
    expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
    expect(compareSemver('1.0.1', '1.0.0')).toBe(1);
    expect(compareSemver('1.10.0', '1.2.0')).toBe(1);
  });
  it('prerelease is lower than release', () => {
    expect(compareSemver('1.0.0-beta', '1.0.0')).toBe(-1);
    expect(compareSemver('1.0.0', '1.0.0-beta')).toBe(1);
  });
});

describe('isNewer', () => {
  it('detects newer', () => {
    expect(isNewer('1.1.0', '1.0.0')).toBe(true);
    expect(isNewer('1.0.0', '1.0.0')).toBe(false);
    expect(isNewer('0.9.0', '1.0.0')).toBe(false);
  });
});
