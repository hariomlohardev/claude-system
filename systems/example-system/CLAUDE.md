# Example System — Reference Fixture

> This `CLAUDE.md` is a **reference placeholder**. `systems/example-system` exists only as a permanently-valid CI fixture and documentation example — it is not intended for real installation via `claude-system install example-system`.

When a user runs `claude-system run example-system`, this file would be injected into the Claude Code session. In a real System you would replace this with role, workflow, and domain instructions. For the fixture, no real behavior is needed.

## What a real CLAUDE.md should contain

- The role the model should assume
- Step-by-step workflows for the System's domain
- Guidance on which `skills/`, `agents/`, and `commands/` to use and when
- Any project-specific conventions or checklists

See [`template/starter-system/CLAUDE.md`](../../template/starter-system/CLAUDE.md) and [`docs/creating-a-system.md`](../../docs/creating-a-system.md) for starter content.
