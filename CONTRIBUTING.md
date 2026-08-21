# Contributing to claude-system

A **System** is a versioned bundle of `CLAUDE.md`, skills, agents, commands, hooks, and config that together form a reproducible Claude Code environment. See [`SYSTEM_SPEC.md`](SYSTEM_SPEC.md) and [`docs/creating-a-system.md`](docs/creating-a-system.md) for the full guide. This document covers the mechanics of contributing via GitHub.

## Prerequisites

- **Node.js >= 18** and **npm** (`node -v`, `npm -v`)
- **git** and a GitHub account (fork + PR workflow)
- **`gh` CLI (optional)** — only needed for Systems that use `gh` auth in `setup.sh`
- No other toolchain is required. The registry is plain JSON; the CLI is TypeScript on `commander`/`zod`.

## How to contribute a System

All Systems live under `systems/<name>/` and are contributed via pull requests. Direct pushes to `main` are not accepted for Systems.

```sh
# 1. Fork on GitHub, then clone your fork
git clone https://github.com/<you>/claude-system.git
cd claude-system

# 2. Create a branch
git checkout -b system/<my-system>

# 3. Scaffold from the starter template
cp -r template/starter-system systems/<my-system>

# 4. Edit the scaffold
#  - systems/<my-system>/system.json  — set "name" === folder name (kebab-case),
#    fill displayName, version (semver), description (10-300 chars), keywords,
#    author, license (SPDX), claudeSystem.specVersion, permissions[] (honest!),
#    and optional repository/bugs/homepage/category/dependencies
#  - systems/<my-system>/CLAUDE.md    — real instructions for the System (prompt injected on run)
#  - systems/<my-system>/README.md    — human docs for browsing
#  - Add setup.sh with a "# WHY:" comment/echo if the System needs shell setup
#    (must then include "shell:exec" in permissions)
#  - Add skills/, agents/, commands/, hooks/ as needed (delete empty placeholder dirs)

# 5. Local checks (must all be green before pushing)
npm --prefix cli ci
npm --prefix cli run build
npm --prefix cli test
node cli/dist/index.js validate systems/<my-system>
node scripts/generate-index.js   # do NOT commit registry/index.json — it is generated
# restore the generated file if you ran the generator locally:
git restore registry/index.json

# 6. Commit and push — PR must touch only systems/<my-system>/
git add systems/<my-system>
git commit -m "feat(system): add <my-system>"
git push origin system/<my-system>
# Open PR on GitHub into hariomlohardev/claude-system:main
# Target: systems/<my-system>/ only — never touch cli/, schemas/, workflows/, or registry/index.json directly
```

### What to get right

- **`name` === folder name, kebab-case** — `systems/my-system/system.json` must have `"name": "my-system"`. This is the #1 CI failure.
- **Required files** — every System must have `system.json`, `CLAUDE.md`, `README.md`.
- **`permissions[]` honestly declared** — if `setup.sh` or any hook runs shell code, you **must** include `"shell:exec"`; if you fetch the network, include `"network:read"`/`"network:write"`. See [`docs/security.md`](docs/security.md).
- **`setup.sh` WHY message** — if `setup.sh` exists, it must contain a line like `# WHY: installs claude and checks gh auth` — this is what `claude-system run` surfaces in the consent prompt. Missing WHY → CI fails.
- **Do not hand-edit `registry/index.json`** — it is rebuilt by `scripts/generate-index.js` from `systems/*/system.json`. Hand-edit → CI fails.

## PR flow

1. **CI `validate.yml` runs** on every PR touching `systems/**`, `schemas/**`, `template/**`, `scripts/**`, `registry/index.json`. It:
   - Validates every `system.json` against `schemas/system.schema.json` (strict, `additionalProperties: false`)
   - Checks `name` === folder, required files, semver `version` bump for updates
   - Cross-checks `permissions` vs `setup.sh` (see below)
   - Checks `setup.sh` WHY message
   - Emits warnings (not hard fails) for unsafe patterns (`curl | sh`, `rm -rf /`)
   - Guards against hand-edited `registry/index.json`
   - Validates the template itself

   **All checks must be green before merge.** Do not ask a maintainer to bypass.

2. **Maintainer review** — a maintainer reviews `setup.sh`'s WHY message, `permissions`, content quality, and policy. They may request changes.

3. **Merge** — on merge to `main`, `registry/index.json` is regenerated and the System becomes available via `claude-system list`/`search`/`info`/`install` (always fresh fetch from `https://raw.githubusercontent.com/hariomlohardev/claude-system/main/registry/index.json`).

## Local checks before every PR

Run these from the repo root and fix any failures:

```sh
npm --prefix cli ci
npm --prefix cli run build
npm --prefix cli test
node cli/dist/index.js validate
node cli/dist/index.js validate template/starter-system
node cli/dist/index.js validate systems/<my-system>
node scripts/generate-index.js
node cli/dist/index.js --help   # should render in Claude Code theme (cyan/gray, respects NO_COLOR)
```

`registry/index.json` must remain sorted by `name` and validate against `schemas/registry-index.schema.json` — the generator does this.

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `name must exactly match folder name (kebab-case)` | `system.json` `name` !== folder | Set `"name"` to folder or rename folder: `mv systems/old systems/new` |
| `Missing CLAUDE.md / README.md` | Required files absent | `cp template/starter-system/CLAUDE.md systems/<name>/` and same for `README.md` |
| `setup.sh exists but permissions does not include shell:exec` | `setup.sh` needs `shell:exec` | Add `"shell:exec"` to `permissions[]` in `system.json` |
| `WHY message missing` | `setup.sh` without `# WHY:` | Add `# WHY: ...` to `setup.sh` |
| `registry/index.json is generated — do not hand-edit` | Hand-edited generated file | `git restore registry/index.json && node scripts/generate-index.js` |

## Branch protection

`main` requires `validate.yml` to pass before merge. No direct pushes for Systems — use the fork + PR flow above. Never bypass CI.

## Trust model

`permissions` are **self-declared by authors and reviewed by maintainers, not independently verified at runtime**. `setup.sh` is reviewed and gated by a **one-time consent prompt on first `claude-system run`** — never silently executed. Treat installs with the same scrutiny as any third-party package. See [`docs/security.md`](docs/security.md) and [`SECURITY.md`](SECURITY.md).

## Questions?

- System authoring deep-dive: [`docs/creating-a-system.md`](docs/creating-a-system.md)
- Architecture & registry: [`docs/architecture.md`](docs/architecture.md), [`docs/registry.md`](docs/registry.md)
- Mindmap: [`docs/MINDMAP.md`](docs/MINDMAP.md)
