# CLAUDE.md — claude-system

This file orients any Claude Code session working in this repository.
Read this before making changes.

## What this project is

`claude-system` is a package-management and ecosystem layer for **Claude Code
Systems** — versioned, distributable bundles of `CLAUDE.md`, skills, agents,
commands, hooks, and configuration that together form a reproducible,
purpose-built Claude Code environment (e.g. "open-source contributor",
"frontend development").

**Core rule: this project does not replace Claude Code.** It manages
environments around Claude Code and always shells out to the real `claude`
CLI to do actual AI work. If a task starts to look like "build a chat
runtime" or "build a coding agent," stop — that is out of scope.

See `SYSTEM_SPEC.md` for the formal contract. When in doubt, the spec wins
over convenience.

## Repo map (what lives where)

```
cli/                    The ONE real implementation. TypeScript on Node.
  src/                  Source. Commands: install, list, info, run, remove,
                         create, validate, search, update.
  tests/

packaging/               THIN wrappers only — no reimplementation.
  npm/                   Publishes cli/ (or a built binary) to npm.
  pip/                   Publishes a Python wrapper to PyPI, same artifact.
install.sh                curl | sh entrypoint, fetches a GitHub Release asset.

schemas/                 JSON Schemas. system.schema.json validates every
                         systems/*/system.json. registry-index.schema.json
                         validates the generated registry/index.json.

systems/                 REAL, PR-contributed Systems live here. One folder
                         per System (systems/open-source/, systems/frontend/).
                         Each MUST validate against schemas/system.schema.json.

registry/index.json      GENERATED. Never hand-edit. Rebuilt by
                         scripts/generate-index.js from systems/*/system.json.
                         This is the single small file the CLI fetches for
                         search/list/info — not the whole repo.

template/starter-system/ What `claude-system create` copies to scaffold a
                         new System. Keep in sync with schemas/system.schema.json.

docs/                     Human-readable docs. creating-a-system.md is the
                         contributor-facing guide; the others mirror
                         SYSTEM_SPEC.md sections for readability.

.github/workflows/
  validate.yml            Runs on every PR touching systems/**. Validates
                         schema, structure, and security checks (see
                         docs/security.md). Must pass before merge.
  release.yml             Runs on tag push. Builds cli/, publishes to GitHub
                         Releases, npm, and PyPI.
```

## Conventions

- **Language/stack:** TypeScript on Node.js. CLI framework: `commander`.
  Schema validation: `zod`. Git ops: `simple-git`/`execa`. Prefer native
  `fetch` over adding an HTTP client dependency.
- **`registry/index.json` is a build artifact.** Any PR that hand-edits it
  (instead of editing a `systems/*/system.json` and regenerating) should be
  flagged and corrected.
- **Every System PR must pass `validate.yml`** before merge — schema
  validity, required files present, no unsafe hooks/scripts, README exists.
  Never bypass this for convenience.
- **Security is explicit, not implied.** Never design a flow where the CLI
  silently grants permissions or executes scripts without the user seeing
  what's being requested. See `docs/security.md`.
- **Session/config integration with Claude Code must use documented,
  supported interfaces only** — never undocumented internal files or
  behaviors. If unsure what's currently supported, say so rather than guess.
- **Keep the CLI thin.** New features that could instead be a System,
  a Skill, or a plugin should be built as one of those, not added to `cli/`.

## Common tasks

- Add a new System → copy `template/starter-system/`, edit `system.json`,
  place under `systems/<name>/`, run local validation, open a PR.
- Change CLI behavior → edit `cli/src/`, add/update tests in `cli/tests/`.
- Change what's required in a System → update `schemas/system.schema.json`
  **and** `docs/creating-a-system.md` **and** `template/starter-system/`
  together — these three must never drift apart.
- Cut a release → tag `vX.Y.Z`; `release.yml` handles the rest.

## What NOT to build here (yet)

See `SYSTEM_SPEC.md` §46. No web marketplace, no cloud backend, no custom AI
runtime, no full GUI, no multi-system dependency resolution beyond the
simple case, no enterprise auth. MVP first.

## Knowledge base for future AI
- Entry point: [PROJECT_KNOWLEDGE.md](PROJECT_KNOWLEDGE.md)
- Topic index: [.claude/KNOWLEDGE_INDEX.md](.claude/KNOWLEDGE_INDEX.md)
- Stack / Structure / Contracts / Flows / CLI Map / Data / Operations / Design Notes in `.claude/`
