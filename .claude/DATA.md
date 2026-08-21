# Data & Registry

Keywords: network:write, registry 2 systems, Supabase downloads, web-vercel, install.ps1

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
| `permissions` * | `enum[]` unique | `filesystem:read|write`, `network:read|write`, `shell:exec`, `credentials:read` — **`oss-contrib-finder:24` now 5 perms including `network:write`** |
| `category` | `enum` | `open-source`/`frontend`/`backend`/`testing`/`security`/`docs`/`research`/`devops`/`other` |
| `repository` | `string` `https://` | Author repo |
| `bugs.url` | `string` `https://` | Default monorepo issues if omitted |
| `homepage` | `string` `https://` | Docs URL |
| `dependencies` | `{ name, version }[]` | Other Systems by name+range |
| `$schema` | `string` | Optional editor hint `../../schemas/system.schema.json` |

**Example (honest permissions, see [oss-contrib-finder/system.json:24](../systems/oss-contrib-finder/system.json)):**
```json
{ "name": "oss-contrib-finder", "displayName": "OSS Contrib Finder", "version": "0.1.0",
  "permissions": ["filesystem:read","filesystem:write","network:read","network:write","shell:exec"] }
```
Previous fixture `example-system` was `["filesystem:read"]` only — new System proves `network:write` for pushes.

## `registry/index.json` — [`schemas/registry-index.schema.json`](../schemas/registry-index.schema.json)

```json
{ "$schema": "../schemas/registry-index.schema.json",
  "generatedAt": "2026-08-21T11:47:36.834Z",
  "systems": [
    { "name": "example-system", "displayName": "Example System (Reference Fixture)",
      "version": "0.1.0", "description": "…", "author": { "name": "…" },
      "license": "MIT", "keywords": ["example","fixture","reference"],
      "path": "systems/example-system", "category": "other" },
    { "name": "oss-contrib-finder", "displayName": "OSS Contrib Finder",
      "version": "0.1.0", "description": "Beginner-friendly coach …",
      "author": { "name": "Hariom Lohar", "github": "hariomlohardev" },
      "license": "MIT", "keywords": ["open-source","contribution","github"],
      "path": "systems/oss-contrib-finder", "category": "open-source" }
  ] }
```

Subset of `system.json` fields (`name/displayName/version/description/author/license/keywords/category/path`), sorted by `name`. Now **2 systems** (was 1). Validated by `generate-index.js:99` (guard `expectedCount`) + `registryIndexSchema` in [`cli/src/utils/validation.ts`](../cli/src/utils/validation.ts). File: [`registry/index.json`](../registry/index.json) — `validate.yml` checks stale via `jq -S '.systems'` diff (ignores `generatedAt`).

## Supabase — not stored in repo

Project `claude-system`. Tables `systems` + `system_versions` (shape from live API, not secrets):

- `systems`: `name` PK kebab, `display_name`, `version`, `description`, `keywords text[]`, `category`, `author jsonb` (`{name, github, url}`), `license`, `path`, `permissions text[]`, **`downloads int` (counter)**, **`search_vector tsvector` (pg_trgm + full-text)**, timestamps. RLS: public read.
- `system_versions`: version history per `name` + `version` PK, same payload + `created_at`.

Keys live in Vercel env + GitHub Secrets `SUPABASE_*` (URL, anon, service role) — not in repo. See [`api/_lib/supabase.js:8`](../api/_lib/supabase.js). Sync via [`scripts/sync-supabase.js:12`](../scripts/sync-supabase.js) (upsert on `push:main`).

Live: `https://claude-system-tau.vercel.app/api/registry` and `/api/search?q=` backed by [`api/registry.js:18`](../api/registry.js) · [`api/search.js:12`](../api/search.js) via [`api/_lib/supabase.js`](../api/_lib/supabase.js). **Two-tier fallback:** `VercelRegistry` primary (s-maxage=60) → `raw.githubusercontent.com` → `file://` local (see [registry.ts:13](../cli/src/lib/registry.ts)).

## `vercel.json` rewrites & headers — now `web-vercel/` + `install.ps1`

```json
{ "cleanUrls": true,
  "rewrites": [
    { "source": "/install", "destination": "/install.sh" },
    { "source": "/browse", "destination": "/web-vercel/browse/index.html" },
    { "source": "/system", "destination": "/web-vercel/system/index.html" },
    { "source": "/s/:name", "destination": "/web-vercel/system" },
    { "source": "/docs", "destination": "/web-vercel/docs" },
    { "source": "/docs/:path*", "destination": "/web-vercel/docs/:path*" },
    { "source": "/public/:path*", "destination": "/web-vercel/public/:path*" },
    { "source": "/(.*)", "destination": "/web-vercel/$1" }
  ],
  "headers": [
    { "source": "/install", "headers": [{ "key": "Content-Type", "value": "text/plain; charset=utf-8" }, { "key": "Cache-Control", "value": "public, max-age=60" }] },
    { "source": "/install.sh", "headers": [{ "key": "Content-Type", "value": "text/plain; charset=utf-8" }, { "key": "Cache-Control", "value": "public, max-age=60" }] },
    { "source": "/install.ps1", "headers": [{ "key": "Content-Type", "value": "text/plain; charset=utf-8" }, { "key": "Cache-Control", "value": "public, max-age=60" }] },
    { "source": "/api/(.*)", "headers": [{ "key": "Cache-Control", "value": "s-maxage=60, stale-while-revalidate=300" }, { "key": "Access-Control-Allow-Origin", "value": "*" }] }
  ] }
```

File: [`vercel.json:1`](../vercel.json). **Single source** is `web-vercel/` (not `public/` at repo root). `install.ps1` at repo root is served as `/install.ps1` text/plain alongside `/install` — no rewrite to `web-vercel` needed.

## Install entrypoints

- **Bash:** [`install.sh:59`](../install.sh) `curl | sh` — Node>=18 gate fail-hard, `sha256sum` verify `SHASUMS256.txt` before `chmod +x`, then `npm install -g` fallback via `~/.npm-global` if EACCES.
- **PowerShell:** [`install.ps1:9`](../install.ps1) `#Requires -Version 5.1` — mirrors `install.sh` gates (Node>=18 fail-hard, npm present, git warn) then `npm install -g claude-system --prefix $env:APPDATA\npm` → PATH check `Get-Command claude-system`. Native Windows, no WSL/Bash required.

## Packaging

- [`packaging/npm/`](../packaging/npm/) thin wrapper — publishes `cli/` to npm (`npm --provenance` in release).
- [`packaging/pip/`](../packaging/pip/) wrapper `claude_system/wrapper.py` → `claude-system` bin. See `pyproject.toml`.

## Example `system.json`

See [`template/starter-system/system.json`](../template/starter-system/system.json) (zod in [`cli/src/utils/validation.ts`](../cli/src/utils/validation.ts) must stay in sync).

See also: Stack → [STACK.md](STACK.md), Contracts → [CONTRACTS.md](CONTRACTS.md), Flows → [FLOWS.md](FLOWS.md)
