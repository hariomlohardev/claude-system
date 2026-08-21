# Knowledge Index

Keywords: install.ps1, web-vercel, SHASUMS, CODEOWNERS, oss-contrib-finder

Start with [`../PROJECT_KNOWLEDGE.md`](../PROJECT_KNOWLEDGE.md) — one-page map — then pick the topic below.

## Topic files (in `.claude/`)

| File | One-line purpose | When to read it |
|---|---|---|
| [`STACK.md`](STACK.md) | Stack & tooling per layer + build commands (web-vercel, install.ps1, SHASUMS, Supabase) | Need tech or `npm --prefix cli …` |
| [`STRUCTURE.md`](STRUCTURE.md) | Annotated tree + generated marks + `findRepoSystemSource` (web-vercel single source) | Locating a file |
| [`CONTRACTS.md`](CONTRACTS.md) | Invariants that must not break (SHASUMS fail-hard, CODEOWNERS/Ruleset, network:write) | Changing schema/flow |
| [`FLOWS.md`](FLOWS.md) | User / contributor / release lifecycles (install.ps1 vs install.sh, sync-registry) | Tracing end-to-end |
| [`CLI_MAP.md`](CLI_MAP.md) | Command → file + lib map (command.args, manifest backup) | Editing CLI |
| [`DATA.md`](DATA.md) | `system.json` + `registry` (2 systems) + Supabase (downloads, search_vector) + `vercel.json` web-vercel | Data contracts |
| [`OPERATIONS.md`](OPERATIONS.md) | Runbook: dev, PR, release, Vercel/Supabase, CODEOWNERS bypass | Operating the repo |
| [`DESIGN_NOTES.md`](DESIGN_NOTES.md) | Web pointer to `DESIGN.md` + live URLs (web-vercel single folder) | Touching `web-vercel/` |
| [`DESIGN.md`](DESIGN.md) | Registry ledger design system — paper + ink + stamp accent (law) | Building UI |
| [`DESIGN_EXAMPLES_PLAN.md`](DESIGN_EXAMPLES_PLAN.md) | 5 HTML examples keep-vs-tweak (now reflects install.ps1 alternative) | Updating examples |

**New pinpoint rows (recent fixes):**

| File | One-line purpose | When to read it |
|---|---|---|
| [`../install.ps1`](../install.ps1) | **Windows native install** — PowerShell 5.1, Node>=18 gate fail-hard, `npm install -g` mirror | Installing on Windows without WSL/Git Bash |
| [`../web-vercel/`](../web-vercel/) | **Vercel UI single source** — the ONLY site folder (not `public/` at root) | Finding any page, style, or app.js |
| [`../.github/workflows/release.yml`](../.github/workflows/release.yml) | **SHASUMS256.txt** generation + `npm ci` hard + hard-fail on tag | Cutting or debugging a Release |
| [`../.github/CODEOWNERS`](../.github/CODEOWNERS) | **CODEOWNERS + Ruleset `protect-main`** — `* @hariomlohardev`, you bypass | Understanding why direct push works for you |
| [`../systems/oss-contrib-finder/`](../systems/oss-contrib-finder/) | **Reference System** — 7 agents + 5 commands, `network:write` honest for pushes | Adding a System that needs `network:write` |

## Canonical docs (repo root / `docs/`)

| File | Purpose |
|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | Session orientation — repo map + conventions + knowledge pointer |
| [`../SYSTEM_SPEC.md`](../SYSTEM_SPEC.md) | Formal contract — wins over convenience (§46 footnote: cache not scope creep) |
| [`../README.md`](../README.md) | Install (`sh` + `ps1`), quickstart, commands, available systems |
| [`../docs/creating-a-system.md`](../docs/creating-a-system.md) | Contributor guide (must stay in sync with schema + template) |
| [`../docs/security.md`](../docs/security.md) | Trust model + permissions (`network:write` for push, SHASUMS verify) |

## Locate by task — Pinpoint in 10s

| I want to… | Open this | Grep |
|---|---|---|
| install on Windows native (no WSL) | `install.ps1` at root + `vercel.json:65` `/install.ps1` | `grep -r "install.ps1" --include="*.md"` |
| add a new System | `docs/creating-a-system.md` + `template/starter-system/` | `grep -r "oss-contrib-finder" systems/` |
| find where Vercel UI lives | `web-vercel/` (single source) | `ls -R web-vercel` |
| understand why Supabase exists | `.github/workflows/sync-registry.yml:1` ADR + `SYSTEM_SPEC.md §46 footnote` | `grep -r "Registry Cache API" .github/` |
| see why `network:write` is required | `systems/oss-contrib-finder/system.json:24` + shadow-reviewer pushes | `grep -r "network:write" systems/` |
| run `list` without cache | `cli/src/lib/registry.ts:13` two-tier fetch `Vercel→raw→file` | `grep -r "raw.githubusercontent" cli/` |
| verify a Release checksum | `release.yml:42` + `install.sh:211` SHASUMS verify | `grep -r "SHASUMS" .github/` |
| see CODEOWNERS bypass | `.github/CODEOWNERS:1` + Ruleset `protect-main` | `grep -r "CODEOWNERS" .github/` |

## Second-file hints

- Stack question? → `STACK.md`. File location? → `STRUCTURE.md`. Hard rule? → `CONTRACTS.md`.
- User path / PR path / release? → `FLOWS.md`. CLI command impl? → `CLI_MAP.md`.
- `system.json` fields / Supabase / `vercel.json` web-vercel? → `DATA.md`. Deploy or local build? → `OPERATIONS.md`. Web chrome? → `DESIGN_NOTES.md` → [`DESIGN.md`](DESIGN.md).

## Search keyword map

```
Keyword map: install.ps1 → STACK + OPERATIONS + web-vercel/README + PROJECT_KNOWLEDGE locate table;
web-vercel → STRUCTURE + DESIGN_NOTES + PROJECT_KNOWLEDGE repo tree;
SHASUMS → CONTRACTS + release.yml + install.sh + FLOWS;
CODEOWNERS/Ruleset → CONTRACTS + OPERATIONS + STACK;
oss-contrib-finder → DATA + STRUCTURE + FLOWS + KNOWLEDGE_INDEX;
Supabase sync → CONTRACTS + FLOWS + DATA + OPERATIONS;
raw fallback → CLI_MAP + CONTRACTS + FLOWS + OPERATIONS scope discipline;
network:write → DATA + CONTRACTS + oss-contrib-finder/system.json
```

See also: Entry → [PROJECT_KNOWLEDGE.md](../PROJECT_KNOWLEDGE.md), Stack → [STACK.md](STACK.md), Data → [DATA.md](DATA.md)
