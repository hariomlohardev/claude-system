# Systems

This folder holds **PR-contributed Systems** — versioned bundles of `CLAUDE.md`, skills, agents, commands, hooks, and config that together form a Claude Code environment.

- Each System lives in `systems/<name>/` where `<name>` is its kebab-case identifier.
- Each must contain at minimum `system.json`, `CLAUDE.md`, and `README.md` and must validate against [`schemas/system.schema.json`](../schemas/system.schema.json).
- **Folder-name rule:** the directory name under `systems/` **must exactly equal** the `"name"` field inside that System's `system.json`. CI (`validate.yml`) enforces this; a mismatch fails the PR.
- `registry/index.json` is generated from these folders — never edited by hand.

To contribute a new System, copy the template and follow the guide:

→ **[docs/creating-a-system.md](../docs/creating-a-system.md)**

