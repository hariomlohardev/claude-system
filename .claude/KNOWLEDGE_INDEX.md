# Knowledge Index

Start with [`../PROJECT_KNOWLEDGE.md`](../PROJECT_KNOWLEDGE.md) — one-page map — then pick the topic below.

## Topic files (in `.claude/`)

| File | One-line purpose | When to read it |
|---|---|---|
| [`STACK.md`](STACK.md) | Stack & tooling per layer + build commands | Need tech or `npm --prefix cli …` |
| [`STRUCTURE.md`](STRUCTURE.md) | Annotated tree + generated marks + `findRepoSystemSource` | Locating a file |
| [`CONTRACTS.md`](CONTRACTS.md) | Invariants that must not break | Changing schema/flow |
| [`FLOWS.md`](FLOWS.md) | User / contributor / release lifecycles | Tracing end-to-end |
| [`CLI_MAP.md`](CLI_MAP.md) | Command → file + lib map | Editing CLI |
| [`DATA.md`](DATA.md) | `system.json` + `registry` + Supabase + `vercel.json` shape | Data contracts |
| [`OPERATIONS.md`](OPERATIONS.md) | Runbook: dev, PR, release, Vercel/Supabase | Operating the repo |
| [`DESIGN_NOTES.md`](DESIGN_NOTES.md) | Web pointer to `DESIGN.md` + live URLs | Touching `public/` |

## Canonical docs (repo root / `docs/`)

| File | Purpose |
|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | Session orientation — repo map + conventions |
| [`../SYSTEM_SPEC.md`](../SYSTEM_SPEC.md) | Formal contract — wins over convenience |
| [`../README.md`](../README.md) | Install, quickstart, commands, available systems |
| [`../docs/creating-a-system.md`](../docs/creating-a-system.md) | Contributor guide (must stay in sync with schema + template) |
| [`../docs/security.md`](../docs/security.md) | Trust model + permissions |

## Second-file hints

- Stack question? → `STACK.md`. File location? → `STRUCTURE.md`. Hard rule? → `CONTRACTS.md`.
- User path / PR path / release? → `FLOWS.md`. CLI command impl? → `CLI_MAP.md`.
- `system.json` fields / Supabase / `vercel.json`? → `DATA.md`. Deploy or local build? → `OPERATIONS.md`. Web chrome? → `DESIGN_NOTES.md` → [`DESIGN.md`](DESIGN.md).
