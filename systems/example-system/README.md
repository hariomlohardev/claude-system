# Example System — Reference Fixture

> **Fixture, not a real System.** `systems/example-system` is a permanently-valid example kept in the repo so CI (`validate.yml`) and `scripts/generate-index.js` always have at least one real System to validate against, and so contributors have a live reference alongside `template/starter-system/`. **Do not install it** with `claude-system install example-system` expecting useful behavior — use it only as a structural example.

## What this proves

- `system.json` is valid against [`schemas/system.schema.json`](../../schemas/system.schema.json) with `name` equal to the folder name (`example-system`)
- The required files `system.json`, `CLAUDE.md`, and `README.md` are present
- A System can be minimal (no `skills/`, `agents/`, `commands/`, `hooks/`) and still pass validation

## For a real System

Copy the template instead:

```sh
cp -r template/starter-system systems/<your-name>
```

Then follow the full guide: [`docs/creating-a-system.md`](../../docs/creating-a-system.md).

## File map

```
systems/example-system/
├── system.json   # valid manifest, name == folder name
├── CLAUDE.md     # placeholder prompt (replace in real Systems)
└── README.md     # this file
```
