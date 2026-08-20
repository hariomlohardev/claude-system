#!/usr/bin/env node
/**
 * packaging/npm/postinstall.js — thin wrapper postinstall
 * The npm package is a thin wrapper around cli/dist. This script ensures
 * the binary is executable and prints a friendly message. It does not
 * reimplement CLI logic — the real implementation lives in cli/.
 */
import { chmod } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const binPath = join(here, '../../cli/dist/index.js');

if (existsSync(binPath)) {
  try {
    await chmod(binPath, 0o755);
  } catch {
    // ignore on Windows or read-only FS
  }
  console.log('✓ claude-system installed. Run `claude-system --help` to get started.');
  console.log('  Docs: https://github.com/hariomlohardev/claude-system#readme');
} else {
  console.warn('⚠ claude-system: cli/dist/index.js not found — did the build step run?');
  console.warn('  Try: npm run build (from the repo root, or from cli/)');
}
