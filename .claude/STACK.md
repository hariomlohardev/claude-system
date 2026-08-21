# Stack & Tooling

| Layer | Tech | Path | Commands |
|---|---|---|---|
| CLI | TypeScript 5 + Node >=18, `commander` 12, `zod` 3, `execa` 8, `simple-git` 3, `vitest` 1 | [`cli/`](./../cli/) · [`cli/package.json`](../cli/package.json) | `npm --prefix cli ci` · `npm --prefix cli run build` (`tsc`) · `npm --prefix cli test` |
| Schema | JSON Schema draft-07 + zod mirror | [`schemas/system.schema.json`](../schemas/system.schema.json) · [`schemas/registry-index.schema.json`](../schemas/registry-index.schema.json) · [`cli/src/utils/validation.ts`](../cli/src/utils/validation.ts) | `node cli/dist/index.js validate` |
| Registry | Generated `registry/index.json` | [`scripts/generate-index.js`](../scripts/generate-index.js) | `node scripts/generate-index.js` |
| Store | `~/.claude-system/systems/<name>/` + `systems.json` | [`cli/src/lib/storage.ts`](../cli/src/lib/storage.ts) | `CLAUDE_SYSTEM_HOME` override for tests |
| Vercel | `Other` framework, root `./`, no build | [`vercel.json`](../vercel.json) · [`api/`](../api/) · [`public/`](../public/) | `https://claude-system-tau.vercel.app` · `/api/registry` · `/api/search?q=` |
| Supabase | Postgres + `pg_trgm`, RLS public read, `search_vector` | [`api/_lib/supabase.js`](../api/_lib/supabase.js) | Tables `systems`, `system_versions` · env not in repo (Vercel env / GitHub Secrets) |
| Packaging | Thin wrappers (no reimplementation) | [`packaging/npm/`](../packaging/npm/) · [`packaging/pip/`](../packaging/pip/) | `packaging/npm/postinstall.js` · `packaging/pip/pyproject.toml` |
| CI | GitHub Actions | [`.github/workflows/validate.yml`](../.github/workflows/validate.yml) · [`release.yml`](../.github/workflows/release.yml) · [`sync-registry.yml`](../.github/workflows/sync-registry.yml) | Strict `validate` on PR; release on `v*.*.*` |

## Notes

- **Prereqs:** Node `>=18.0.0` (see [`cli/package.json`](../cli/package.json) `engines`) and the real `claude` CLI on `PATH`.
- **Fetch:** CLI uses native `fetch` with `Cache-Control: no-cache` — no HTTP client dep.
- **Registry fallback:** `VercelRegistry` (primary, 5s timeout) → `GitHubRegistry` (`raw.githubusercontent.com`) → `file://` local `registry/index.json`.
- **Code style:** `commander` for CLI, `zod` for validation, ANSI theme in [`cli/src/utils/theme.ts`](../cli/src/utils/theme.ts) (`NO_COLOR`/`isTTY` respected).
- **Keys:** Supabase URL/keys are *not stored in repo* — see Vercel env / GitHub Secrets `SUPABASE_*`.

## Links

- [`cli/tsconfig.json`](../cli/tsconfig.json) · [`cli/src/index.ts`](../cli/src/index.ts) · [`install.sh`](../install.sh) · [`template/starter-system/`](../template/starter-system/)
