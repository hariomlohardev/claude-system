# Project Knowledge Map

Last updated: 2026-08-21 · commit 005cd75

One-page entry point for any future AI. Read this first, then open the topic file you need.

## What is claude-system

`claude-system` is a package-management layer for **Claude Code Systems** — versioned bundles of `CLAUDE.md` + skills + agents + commands + hooks + MCP/config that together form a reproducible workflow. `install` copies to `~/.claude-system/systems/<name>/`; `run` shells out to the real `claude` CLI inside that directory. This project never replaces Claude Code.

## Stacks

| Stack | Tech | Path | Run |
|---|---|---|---|
| CLI | TypeScript + Node >=18, `commander`, `zod`, `execa`, `vitest` | `cli/` | `npm --prefix cli ci && npm --prefix cli run build && npm --prefix cli test` |
| Schema | JSON Schema draft-07 + zod mirror | `schemas/*.schema.json`, `cli/src/utils/validation.ts` | `node cli/dist/index.js validate` |
| Registry | `registry/index.json` generated | `scripts/generate-index.js` | `node scripts/generate-index.js` |
| Store | `~/.claude-system/systems/<name>/` + `systems.json` (`setupDone`) | `cli/src/lib/storage.ts` | env `CLAUDE_SYSTEM_HOME` for tests |
| Web | Vercel `Other`, vanilla HTML/CSS/JS | `public/`, `api/`, `vercel.json` | `https://claude-system-tau.vercel.app` |
| DB | Supabase `systems` + `system_versions`, RLS public read | `api/_lib/supabase.js` | Vercel env `SUPABASE_*` |
| Packaging | Thin wrappers | `packaging/npm`, `packaging/pip` | `release.yml` on `v*.*.*` |
| CI | `validate.yml` strict + `release.yml` + `sync-registry.yml` | `.github/workflows/` | PR + `push:tags` |

## Repo tree (annotated)

```
.
├─ cli/                         ONE real implementation — TS on Node
│  ├─ src/commands/             list, search, info, install, remove, update, run, create, validate, report, doctor, completion
│  ├─ src/lib/                  registry, storage, setupRunner, version, repo, claudeLauncher
│  └─ src/utils/                theme, validation, errors, format
├─ schemas/                     system.schema.json + registry-index.schema.json
├─ systems/<name>/              REAL PR-contributed Systems — must validate
├─ template/starter-system/     Scaffold for `create` — keep in sync with schema
├─ registry/index.json          GENERATED — never hand-edit (generate-index.js)
├─ scripts/generate-index.js    Builds registry from systems/*/system.json
├─ api/                         Vercel serverless: registry, search, systems/[name]
├─ public/                      Vanilla site: style.css + app.js + html
├─ packaging/npm|pip            THIN wrappers, no reimplementation
├─ install.sh                   curl | sh entrypoint
└─ vercel.json                  Rewrites /install→/install.sh, /api headers
```

## Flows

- **User:** `list → search → info → install → run` (first `run` shows `# WHY:` → `y/N` → `setupDone:true` → forever skips setup) `→ update → remove`.
- **Contributor:** `cp -r template/starter-system systems/<name>` → edit `system.json` (`name===folder`) → `node cli/dist/index.js validate` → PR only `systems/<name>/` → `validate.yml` green → merge → `generate-index` + Supabase sync → `/api/registry` fresh.
- **Release:** `git tag vX.Y.Z && git push --follow-tags` → `release.yml` builds CLI, validates, regenerates registry, publishes npm + PyPI + GitHub Release.

## Hard rules

- Spec is `SYSTEM_SPEC.md` — it wins over convenience.
- `validate.yml` must pass before merge — never bypass.
- `registry/index.json` is GENERATED — never hand-edit.
- Each `systems/<name>/system.json` `name` must equal folder name (kebab-case); required files `system.json` + `CLAUDE.md` + `README.md`.
- `setup.sh` once-only on first `run`: must contain `# WHY:`, gated by `y/N`, `setupDone` persisted; CLI always shells out to real `claude`.

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
| [.claude/DESIGN_NOTES.md](./.claude/DESIGN_NOTES.md) | Web pointer to DESIGN.md + live URLs | Touching `public/` |
| [.claude/KNOWLEDGE_INDEX.md](./.claude/KNOWLEDGE_INDEX.md) | Index inside `.claude/` | Topic lookup |

## Where to look next

- Stack? → [STACK.md](./.claude/STACK.md). Flow? → [FLOWS.md](./.claude/FLOWS.md). Contract? → [CONTRACTS.md](./.claude/CONTRACTS.md).
- Canonical docs: [CLAUDE.md](CLAUDE.md) · [SYSTEM_SPEC.md](SYSTEM_SPEC.md) · [README.md](README.md) · [docs/creating-a-system.md](docs/creating-a-system.md) · [docs/security.md](docs/security.md)
