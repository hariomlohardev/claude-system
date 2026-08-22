# Design Scribe

Turns URLs, screenshots, and images into a single living `DESIGN.md` — a design-language reference that other Claude Code sessions and subagents can read to build UI consistently with your intended look and feel.

## What it does

1. You feed it references one at a time — a URL, an image, or just a text tweak — with `/design-example`.
2. Each reference is extracted into structured notes (colors, type, spacing, tone), and the HTML preview at `.design-scribe/preview.html` is regenerated to reflect everything gathered so far.
3. A `design-critic` subagent automatically scores the new preview against every reference collected so far and tells you what's weak.
4. Repeat with as many references as you want — each one refines the direction.
5. When you're happy, run `/design-doc` to synthesize everything into `DESIGN.md` at your project root.

## Prerequisites

- Python 3.9+
- `pip install -r scripts/requirements.txt`
- `playwright install chromium` (one-time browser download for screenshots)

`setup.sh` checks for all of the above on install/run and tells you exactly what's missing — it won't block installation, but the URL-screenshot path won't work until Chromium is installed.

## Usage

```
claude-system install design-scribe
claude-system run design-scribe
```

Then, inside the Claude Code session:

```
/design-example https://stripe.com
/design-example ./moodboard/logo-mark.png
/design-example make the corners sharper, less playful
/design-doc
```

## Permissions this System declares

| Permission | Why |
| --- | --- |
| `filesystem:read` | Reads image files you point it at, and the accumulated `.design-scribe/` state |
| `filesystem:write` | Writes `.design-scribe/` working files and the final `DESIGN.md` |
| `network:read` | Fetches the URL you give it (HTML/CSS + Playwright screenshot) |
| `shell:exec` | Runs `scripts/fetch_url_design.py` |

No `network:write` — nothing is ever pushed or sent out. No `credentials:read` — no secrets are touched.

## Files

```
design-scribe/
├── system.json
├── CLAUDE.md
├── README.md
├── setup.sh
├── settings.json
├── skills/
│   ├── design-reference-extraction/SKILL.md
│   └── design-md-writing/SKILL.md
├── agents/
│   ├── design-extractor.md
│   └── design-critic.md
├── commands/
│   ├── design-example.md
│   └── design-doc.md
└── scripts/
    ├── fetch_url_design.py
    └── requirements.txt
```

## Notes

- `author` in `system.json` is filled in with a placeholder based on the repo owner — double-check it before opening a PR.
- The critic's scores are a consistent heuristic against a fixed rubric, not an objective ground truth — treat a jump from 60 to 85 as "meaningfully closer," not as a certified quality percentage.
