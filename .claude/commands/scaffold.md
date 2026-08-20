---
description: Create the full claude-system folder and placeholder-file structure from an empty repository
---

You are setting up the `claude-system` repository from scratch. This repo
does not yet exist as a project — you are creating its skeleton: folders and
placeholder files only, no implementation logic. A separate command,
`/bootstrap`, fills in real content afterward. Do not implement CLI logic,
write schema contents, or generate real config in this step — only create
the structure and, where noted, minimal placeholder content.

If `CLAUDE.md`, `docs/MINDMAP.md`, or `.claude/commands/bootstrap.md`
already exist, leave them untouched — they are already written and finished.

## Create this exact structure

```
claude-system/
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SYSTEM_SPEC.md
├── install.sh
├── CLAUDE.md                          (skip if already present)
│
├── docs/
│   ├── architecture.md
│   ├── systems.md
│   ├── registry.md
│   ├── security.md
│   ├── cli.md
│   ├── creating-a-system.md
│   ├── distribution.md
│   └── MINDMAP.md                     (skip if already present)
│
├── cli/
│   ├── src/
│   └── tests/
│
├── packages/
│
├── schemas/
│   ├── system.schema.json
│   └── registry-index.schema.json
│
├── registry/
│   └── index.json
│
├── scripts/
│   └── generate-index.js
│
├── systems/
│   └── README.md
│
├── template/
│   └── starter-system/
│       ├── system.json
│       ├── CLAUDE.md
│       ├── settings.json
│       ├── README.md
│       ├── skills/
│       ├── agents/
│       ├── commands/
│       └── hooks/
│
├── examples/
│
├── tests/
│
├── packaging/
│   ├── npm/
│   │   ├── package.json
│   │   └── postinstall.js
│   └── pip/
│       ├── pyproject.toml
│       └── setup.py
│
└── .github/
    └── workflows/
        ├── validate.yml
        └── release.yml
```

`.claude/commands/bootstrap.md` should already exist (skip if present).

## Rules while creating this

- **Empty directories** (`cli/src/`, `cli/tests/`, `packages/`, `examples/`,
  `tests/`, and the empty subfolders under `template/starter-system/`) need
  a `.gitkeep` file so git tracks them, since none have real content yet.
- **Files with no content requirement** (most `docs/*.md`, `README.md`,
  `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`) — create them empty or
  with a single `# Title` heading matching the filename. Do not write full
  prose content — that belongs to a later, separate pass.
- **`SYSTEM_SPEC.md`** — create with just a `# System Spec` heading and a
  `> Status: draft` line. The real spec content is written later, not by
  this command.
- **`registry/index.json`** — create with this exact placeholder content
  (this one file needs real starter content because other tooling expects
  valid JSON to exist):
  ```json
  {
    "$schema": "../schemas/registry-index.schema.json",
    "generatedAt": "",
    "systems": []
  }
  ```
- **`systems/README.md`** — create with a short placeholder: a one-line
  description that this folder holds PR-contributed Systems, and a pointer
  to `docs/creating-a-system.md`.
- **`schemas/*.json`, `scripts/generate-index.js`,
  `packaging/npm/*`, `packaging/pip/*`, `.github/workflows/*.yml`,
  `install.sh`, `template/starter-system/*`** — create as empty files (or
  minimal valid-syntax stubs, e.g. `{}` for JSON files that must parse).
  Real content is written by `/bootstrap`, not this command.

## When done

- Run a recursive directory listing and show it to the user so they can
  confirm the structure matches what's above.
- Do not run `git init`, do not install any dependencies, and do not create
  any files not listed here. If something seems missing or you think an
  addition is needed, ask the user instead of adding it yourself.
- Tell the user to run `/bootstrap` next to fill in real implementation.
