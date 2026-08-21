# Data & Registry

## `system.json` — [`schemas/system.schema.json`](../schemas/system.schema.json)

`additionalProperties: false`. Required `*`:

| Field | Type | Notes |
|---|---|---|
| `name` * | `string` kebab `^[a-z0-9]+(?:-[a-z0-9]+)*$` 1–64 | Must equal folder `systems/<name>/` |
| `displayName` * | `string` 1–80 | Human label |
| `version` * | `string` semver 2.0 | `0.1.0` |
| `description` * | `string` 10–300 | Shown in list/search |
| `keywords` * | `string[]` 1–15 unique, each `^[a-z0-9][a-z0-9-_ ]*$` 1–32 | Powers search |
| `author` * | `{ name, github?, url? }` strict | `name` 1–80, `github` handle, `url` `https://` |
| `license` * | `string` SPDX | `MIT`, `Apache-2.0` |
| `claudeSystem` * | `{ specVersion }` strict | e.g. `1.0.0` |
| `permissions` * | `enum[]` unique | `filesystem:read|write`, `network:read|write`, `shell:exec`, `credentials:read` |
| `category` | `enum` | `open-source`/`frontend`/`backend`/`testing`/`security`/`docs`/`research`/`devops`/`other` |
| `repository` | `string` `https://` | Author repo |
| `bugs.url` | `string` `https://` | Default monorepo issues if omitted |
| `homepage` | `string` `https://` | Docs URL |
| `dependencies` | `{ name, version }[]` | Other Systems by name+range |
| `$schema` | `string` | Optional editor hint `../../schemas/system.schema.json` |

## `registry/index.json` — [`schemas/registry-index.schema.json`](../schemas/registry-index.schema.json)

```json
{ "$schema": "../schemas/registry-index.schema.json",
  "generatedAt": "2026-08-20T16:14:45.214Z",
  "systems": [
    { "name": "example-system", "displayName": "Example System (Reference Fixture)",
      "version": "0.1.0", "description": "…", "author": { "name": "…" },
      "license": "MIT", "keywords": ["example","fixture","reference"],
      "path": "systems/example-system", "category": "other" }
  ] }
```

Subset of `system.json` fields (`name/displayName/version/description/author/license/keywords/category/path`), sorted by `name`. Validated by `generate-index.js` + `registryIndexSchema` in [`cli/src/utils/validation.ts`](../cli/src/utils/validation.ts). File: [`registry/index.json`](../registry/index.json).

## Supabase — not stored in repo

Project `claude-system`. Tables `systems` + `system_versions` (shape from live API, not secrets):

- `systems`: `name` PK kebab, `display_name`, `version`, `description`, `keywords text[]`, `category`, `author jsonb` (`{name, github, url}`), `license`, `path`, `permissions text[]`, `downloads int`, `search_vector tsvector`, timestamps. RLS: public read.
- `system_versions`: version history per `name` + `version` PK, same payload + `created_at`.

Keys live in Vercel env + GitHub Secrets `SUPABASE_*` (URL, anon, service role) — not in repo. See [`api/_lib/supabase.js`](../api/_lib/supabase.js).

Live: `https://claude-system-tau.vercel.app/api/registry` and `/api/search?q=` backed by [`api/registry.js`](../api/registry.js) · [`api/search.js`](../api/search.js).

## `vercel.json` rewrites & headers

```json
{ "rewrites": [
  { "source": "/install", "destination": "/install.sh" },
  { "source": "/browse", "destination": "/browse/index.html" },
  { "source": "/system", "destination": "/system/index.html" },
  { "source": "/s/:name", "destination": "/system/index.html" },
  { "source": "/docs", "destination": "/docs/index.html" }
], "headers": [
  { "source": "/install(.sh)?", "headers": [{ "key": "Content-Type", "value": "text/plain; charset=utf-8" }] },
  { "source": "/api/(.*)", "headers": [{ "key": "Cache-Control", "value": "s-maxage=60, stale-while-revalidate=300" }, { "key": "Access-Control-Allow-Origin", "value": "*" }] }
], "cleanUrls": true }
```

File: [`vercel.json`](../vercel.json).

## Packaging

- [`packaging/npm/`](../packaging/npm/) thin wrapper — publishes `cli/` to npm.
- [`packaging/pip/`](../packaging/pip/) wrapper `claude_system/wrapper.py` → `claude-system` bin. See `pyproject.toml`.

## Example `system.json`

See [`template/starter-system/system.json`](../template/starter-system/system.json) (zod in [`cli/src/utils/validation.ts`](../cli/src/utils/validation.ts) must stay in sync).
