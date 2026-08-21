# OSS Contrib Finder

> **Beginner-friendly open-source contribution coach.** Finds, scores, and walks you through a real GitHub issue that matches your skills — with verify, review, and portfolio steps.

## Who it's for

Beginners who want a guided, safe path to their first (or next) real open-source PR — not a toy exercise. If you can run `gh` and `git`, this System does the searching, verifying, and reviewing for you.

## What it provides

- **Find** — `/find-issues` runs a 5-stage pipeline: `repo-scout` + `issue-hunter` → `issue-triager` → `fit-scorer` → live `gh` re-check. Presents 3 candidates you can pick.
- **Solve** — `/solve-issue` re-verifies the issue, learns the repo's conventions (`repo-archaeologist`), implements the fix, and gets a strict `shadow-reviewer` pass (capped rounds) before you confirm the PR.
- **Amplify** — `portfolio-curator` updates `PORTFOLIO.md` and drafts a factual write-up. Nothing posts on your behalf.

## Commands

| Command | What it does |
|---|---|
| `/understand` | One-time interview (skills, interests, time) — writes profile |
| `/find-issues [--quick]` | Preflight → 5-stage search → 3 options (quick = one pass, less review) |
| `/solve-issue [--quick]` | Implement → capped review → confirm → fork-only PR |
| `/history` | Past contributions + growth notes (read-only) |
| `/portfolio` | `PORTFOLIO.md` + momentum + drafts (read-only) |

`quick` trades *depth* for speed; safety (PR confirmation, fork-only, no force-push) is identical in both modes.

## Requirements

- GitHub CLI `gh` installed and authenticated — `gh auth status`
- `git` configured with name/email

Preflight checks `gh auth` and git identity before each pipeline. See `CLAUDE.md` for the full agent roster and robustness rules.

## After install

```sh
claude-system run oss-contrib-finder
# then in Claude Code:
/understand
/find-issues
/solve-issue
```

Contributing: see `docs/creating-a-system.md`. This System's config lives in `.claude/config.json` — edit thresholds there, not prompts.
