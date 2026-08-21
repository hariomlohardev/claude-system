---
description: Multi-agent search + evaluation pipeline — finds real GitHub issues via two independent discovery agents, verifies them, scores them against the contributor profile, and presents the best 3. Add "quick" for a fast single-pass version.
argument-hint: [quick]
allowed-tools: Read, Write, Bash(git:*), Bash(gh:*), Agent
---

If `$ARGUMENTS` contains `quick` or `fast`, run **Quick Mode** below instead
of the full pipeline. Otherwise run the **Full Pipeline**. Tell the user
which mode you're running before you start either one.

## Quick Mode
For when a full 5-stage pipeline is overkill (e.g. re-running mid-session,
or the user just wants *an* issue now, not the most-optimal one).
1. Read the profile (or generic fallback, same rule as Stage 0.5 below).
2. Run **one** `gh search issues` call yourself, directly — no subagents —
   combining the profile's top language and one label variant
   (`"good first issue"`), filtered `is:open no:assignee`.
3. Resolve star/fork counts for the top 5-6 hits, keep only ones meeting
   `.claude/config.json` eligibility thresholds, confirm still open.
4. Present the first 3 that pass, with a one-line reason each. Skip the
   separate rationale/runner-up writeup — this mode trades depth for
   speed, and you should say so plainly to the user.
5. Save the pick the same way Stage 7 below does (same file, same
   `"status": "selected"`), so `/solve-issue` works identically regardless
   of which mode found the issue.

## Full Pipeline
This command orchestrates five specialized subagents. Don't do the search
or scoring yourself inline — delegate each stage to the named agent via the
Agent tool, so each stage gets a focused context instead of one long thread
trying to do everything. Thresholds and limits below come from
`.claude/config.json` — read it once at the start rather than hardcoding
numbers.

**Stage 0 — preflight**
Run `gh auth status` and confirm git identity is set
(`git config user.name`/`user.email`). If either fails, tell the user
exactly what to fix (e.g. `gh auth login`) and stop — don't let a broken
prerequisite surface as a confusing failure three stages later.

**Stage 0.5 — profile & in-progress guard**
Read `.claude/state/contributor-profile.json`. If missing, tell the user to
run `/understand` first and stop, unless they explicitly say to proceed
with a generic beginner profile.
Then check `.claude/state/current-issue.json` — if it exists with
`"status": "in_progress"`, warn the user they have an unfinished
contribution and confirm before overwriting it with a new pick.

**Stage 1 — parallel discovery**
Launch `repo-scout` and `issue-hunter` **in parallel** (two Agent-tool calls in
the same turn, not sequential), passing them the eligibility thresholds
from config. They're deliberately independent, redundant searches so
between them you catch things either would miss alone. If a `gh` call
returns a rate-limit error (403 with rate-limit headers), back off for
`search.rate_limit_backoff_seconds` and retry, up to
`search.max_retries_on_rate_limit` times, before giving up on that query.

**Stage 2 — merge**
Merge both agents' output into one candidate pool, deduplicating by repo +
issue number. Don't discard overlaps — overlap is itself a weak signal the
issue is genuinely findable.

**Stage 3 — triage**
Launch `issue-triager` on the merged pool (split into 2 parallel batches if
large). Verifies each issue is real, open, unclaimed, clearly scoped, and
not secretly contentious.

**Stage 4 — score**
Launch `fit-scorer` with the triaged/annotated issues plus the contributor
profile. Ranked list with profile-specific rationale and a diversity-aware
top pick, plus runner-ups.

**Stage 4.5 — empty-pool fallback**
If fewer than 3 verified candidates survive Stages 1-4, don't just report
failure: automatically loosen search criteria one notch (broaden language
match, drop one label filter, allow slightly older issues) and re-run
Stages 1-4 once before telling the user. If still short after that, tell
them plainly what was tried and ask how they'd like to adjust (e.g. widen
interests, lower time-budget requirement).

**Stage 5 — final live check**
Before presenting anything, re-verify the top ~5 candidates with one more
direct `gh` call each (star/fork counts and open status can go stale).
Drop and backfill from runner-ups if anything no longer checks out. Never
present something you haven't personally just re-verified.

**Stage 6 — present**
Present exactly 3 issues, numbered, each with repo link, star/fork count,
language, issue title/number/link, the fit-scorer's profile-specific
rationale, a candid difficulty read including any triager flags, and why
it beat its closest runner-up. Ask the user to pick 1/2/3, or reject all
three (re-run Stage 4 against the fuller ranked list before searching
again).

**Stage 7 — save**
Write `.claude/state/current-issue.md` + `.json` (include `"status":
"selected"`) with full chosen-issue details and the fit-scorer rationale
that won it. Commit if this is a git repo. Tell the user they can run
`/solve-issue`.
