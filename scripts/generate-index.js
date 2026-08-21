#!/usr/bin/env node
/**
 * scripts/generate-index.js
 * Rebuilds registry/index.json from systems/<name>/system.json.
 * - Validates every system.json against schemas/system.schema.json
 * - Produces output that validates against schemas/registry-index.schema.json
 * - Never hand-edit registry/index.json — this script is the source of truth.
 */

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const systemsDir = join(repoRoot, 'systems');
const systemSchemaPath = join(repoRoot, 'schemas/system.schema.json');
const registrySchemaPath = join(repoRoot, 'schemas/registry-index.schema.json');
const registryPath = join(repoRoot, 'registry/index.json');

// Minimal validation mirroring system.schema.json — strict enough for CI.
// We replicate the zod rules without requiring a dep at script run time.
const kebabRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const semverRe = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const httpsRe = /^https?:\/\/.+/;
const githubRe = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
const categories = new Set(['open-source','frontend','backend','testing','security','docs','research','devops','other']);
const permissionsEnum = new Set(['filesystem:read','filesystem:write','network:read','network:write','shell:exec','credentials:read']);

function validateSystemJson(json, folderName) {
  const errors = [];
  const required = ['name','displayName','version','description','keywords','author','license','claudeSystem','permissions'];
  for (const f of required) {
    if (!(f in json)) errors.push(`missing required field: ${f}`);
  }
  if ('$schema' in json && typeof json['$schema'] !== 'string') errors.push('$schema must be string');
  if ('name' in json) {
    if (typeof json.name !== 'string' || !kebabRe.test(json.name)) errors.push(`name must be kebab-case ^[a-z0-9]+(?:-[a-z0-9]+)*$ (got "${json.name}")`);
    else if (json.name !== folderName) errors.push(`name "${json.name}" must equal folder name "${folderName}"`);
  }
  if ('displayName' in json && (typeof json.displayName !== 'string' || json.displayName.length < 1 || json.displayName.length > 80)) errors.push('displayName must be 1-80 chars');
  if ('version' in json && !semverRe.test(json.version)) errors.push(`version must be semver (got "${json.version}")`);
  if ('description' in json && (typeof json.description !== 'string' || json.description.length < 10 || json.description.length > 300)) errors.push('description must be 10-300 chars');
  if ('keywords' in json) {
    if (!Array.isArray(json.keywords) || json.keywords.length < 1 || json.keywords.length > 15) errors.push('keywords must be array 1-15');
    else for (const k of json.keywords) if (typeof k !== 'string' || k.length < 1 || k.length > 32) errors.push(`keyword "${k}" must be 1-32 chars`);
  }
  if ('category' in json && json.category !== undefined && !categories.has(json.category)) errors.push(`category must be one of ${[...categories].join(', ')}`);
  if ('author' in json) {
    if (!json.author || typeof json.author !== 'object') errors.push('author must be object');
    else {
      if (!json.author.name || typeof json.author.name !== 'string' || json.author.name.length < 1) errors.push('author.name required 1-80');
      if ('github' in json.author && json.author.github !== undefined) {
        if (typeof json.author.github !== 'string' || !githubRe.test(json.author.github)) errors.push(`author.github invalid (got "${json.author.github}")`);
      }
      if ('url' in json.author && json.author.url !== undefined) {
        if (typeof json.author.url !== 'string' || !httpsRe.test(json.author.url)) errors.push('author.url must be https URI');
      }
      const allowedAuthor = new Set(['name','github','url']);
      for (const k of Object.keys(json.author)) if (!allowedAuthor.has(k)) errors.push(`author has unknown property: ${k}`);
    }
  }
  if ('license' in json && (typeof json.license !== 'string' || json.license.length < 1)) errors.push('license required');
  if ('repository' in json && json.repository !== undefined && !httpsRe.test(json.repository)) errors.push('repository must be https URI');
  if ('bugs' in json && json.bugs !== undefined) {
    if (!json.bugs || typeof json.bugs !== 'object' || typeof json.bugs.url !== 'string' || !httpsRe.test(json.bugs.url)) errors.push('bugs.url must be https URI');
    else {
      for (const k of Object.keys(json.bugs)) if (k !== 'url') errors.push(`bugs has unknown property: ${k}`);
    }
  }
  if ('homepage' in json && json.homepage !== undefined && !httpsRe.test(json.homepage)) errors.push('homepage must be https URI');
  if ('claudeSystem' in json) {
    if (!json.claudeSystem || typeof json.claudeSystem.specVersion !== 'string' || !semverRe.test(json.claudeSystem.specVersion)) errors.push('claudeSystem.specVersion must be semver');
    else {
      for (const k of Object.keys(json.claudeSystem)) if (k !== 'specVersion') errors.push(`claudeSystem has unknown property: ${k}`);
    }
  }
  if ('dependencies' in json && json.dependencies !== undefined) {
    if (!Array.isArray(json.dependencies)) errors.push('dependencies must be array');
    else for (const d of json.dependencies) {
      if (!d || typeof d.name !== 'string' || !kebabRe.test(d.name)) errors.push(`dependencies[].name invalid (got "${d?.name}")`);
      if (!d || typeof d.version !== 'string' || d.version.length < 1) errors.push('dependencies[].version required');
      for (const k of Object.keys(d || {})) if (!['name','version'].includes(k)) errors.push(`dependencies has unknown property: ${k}`);
    }
  }
  if ('permissions' in json) {
    if (!Array.isArray(json.permissions)) errors.push('permissions must be array');
    else for (const p of json.permissions) if (!permissionsEnum.has(p)) errors.push(`permissions invalid value: "${p}"`);
  }
  // additionalProperties false at top — flag unknown top-level keys
  const allowedTop = new Set(['$schema','name','displayName','version','description','keywords','category','author','license','repository','bugs','homepage','claudeSystem','dependencies','permissions']);
  for (const k of Object.keys(json)) if (!allowedTop.has(k)) errors.push(`unknown top-level property: ${k}`);
  return errors;
}

async function main() {
  console.log('Generating registry/index.json from systems/*/system.json …');

  if (!existsSync(systemsDir)) {
    console.error(`systems/ directory not found at ${systemsDir}`);
    process.exit(1);
  }

  const entries = await readdir(systemsDir, { withFileTypes: true });
  const systems = [];
  let hasError = false;

  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (e.name.startsWith('.')) continue;
    const sysPath = join(systemsDir, e.name);
    const jsonPath = join(sysPath, 'system.json');
    if (!existsSync(jsonPath)) {
      console.warn(`  skip ${e.name}: no system.json`);
      continue;
    }
    let raw;
    try {
      raw = await readFile(jsonPath, 'utf-8');
    } catch (err) {
      console.error(`  ✗ ${e.name}: failed to read system.json — ${err.message}`);
      hasError = true;
      continue;
    }
    let json;
    try {
      json = JSON.parse(raw);
    } catch (err) {
      console.error(`  ✗ ${e.name}: invalid JSON — ${err.message}`);
      hasError = true;
      continue;
    }

    // Required files check (also part of validate.yml)
    for (const f of ['system.json','CLAUDE.md','README.md']) {
      if (!existsSync(join(sysPath, f))) {
        console.error(`  ✗ ${e.name}: missing required file ${f}`);
        hasError = true;
      }
    }

    const errors = validateSystemJson(json, e.name);
    if (errors.length > 0) {
      console.error(`  ✗ ${e.name}: validation failed:`);
      for (const er of errors) console.error(`    - ${er}`);
      hasError = true;
      continue;
    }

    // Build registry entry — subset fields
    const entry = {
      name: json.name,
      displayName: json.displayName,
      version: json.version,
      description: json.description,
      author: json.author,
      license: json.license,
      keywords: json.keywords,
      path: `systems/${json.name}`,
    };
    if (json.category) entry.category = json.category;
    systems.push(entry);
    console.log(`  ✓ ${e.name} v${json.version}`);
  }

  if (hasError) {
    console.error('\nOne or more Systems failed validation — registry not generated.');
    console.error('Fix errors above or remove the invalid System and re-run.');
    process.exit(1);
  }

  // Sort by name for stable output
  systems.sort((a,b) => a.name.localeCompare(b.name));

  // Guard: ensure every valid system folder with system.json is in output
  const expectedCount = entries.filter(e => e.isDirectory() && !e.name.startsWith('.') && existsSync(join(systemsDir, e.name, 'system.json'))).length;
  if (systems.length !== expectedCount) {
    console.error(`::error::registry generation mismatch: expected ${expectedCount} systems but got ${systems.length}`);
    process.exit(1);
  }

  const index = {
    $schema: '../schemas/registry-index.schema.json',
    generatedAt: new Date().toISOString(),
    systems,
  };

  // Validate output against registry-index schema (minimal check)
  // We know it should be valid if we built it correctly, but verify shape
  if (typeof index.generatedAt !== 'string' || !Array.isArray(index.systems)) {
    console.error('Generated index failed shape check');
    process.exit(1);
  }
  for (const s of index.systems) {
    if (!s.name || !s.displayName || !s.version || !s.path) {
      console.error(`Generated entry invalid: ${JSON.stringify(s)}`);
      process.exit(1);
    }
  }

  await writeFile(registryPath, JSON.stringify(index, null, 2) + '\n', 'utf-8');
  console.log(`\n✓ Wrote ${registryPath} with ${systems.length} System(s)`);
  console.log(`  generatedAt: ${index.generatedAt}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
