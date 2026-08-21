# Stack & Tooling

Keywords: web-vercel, install.ps1, SHASUMS, Supabase, npm ci, oss-contrib-finder

| Layer | Tech | Path | Commands |
|---|---|---|---|
| CLI | TypeScript 5 + Node >=18, `commander` 12, `zod` 3, `execa` 8, `simple-git` 3, `vitest` 1 | [`cli/`](./../cli/) · [`cli/package.json`](../cli/package.json) | `npm --prefix cli ci` · `npm --prefix cli run build` (`tsc`) · `npm --prefix cli test` |
| Schema | JSON Schema draft-07 + zod mirror | [`schemas/system.schema.json`](../schemas/system.schema.json) · [`schemas/registry-index.schema.json`](../schemas/registry-index.schema.json) · [`cli/src/utils/validation.ts:12`](../cli/src/utils/validation.ts) | `node cli/dist/index.js validate` |
| Registry | Generated `registry/index.json` (2 systems, sorted by `name`) | [`scripts/generate-index.js:99`](../scripts/generate-index.js) `resolve(__dirname,'..')` | `node scripts/generate-index.js` |
| Store | `~/.claude-system/systems/<name>/` + `systems.json` (`setupDone`, `installedFiles[]` via sha256) | [`cli/src/lib/storage.ts:196`](../cli/src/lib/storage.ts) `collectInstalledFiles` | `CLAUDE_SYSTEM_HOME` override for tests |
| Web | **Vercel `Other`, single folder `web-vercel/`**, vanilla HTML/CSS/JS, no build | [`web-vercel/`](../web-vercel/) · [`vercel.json:35`](../vercel.json) `/(.*)->/web-vercel/$1` | `https://claude-system-tau.vercel.app` · `/api/registry` (s-maxage=60) |
| DB | Supabase Postgres + `pg_trgm`, RLS public read, `search_vector` + `downloads` | [`api/_lib/supabase.js:8`](../api/_lib/supabase.js) | Tables `systems`, `system_versions` · env Vercel/Secrets `SUPABASE_*` |
| Install | **`install.sh` (bash) + `install.ps1` at root (PowerShell 5.1, Node>=18 fail-hard)** | [`install.sh:59`](../install.sh) `Node gate` · [`install.ps1:9`](../install.ps1) `#Requires -Version 5.1` | `curl .../install.sh \| sh` · `irm .../install.ps1 \| iex` |
| Release | **SHASUMS256.txt + CODEOWNERS + Ruleset `protect-main` bypass** | [`.github/workflows/release.yml:42`](../.github/workflows/release.yml) `sha256sum registry/index.json dist/*` | `release.yml` on `v*.*.*` (npm ci hard, hard-fail on tag) |
| System | **`oss-contrib-finder` example** — 7 agents + 5 commands, `network:write` honest | [`systems/oss-contrib-finder/`](../systems/oss-contrib-finder/) · [`system.json:24`](../systems/oss-contrib-finder/system.json) | `permissions: filesystem:read/write + network:read/write + shell:exec` |
| Packaging | Thin wrappers (no reimplementation) | [`packaging/npm/`](../packaging/npm/) · [`packaging/pip/`](../packaging/pip/) | `packaging/npm/postinstall.js` · `pyproject.toml` |
| CI | GitHub Actions | [`.github/workflows/validate.yml`](../.github/workflows/validate.yml) · [`release.yml`](../.github/workflows/release.yml) · [`sync-registry.yml:1`](../.github/workflows/sync-registry.yml) ADR cache | Strict `validate` + stale-registry `jq -S '.systems'` + `npm ci` hard |

## Notes

- **Prereqs:** Node `>=18.0.0` ([`cli/package.json`](../cli/package.json) `engines`) and the real `claude` CLI on `PATH`.
- **Fetch:** CLI uses native `fetch` with `Cache-Control: no-cache` — no HTTP client dep. Two-tier: `VercelRegistry` (primary, 5s timeout) → `GitHubRegistry` (`raw.githubusercontent.com`) → `file://` local.
- **Web single folder:** All Vercel static is `web-vercel/` (see [STRUCTURE.md](STRUCTURE.md)) — not `public/` at repo root. `vercel.json` catch-all `/(.*) → /web-vercel/$1` keeps `Other` green.
- **Install gates fail-hard:** `install.sh:67` `NODE_MAJOR -lt 18 → exit 1`, `install.ps1:15` same; `install.sh:211` `SHASUMS256.txt` verify before `chmod +x` (mismatch → `exit 1`, missing on new tag → `exit 1`, warn only for `v0.0`/`v0.1`).
- **Keys:** Supabase URL/keys are *not stored in repo* — see Vercel env / GitHub Secrets `SUPABASE_*`.

## Links

- [`cli/tsconfig.json`](../cli/tsconfig.json) · [`cli/src/index.ts`](../cli/src/index.ts) · [`install.sh`](../install.sh) · [`install.ps1`](../install.ps1) · [`template/starter-system/`](../template/starter-system/) · [`.github/CODEOWNERS`](../.github/CODEOWNERS)

See also: Structure → [STRUCTURE.md](STRUCTURE.md), Contracts → [CONTRACTS.md](CONTRACTS.md), Data → [DATA.md](DATA.md)
