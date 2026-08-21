# Changelog

All notable changes to **claude-system**. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). This project follows [SemVer](https://semver.org/).

## [Unreleased]

### Added
- `SHASUMS256.txt` attached to every Release tag and verified in `install.sh` before `chmod` (fail-hard on mismatch, warn+continue only for old `v0.0`/`v0.1` releases without SHASUMS)
- `.github/CODEOWNERS` — `* @hariomlohardev`, `systems/**` and `.github/workflows/**` auto-request
- `oss-contrib-finder` System (PR #17) — beginner-friendly coach with 7 agents and 5 commands
- `web-vercel/` consolidation — all Vercel UI in one folder with rewrites to `/web-vercel/*` and absolute `/public/` and `/docs/` paths
- Demo assets `docs/assets/demo.svg` and `docs/assets/demo.gif` generated from real CLI outputs
- Star on GitHub pill in every header (desktop and mobile)

### Changed
- Release pipeline hard-fails on tag when `NPM_TOKEN` (or PyPI OIDC) is missing; soft-skips only on `workflow_dispatch` dry-run (was silent `exit 0`)
- Release `npm ci` is now reproducible — `cli/package-lock.json` is tracked and `cache-dependency-path` is used with hard `npm ci` (no fallback)

### Fixed
- `claude-system install <name>` now works from any `cwd` (including `~` and global installs) — resolves via `cli/dist` sibling and falls back to `raw.githubusercontent.com` download
- Vercel rewrites for `/docs` and `/s/:name` use folder destinations to avoid 404 shadowing
- README badges — live `good first issues` via `issues-search`, removed stale `tests 40 passed`
- `install.sh` EACCES fallback for Linux `apt` Node
- `release.yml` pack dry-run uses `cli` working-directory

## [0.2.0] - 2026-08-21

### Added
- Vercel live — https://claude-system-tau.vercel.app with `/install` → `/install.sh` and `/api/registry` + `/api/search?q=` (Supabase `systems` + `system_versions`, public read, `pg_trgm`, `search_vector`)
- Wire + Sync — CLI fetches Vercel first (raw fallback), `sync-registry.yml` upserts on push to `main`
- Downloads — `POST /api/systems/:name/install` + `GET /api/stats`
- Web — editorial ledger design from `code.claude.com` / `claude.com` (Fraunces + Archivo + Space Mono, paper/ink tokens) with `/browse`, `/system`, `/docs`, `/s/:name`
- Knowledge base — `PROJECT_KNOWLEDGE.md` + `.claude/{STACK,STRUCTURE,CONTRACTS,FLOWS,CLI_MAP,DATA,OPERATIONS,DESIGN_NOTES,KNOWLEDGE_INDEX}.md` and `DESIGN.md` / `DESIGN_EXAMPLES_PLAN.md`
- CLI commands — `list`, `search`, `info`, `install`, `remove`, `update`, `run`, `create`, `validate`, `report`, `doctor`, `completion` (commander + zod, `~/.claude-system/systems.json`)

### Changed
- Web moved to Vercel `Other` (vanilla, no build) with `cleanUrls` and headers for `/install` and `/api`

## [0.1.3] - 2026-08-20

### Fixed
- Packaging wrappers (`packaging/npm`, `packaging/pip`) versioning and publish guards
- `install.sh` install dir and Node >=18 gate
- CI — `validate.yml` triggers on `cli/**` and `systems/**`

## [0.1.2] - 2026-08-20

### Added
- Initial schemas (`schemas/system.schema.json`, `schemas/registry-index.schema.json`), `template/starter-system`, `systems/example-system` fixture, `registry/index.json` generator, CLI scaffold, `validate` and `SYSTEM_SPEC.md`

[Unreleased]: https://github.com/hariomlohardev/claude-system/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/hariomlohardev/claude-system/releases/tag/v0.2.0
[0.1.3]: https://github.com/hariomlohardev/claude-system/releases/tag/v0.1.3
[0.1.2]: https://github.com/hariomlohardev/claude-system/releases/tag/v0.1.2
