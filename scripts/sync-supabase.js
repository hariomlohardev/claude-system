#!/usr/bin/env node
/**
 * scripts/sync-supabase.js
 * Upserts Supabase `systems` + inserts `system_versions` from registry/index.json + systems/<name>/system.json
 * Uses native fetch, no extra deps.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env (service_role bypasses RLS).
 */
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const registryPath = join(repoRoot, 'registry/index.json');
const systemsDir = join(repoRoot, 'systems');

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — add them in repo Settings → Secrets and variables → Actions');
    console.error('  SUPABASE_URL present:', !!url);
    console.error('  SUPABASE_SERVICE_ROLE_KEY present:', !!key);
    process.exit(1);
  }
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates',
  };

  let registry;
  try {
    registry = JSON.parse(await readFile(registryPath, 'utf-8'));
  } catch (e) {
    console.error(`Failed to read ${registryPath}: ${e.message}`);
    process.exit(1);
  }
  if (!registry.systems || !Array.isArray(registry.systems)) {
    console.error('registry/index.json missing systems array');
    process.exit(1);
  }

  // For each system, read full system.json for complete fields
  for (const entry of registry.systems) {
    const name = entry.name;
    const sysJsonPath = join(systemsDir, name, 'system.json');
    let sysJson;
    try {
      sysJson = JSON.parse(await readFile(sysJsonPath, 'utf-8'));
    } catch (e) {
      console.error(`Skipping ${name}: failed to read ${sysJsonPath}: ${e.message}`);
      continue;
    }

    const row = {
      name: sysJson.name,
      display_name: sysJson.displayName,
      version: sysJson.version,
      description: sysJson.description,
      keywords: sysJson.keywords || [],
      category: sysJson.category || 'other',
      author: sysJson.author,
      license: sysJson.license,
      repository: sysJson.repository || null,
      bugs_url: sysJson.bugs?.url || null,
      homepage: sysJson.homepage || null,
      permissions: sysJson.permissions || [],
      path: `systems/${sysJson.name}`,
      claude_spec_version: sysJson.claudeSystem?.specVersion || '1.0.0',
    };

    // Upsert systems
    const upsertUrl = `${url}/rest/v1/systems?on_conflict=name`;
    const upsertRes = await fetch(upsertUrl, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(row),
    });
    if (!upsertRes.ok) {
      const txt = await upsertRes.text();
      console.error(`Failed to upsert systems/${name}: ${upsertRes.status} ${txt}`);
      process.exit(1);
    }
    console.log(`↑ ${name}@${row.version} — upserted systems`);

    // Insert system_versions (ignore if exists)
    const versionRow = {
      system_name: sysJson.name,
      version: sysJson.version,
      system_json: sysJson,
    };
    const verUrl = `${url}/rest/v1/system_versions?on_conflict=system_name,version`;
    const verRes = await fetch(verUrl, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=ignore-duplicates' },
      body: JSON.stringify(versionRow),
    });
    if (!verRes.ok) {
      const txt = await verRes.text();
      // 409 conflict is ok with ignore-duplicates, but Supabase returns 409? check
      if (verRes.status === 409) {
        console.log(`  ${name}@${row.version} — version already exists, skipped`);
      } else {
        console.error(`Failed to insert system_versions ${name}@${row.version}: ${verRes.status} ${txt}`);
        process.exit(1);
      }
    } else {
      console.log(`  ${name}@${row.version} — inserted system_versions`);
    }
  }

  console.log('✓ Sync complete');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
