# Project Knowledge Map

Last updated: 2026-08-21 · commit 50893ba · `web-vercel/` live, `install.ps1` added, `oss-contrib-finder` @ network:write

Keywords: web-vercel, install.ps1, SHASUMS, CODEOWNERS, oss-contrib-finder, api/registry, Supabase, network:write

One-page entry point for any future AI. Read this first, then open the topic file you need. All paths are relative to repo root.

## What is claude-system

`claude-system` is a package-management layer for **Claude Code Systems** — versioned bundles of `CLAUDE.md` + skills + agents + commands + hooks + MCP/config that together form a reproducible workflow. `install` copies to `~/.claude-system/systems/<name>/`; `run` shells out to the real `claude` CLI inside that directory. This project never replaces Claude Code.

## Stacks

| Stack | Tech | Path | Run |
|---|---|---|---|
| CLI | TypeScript 5 + Node >=18, `commander` 12, `zod` 3, `execa` 8, `vitest` 1 | `cli/` | `npm --prefix cli ci && npm --prefix cli run build && npm --prefix cli test` |
| Schema | JSON Schema draft-07 + zod mirror | `schemas/*.schema.json`, `cli/src/utils/validation.ts:12` `systemJsonSchema` | `node cli/dist/index.js validate` |
| Registry | `registry/index.json` generated (2 systems) | `scripts/generate-index.js:99` `resolve(__dirname,'..')` | `node scripts/generate-index.js` |
| Store | `~/.claude-system/systems/<name>/` + `systems.json` (`setupDone`, `installedFiles`) | `cli/src/lib/storage.ts:196` `collectInstalledFiles` | `CLAUDE_SYSTEM_HOME` for tests |
| Web | Vercel `Other`, vanilla HTML/CSS/JS, **single folder `web-vercel/`** | `web-vercel/`, `vercel.json:35` `/(.*)->/web-vercel/$1` | `https://claude-system-tau.vercel.app` |
| DB | Supabase `systems` + `system_versions`, RLS public read, `pg_trgm` + `search_vector` + `downloads` | `api/_lib/supabase.js:8` `createClient` | Vercel env `SUPABASE_*` |
| Packaging | Thin wrappers | `packaging/npm`, `packaging/pip` | `release.yml` on `v*.*.*` |
| Install | `install.sh` + **`install.ps1` at root** (PowerShell 5.1, Node>=18 fail-hard) | `install.sh:59`, `install.ps1:9` `#Requires -Version 5.1` | `curl .../install.sh \| sh` / `irm .../install.ps1 \| iex` |
| Security | **SHASUMS256.txt** + `.github/CODEOWNERS` + Ruleset `protect-main` | `release.yml:42` `Generate SHASUMS256.txt`, `install.sh:211` `sha256sum -c` | `sha256sum registry/index.json dist/*` |
| CI | `validate.yml` strict + `release.yml` + `sync-registry.yml` read-through cache | `.github/workflows/` | PR + `push:tags` + `push:main` |

## Repo tree (annotated)

```
.
├─ cli/                          ONE real implementation — TS on Node
│  ├─ src/commands/              list, search, info, install, remove, update, run, create, validate, report, doctor, completion
│  ├─ src/lib/                   registry, storage, setupRunner, version, repo, claudeLauncher (see [repo.ts:14 `findRepoSystemSource`](../cli/src/lib/repo.ts))
│  └─ src/utils/                 theme, validation, errors, format
├─ schemas/                      system.schema.json + registry-index.schema.json
├─ systems/<name>/               REAL PR-contributed Systems — must validate
│  ├─ example-system/            fixture (reference only)
│  └─ oss-contrib-finder/        open-source coach · 7 agents + 5 commands · permissions [filesystem:read/write, network:read/write, shell:exec]
├─ template/starter-system/      Scaffold for `create` — keep in sync with schema
├─ registry/index.json           GENERATED — never hand-edit (generate-index.js, 2 systems)
├─ scripts/generate-index.js:99  Builds registry from systems/*/system.json (repoRoot via __dirname)
├─ scripts/sync-supabase.js:12   Upserts registry → Supabase `systems` (service_role)
├─ api/                          Vercel serverless: registry.js, search.js, _lib/supabase.js
├─ web-vercel/                   **Single Vercel source** — index.html + browse/ + system/ + docs/ + public/style.css + public/app.js
├─ packaging/npm|pip             THIN wrappers — no reimplementation
├─ install.sh                    curl | sh entrypoint (Node>=18 gate, SHASUMS verify before chmod)
├─ install.ps1                   PowerShell 5.1 entrypoint — `npm install -g` mirror (Node>=18 fail-hard)
├─ vercel.json                   Rewrites /install→/install.sh, /install.ps1→text/plain, /api s-maxage=60, catch-all /(.*)→/web-vercel/$1
├─ .github/CODEOWNERS            * @hariomlohardev · systems/** @hariomlohardev
└─ .github/workflows/            validate.yml (strict) · release.yml (SHASUMS + npm ci hard) · sync-registry.yml (ADR read-through cache)
```

## Flows

- **User:** `list → search → info → install → run` (first `run` shows `# WHY:` → `y/N` → `setupDone:true` → forever skips) `→ update (manifest+backup) → remove`. **Install choice:** `install.sh` (bash, Git Bash on Windows) vs `install.ps1` (native PowerShell: `irm .../install.ps1 | iex`).
- **Contributor:** `cp -r template/starter-system systems/<name>` → edit `system.json` (`name===folder`) → `validate` → PR only `systems/<name>/` → `validate.yml` green (schema + stale-registry check `jq -S '.systems'`) → merge → `generate-index` → `sync-registry.yml` → Supabase → `/api/registry` fresh (fallback `raw.githubusercontent.com` via [registry.ts:38 `VercelRegistry`](../cli/src/lib/registry.ts)).
- **Release:** `git tag vX.Y.Z && git push --follow-tags` → `release.yml` builds, validates, regenerates registry, `sha256sum` → `SHASUMS256.txt` → `dist/*` + `registry/index.json` + `SHASUMS256.txt` → `action-gh-release` → `npm --provenance` + PyPI OIDC. `workflow_dispatch` dry-run skips publish (hard-fail on tag if secrets missing).

## Hard rules

- Spec is `SYSTEM_SPEC.md` — it wins over convenience. §46 footnote: registry cache (`api/registry` + Supabase + `raw` fallback) is **not** scope creep — see [sync-registry.yml:1 ADR](../.github/workflows/sync-registry.yml).
- `validate.yml` must pass before merge — never bypass (except `hariomlohardev` Bypass for docs). Never hand-edit `registry/index.json`.
- Each `systems/<name>/system.json` `name` must equal folder name (kebab-case); required files `system.json` + `CLAUDE.md` + `README.md`. `additionalProperties: false`.
- `setup.sh` once-only on first `run`: must contain `# WHY:`, gated by `y/N`, `setupDone` persisted; CLI always shells out to real `claude` via [claudeLauncher.ts:37 `spawn('claude')`](../cli/src/lib/claudeLauncher.ts).
- **SHASUMS fail-hard:** `install.sh:211` verifies `SHASUMS256.txt` before `chmod +x`; mismatch → `exit 1`; missing on non-old tag → `exit 1`.
- **CODEOWNERS + Ruleset:** `.github/CODEOWNERS:1` `* @hariomlohardev` + `protect-main` Ruleset — you bypass (docs), others need 1 review.
- **Permissions honest:** `oss-contrib-finder:24` `network:write` required for `shadow-reviewer` pushes + `gh pr create` (was `network:read` only).
- `update` is manifest-aware: hashes `installedFiles` via `storage.ts`, prompts `[o]verwrite / [b]ackup to .bak.<timestamp> then overwrite / [a]bort` (default abort, non-TTY abort).

## Knowledge Files

| File | Purpose | When to read |
|---|---|---|
| [.claude/STACK.md](./.claude/STACK.md) | Stack & tooling per layer | Need tech or build command |
| [.claude/STRUCTURE.md](./.claude/STRUCTURE.md) | Annotated tree + generated marks | Locating a file |
| [.claude/CONTRACTS.md](./.claude/CONTRACTS.md) | Invariants that must not break | Changing schema/flow |
| [.claude/FLOWS.md](./.claude/FLOWS.md) | User / contributor / release lifecycles | Tracing end-to-end |
| [.claude/CLI_MAP.md](./.claude/CLI_MAP.md) | Command → file map | Editing CLI |
| [.claude/DATA.md](./.claude/DATA.md) | `system.json` + registry + Supabase shape | Data contracts |
| [.claude/OPERATIONS.md](./.claude/OPERATIONS.md) | Runbook (dev, PR, release, Vercel) | Operating the repo |
| [.claude/DESIGN_NOTES.md](./.claude/DESIGN_NOTES.md) | Web pointer to DESIGN.md + live URLs | Touching `web-vercel/` |
| [.claude/KNOWLEDGE_INDEX.md](./.claude/KNOWLEDGE_INDEX.md) | Index inside `.claude/` | Topic lookup |

## Where to look next — Locate by task

| I want to… | Open this | Grep |
|---|---|---|
| install on Windows native (no WSL) | `install.ps1` at root + `vercel.json:65` `/install.ps1` | `grep -r "install.ps1" --include="*.md"` |
| add a new System | `docs/creating-a-system.md` + `template/starter-system/` | `grep -r "oss-contrib-finder" systems/` |
| find where Vercel UI lives | `web-vercel/` (single source) | `ls -R web-vercel` |
| understand why Supabase exists | `.github/workflows/sync-registry.yml:1` ADR + `SYSTEM_SPEC.md §46 footnote` | `grep -r "Registry Cache API" .github/` |
| see why `network:write` is required | `systems/oss-contrib-finder/system.json:24` + shadow-reviewer pushes | `grep -r "network:write" systems/` |
| run `list` without cache | `cli/src/lib/registry.ts:13` two-tier fetch `Vercel→raw→file` | `grep -r "raw.githubusercontent" cli/` |
| verify a Release checksum | `release.yml:42` `SHASUMS256.txt` + `install.sh:211` verify | `grep -r "SHASUMS" .github/` |
| see CODEOWNERS bypass | `.github/CODEOWNERS:1` + Ruleset `protect-main` | `grep -r "CODEOWNERS" .github/` |

See also: Stack → [STACK.md](./.claude/STACK.md), Flow → [FLOWS.md](./.claude/FLOWS.md), Data → [DATA.md](./.claude/DATA.md), Ops → [OPERATIONS.md](./.claude/OPERATIONS.md)
