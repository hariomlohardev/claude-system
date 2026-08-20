# claude-system — Mindmap

Quick visual orientation. For prose detail, see `SYSTEM_SPEC.md` and
`docs/architecture.md`.

## 1. Layer stack

```mermaid
flowchart TD
    USER[User] --> CS[claude-system CLI]
    CS --> REG[registry/index.json]
    CS --> SYS[systems/*]
    CS --> CFG[Local config ~/.claude-system]
    CS --> CC[Claude Code CLI]
    CC --> MODEL[Claude]

    style CC fill:#f5f5f5,stroke:#999
    style MODEL fill:#f5f5f5,stroke:#999
```

`claude-system` never talks to the model directly. It prepares an
environment, then invokes `claude` (Claude Code), which does the actual AI
work.

## 2. Repo internals: how a System gets from PR to installed

```mermaid
flowchart LR
    A[Contributor forks repo] --> B[Copies template/starter-system]
    B --> C[Edits system.json + CLAUDE.md + skills/agents/commands]
    C --> D[Opens PR into systems/name]
    D --> E{validate.yml}
    E -- fail --> B
    E -- pass --> F[Maintainer review]
    F --> G[Merge]
    G --> H[scripts/generate-index.js regenerates registry/index.json]
    H --> I[User: claude-system install name]
    I --> J[CLI fetches registry/index.json, resolves path, clones/copies systems/name]
    J --> K[Local install under ~/.claude-system/systems/name]
    K --> L[claude-system run name -> invokes Claude Code with that config]
```

## 3. Command surface (MVP)

```mermaid
mindmap
  root((claude-system))
    install <name>
      resolve via registry/index.json
      validate
      write to ~/.claude-system
    list
      read local state
    info <name>
      fetch metadata only
    run <name>
      prepare env
      exec claude
    remove <name>
      diff owned vs user files
      safe delete
    create <name>
      copy template/starter-system
    validate
      check system.json against schema
```

## 4. Data ownership — what must never drift apart

```mermaid
flowchart TD
    SPEC[SYSTEM_SPEC.md] -->|defines| SCHEMA[schemas/system.schema.json]
    SCHEMA -->|validates| SYSJSON[systems/*/system.json]
    SCHEMA -->|shapes| TEMPLATE[template/starter-system]
    SYSJSON -->|aggregated by| GEN[scripts/generate-index.js]
    GEN -->|writes| INDEX[registry/index.json]
    INDEX -->|read-only fetch by| CLI[cli/src]

    style INDEX fill:#fff3cd,stroke:#d4a72c
```

`registry/index.json` (highlighted) is the one file in the repo that is
**generated, not authored**. If you find yourself hand-editing it, stop —
edit the source `system.json` and regenerate instead.

## 5. Distribution channels — one core, three doors

```mermaid
flowchart TD
    CORE[cli/src - TypeScript, built once] --> REL[GitHub Release artifact]
    REL --> CURL[install.sh - curl bash]
    REL --> NPM[packaging/npm - npm publish]
    REL --> PIP[packaging/pip - PyPI publish]
    CURL --> ENDUSER1[End user]
    NPM --> ENDUSER2[End user]
    PIP --> ENDUSER3[End user]
```

No logic is duplicated across the three install paths — each is a thin
fetch-and-place wrapper around the same built artifact.