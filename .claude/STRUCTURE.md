# Repository Structure

```text
.
├─ cli/                          The ONE real implementation (TypeScript on Node)
│  ├─ src/index.ts               Entrypoint — commander program, registers commands
│  ├─ src/commands/              list, search, info, install, remove, update, run, create, validate, report, doctor, completion
│  ├─ src/lib/                   registry, storage, setupRunner, version, repo, claudeLauncher
│  ├─ src/utils/                 theme, validation, errors, format
│  └─ dist/                      BUILD ARTIFACT — tsc output, do not hand-edit
├─ schemas/                      JSON Schema draft-07
│  ├─ system.schema.json         Validates systems/*/system.json
│  └─ registry-index.schema.json Validates registry/index.json (generated)
├─ systems/<name>/               REAL PR-contributed Systems (one folder per System)
├─ template/starter-system/      Scaffold copied by `claude-system create`
│  ├─ system.json · CLAUDE.md · README.md · settings.json
│  └─ agents/ commands/ hooks/ skills/ (empty placeholders)
├─ registry/index.json           GENERATED — never hand-edit (scripts/generate-index.js)
├─ scripts/generate-index.js     Rebuilds registry from systems/*/system.json
├─ scripts/sync-supabase.js      Syncs registry → Supabase (if present)
├─ api/                          Vercel serverless — registry.js, search.js, _lib/supabase.js
├─ public/                       Vanilla site — style.css, app.js, html copies
├─ packaging/npm|pip             THIN wrappers — no reimplementation
├─ .github/workflows/            validate.yml (strict) · release.yml (v*.*.*) · sync-registry.yml
├─ docs/                         creating-a-system.md, security.md (human-readable mirrors of spec)
├─ vercel.json                   Rewrites /install→/install.sh, /api headers, cleanUrls
└─ install.sh                    curl | sh entrypoint — fetches GitHub Release asset
```

## Marks

- `GENERATED` / `BUILD ARTIFACT` / `DO NOT HAND-EDIT`: `registry/index.json`, `cli/dist/`.
- `REAL PR CONTRIBUTED`: `systems/<name>/` only — each folder must validate.
- `THIN WRAPPER`: `packaging/npm`, `packaging/pip` — shell to `cli/`.

## Where `findRepoSystemSource` resolves `systems/<name>`

Search order in [`cli/src/lib/repo.ts`](../cli/src/lib/repo.ts):
1. `cli/dist` sibling (`join(distDir, '../../systems/<name>')`) — when installed globally.
2. `process.cwd()` walk-up — dev from repo root.
3. `CLAUDE_SYSTEM_REPO_ROOT` env — explicit override (tests/CI).

```ts
// cli/src/lib/repo.ts — simplified
findRepoSystemSource(name) // → { path, systemJson } | null
```

## Top-level files

| File | Purpose |
|---|---|
| `CLAUDE.md` | Session orientation for Claude Code — repo map + conventions |
| `SYSTEM_SPEC.md` | Formal contract — wins over convenience |
| `README.md` | Install, quickstart, commands, available systems |
| `CONTRIBUTING.md` | Contributor flow |
| `SECURITY.md` / `CODE_OF_CONDUCT.md` | Policy |
| `LICENSE` | MIT |
| `vercel.json` | Vercel rewrites + headers |
| `install.sh` | `curl | sh` installer |
| `PROJECT_KNOWLEDGE.md` | This knowledge map — entry point for future AI |

## Links

- [`cli/src/lib/repo.ts`](../cli/src/lib/repo.ts) · [`cli/src/lib/registry.ts`](../cli/src/lib/registry.ts) · [`cli/src/lib/storage.ts`](../cli/src/lib/storage.ts)
