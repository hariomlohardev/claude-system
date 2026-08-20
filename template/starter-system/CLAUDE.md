# CLAUDE.md — My New System

> **You are editing the template.** This file is where your System's real instructions live.
> Replace this placeholder before submitting. See [`docs/creating-a-system.md`](../../docs/creating-a-system.md) and [`SYSTEM_SPEC.md`](../../SYSTEM_SPEC.md) for guidance.

This `CLAUDE.md` is injected into the Claude Code session when a user runs:

```sh
claude-system run my-new-system
```

Write instructions as if you are briefing the model that will help the user. Good candidates:

- The role and goals the model should take on (e.g. "You are a focused open-source maintainer helper…")
- Conventions, workflows, and quality bars the user expects
- Which skills, agents, and commands in this System to prefer and when
- Any repo-local knowledge (common pitfalls, review checklists, release steps)

Keep it concise and actionable — the model reads this at session start.

## Structure you can use (delete this section and write your own)

```markdown
# My New System

## Role
...

## Workflow
1. ...
2. ...

## Skills & Commands
- `skills/...` — when to use it
```

> **Tip:** Every System must also include a `README.md` (for humans browsing GitHub) and a valid `system.json`. See `template/starter-system/` for the minimal file set.

