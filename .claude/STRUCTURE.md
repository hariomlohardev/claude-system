# Repository Structure

Keywords: web-vercel, install.ps1, oss-contrib-finder, CODEOWNERS, SHASUMS

```text
.
├─ cli/                           The ONE real implementation (TypeScript on Node)
│  ├─ src/index.ts                Entrypoint — commander program, registers commands
│  ├─ src/commands/               list, search, info, install, remove, update, run, create, validate, report, doctor, completion
│  │  └─ run.ts:16                `command.args.slice(1)` (was 3 derivations, now 1) — see [CLI_MAP.md](CLI_MAP.md)
│  ├─ src/lib/                    registry, storage, setupRunner, version, repo, claudeLauncher
│  ├─ src/utils/                  theme, validation, errors, format
│  └─ dist/                       BUILD ARTIFACT — tsc output, do not hand-edit
├─ schemas/                       JSON Schema draft-07
│  ├─ system.schema.json          Validates systems/*/system.json (permissions enum 6 values)
│  └─ registry-index.schema.json  Validates registry/index.json (generated, sorted)
├─ systems/<name>/                REAL PR-contributed Systems (one folder per System)
│  ├─ example-system/             fixture (reference only, network:read only)
│  └─ oss-contrib-finder/         open-source coach — system.json:24 network:write honest, 7 agents + 5 commands
│     ├─ system.json · CLAUDE.md · README.md · PORTFOLIO.example.md
│     ├─ agents/  (repo-scout, issue-hunter, issue-triager, fit-scorer, repo-archaeologist, shadow-reviewer, portfolio-curator)
│     ├─ commands/(understand, find-issues, solve-issue, history, portfolio)
│     └─ .claude/state/ (profile, current-issue.json, contributions-log.md)
├─ template/starter-system/       Scaffold copied by `claude-system create`
│  ├─ system.json · CLAUDE.md · README.md · settings.json
│  └─ agents/ commands/ hooks/ skills/ (empty placeholders)
├─ registry/index.json            GENERATED — never hand-edit (scripts/generate-index.js, 2 systems, sorted)
├─ scripts/generate-index.js:99   Rebuilds registry (repoRoot via resolve(__dirname,'..'), guard expectedCount)
├─ scripts/sync-supabase.js:12    Syncs registry → Supabase `systems` (service_role, downloads, search_vector)
├─ api/                           Vercel serverless — registry.js, search.js, _lib/supabase.js (Other)
├─ web-vercel/                    **Single Vercel source** — the ONLY site folder (see DESIGN_NOTES.md)
│  ├─ index.html · browse/index.html · system/index.html · docs/** · 404.html
│  ├─ public/style.css + public/app.js  (single shared stylesheet + app — vanilla, no build)
│  └─ README.md                   One-para “single folder” note — why web-vercel exists
├─ packaging/npm|pip              THIN wrappers — no reimplementation
├─ .github/workflows/             validate.yml (strict + stale-registry jq check) · release.yml (SHASUMS + npm ci hard) · sync-registry.yml (ADR read-through cache)
├─ .github/CODEOWNERS             * @hariomlohardev · systems/** @hariomlohardev · .github/workflows/** @hariomlohardev
├─ docs/                          creating-a-system.md, security.md (human-readable mirrors of spec)
├─ vercel.json:1                  Rewrites /install→/install.sh, /install.ps1→text/plain, /(.*)→/web-vercel/$1, /api s-maxage=60
├─ install.sh:59                  curl | sh entrypoint — Node>=18 gate, SHASUMS verify before chmod
└─ install.ps1:1                  PowerShell 5.1 entrypoint — #Requires -Version 5.1, npm install -g mirror
```

## Marks

- `GENERATED` / `BUILD ARTIFACT` / `DO NOT HAND-EDIT`: `registry/index.json`, `cli/dist/`.
- `REAL PR CONTRIBUTED`: `systems/<name>/` only — each folder must validate (`validate.yml` strict).
- `THIN WRAPPER`: `packaging/npm`, `packaging/pip` — shell to `cli/`.
- `SINGLE SOURCE` for web: `web-vercel/` only — never `public/` at repo root; `vercel.json` catch-all proves it.
- `ROOT ENTRYPOINTS`: `install.sh` + `install.ps1` at repo root (not inside `web-vercel/`).

## Where `findRepoSystemSource` resolves `systems/<name>`

Search order in [`cli/src/lib/repo.ts:14`](../cli/src/lib/repo.ts) `findRepoSystemSource` (fixed for “run from ~”):

1. `cli/dist` sibling (`join(distDir, '../../systems/<name>')`) — when installed globally via npm/pip.
2. `process.cwd()` walk-up — dev from repo root (`findUp`).
3. `CLAUDE_SYSTEM_REPO_ROOT` env — explicit override (tests/CI).
4. GitHub raw fallback: `downloadSystemFromGitHub` in [`install.ts:58`](../cli/src/commands/install.ts) (mirrors `install.sh` raw URL).

```ts
// cli/src/lib/repo.ts:14 — simplified
findRepoSystemSource(name) // → { path, systemJson } | null
```

## Top-level files

| File | Purpose |
|---|---|
| `CLAUDE.md` | Session orientation for Claude Code — repo map + conventions |
| `SYSTEM_SPEC.md` | Formal contract — wins over convenience (§46 footnote: registry cache not scope creep) |
| `README.md` | Install (sh + ps1), quickstart, commands, available systems |
| `CONTRIBUTING.md` | Contributor flow |
| `SECURITY.md` / `CODE_OF_CONDUCT.md` | Policy |
| `LICENSE` | MIT |
| `vercel.json` | Vercel rewrites + headers (web-vercel + install.ps1 + api) |
| `install.sh` / `install.ps1` | Entry points — curl\|sh vs `irm ... \| iex` |
| `PROJECT_KNOWLEDGE.md` | This knowledge map — entry point for future AI |

## Links

- [`cli/src/lib/repo.ts`](../cli/src/lib/repo.ts) · [`cli/src/lib/registry.ts`](../cli/src/lib/registry.ts) · [`cli/src/lib/storage.ts`](../cli/src/lib/storage.ts) · [`.claude/DESIGN.md`](DESIGN.md) · [`web-vercel/README.md`](../web-vercel/README.md)

See also: Stack → [STACK.md](STACK.md), Data → [DATA.md](DATA.md), Flows → [FLOWS.md](FLOWS.md)
