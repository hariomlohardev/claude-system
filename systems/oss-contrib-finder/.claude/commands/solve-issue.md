---
description: Multi-agent implement + quality-gate + amplify pipeline — studies repo conventions, implements the fix, self-reviews like a strict maintainer, submits (with confirmation), gives evidence-based feedback, then updates the portfolio. Add "quick" to skip the archaeologist/review agents (safety gates stay on regardless).
argument-hint: [quick]
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, Agent
---

If `$ARGUMENTS` contains `quick` or `fast`, run **Quick Mode** below.
Otherwise run the **Full Pipeline**. Tell the user which mode you're
running before you start. Thresholds and limits below come from
`.claude/config.json` — read it once at the start rather than hardcoding
numbers.

## Quick Mode
Skips the dedicated `repo-archaeologist` and `shadow-reviewer` agent calls
to save time/cost — you do their jobs yourself, inline, at a lighter
level of scrutiny. **Every safety rule still applies in full**: PR
confirmation gate, fork-only pushes, no force-push, no proceeding on
failing tests without a stated reason. Quick mode trades thoroughness of
review, never safety.
1. Run Stage 0, 0.5, and 1 exactly as in the Full Pipeline (preflight,
   re-verify, workspace setup) — these are cheap and prevent real damage,
   don't skip them even in quick mode.
2. Yourself, briefly: skim `CONTRIBUTING.md` if present and find the test
   command. Don't do the full archaeologist's depth of investigation.
3. Implement the fix, run tests if a command was findable.
4. Do one quick self-check against the diff (scope creep? tests included?
   commit message clear?) instead of the full adversarial shadow-review.
5. Confirmation gate, submit, report the link, and give feedback — same as
   Stages 6-8 in the Full Pipeline, just built from your own quick check
   instead of `shadow-reviewer`'s output. Say plainly that this was a
   lighter review pass.
6. Run Stage 9 and 10 (log + amplify) the same as the Full Pipeline —
   quick mode only shortens the middle, not the record-keeping.

## Full Pipeline

**Stage 0 — preflight**
Run `gh auth status` and confirm git identity is set. If either fails,
tell the user exactly what to fix and stop.

**Stage 0.5 — load & re-verify**
Read `.claude/state/current-issue.json`. If missing, tell the user to run
`/find-issues` first and stop. Then re-check the issue is **still open and
unclaimed right now** — time has passed since it was picked, and someone
else may have taken it. If it's no longer available, tell the user and
suggest running `/find-issues` again rather than proceeding on stale info.
Update the file's `"status"` to `"in_progress"`.

**Stage 1 — workspace**
Fork the repo if not already forked, clone your fork if not present
locally, add the upstream remote, create branch
`fix-issue-<number>-<short-slug>`. Per `safety.never_push_to_upstream` and
`safety.never_force_push` in config: all pushes go to your own fork, never
upstream, and never with `--force`.

**Stage 2 — archaeology**
Launch `repo-archaeologist` on the cloned repo + issue. Get back the
brief: test command, style command, relevant files, commit/PR conventions,
and — explicitly — whether the repo requires a CLA, DCO sign-off, or
signed commits. If it does, surface that to the user **now**, before any
code is written, not as a surprise at PR time.

**Stage 3 — implement**
Make the fix yourself, following the archaeologist's brief exactly. Keep
it scoped strictly to the issue.

**Stage 4 — test**
Run the test command from the brief. Add/update tests if the repo's
convention expects it. Don't proceed with failing tests unless there's a
clear, stated reason.

**Stage 5 — shadow review (quality gate)**
Launch `shadow-reviewer` with the current diff, the issue, and the brief.
- `ready to submit` → continue to Stage 6.
- `needs revision` → apply the specific fixes, re-run once more.
- Cap at `review.max_shadow_review_rounds` (default 2) total rounds. If
  concerns remain after that, proceed but carry the unresolved concern
  forward honestly into Stage 8 — don't hide it.

**Stage 6 — confirm, then submit**
If `safety.require_confirmation_before_pr` is true (default): show the
user the diff summary and the drafted PR title/body, and get explicit
go-ahead before doing anything. Opening a PR under someone's name is the
one step here that isn't quietly reversible — don't skip this gate even if
everything upstream looked clean.
Once confirmed: commit (message per the brief's convention), push to your
fork only, then `gh pr create` with a body referencing the issue,
explaining the fix, and noting how it was tested.

**Stage 7 — report the link**
Give the user the PR link plainly, first.

**Stage 8 — feedback**
From the shadow-reviewer's actual findings: **what went well** (specific)
and **what to double-check** (specific, including anything still
unresolved after the review cap). Note that maintainers may still request
changes and responding promptly/politely is part of contributing.

**Stage 9 — log**
Append a row to `.claude/state/contributions-log.md`, set current-issue's
`"status"` to `"done"`. Compare this contribution's feedback against
`.claude/state/growth-notes.md` — only add a new growth-note once the same
pattern has shown up in >=2 contributions.

**Stage 10 — amplify**
Launch `portfolio-curator` with the completed contribution's details and
the shadow-reviewer's "what went well" findings. It updates `PORTFOLIO.md`
and `.claude/state/momentum.json`, and drafts (never posts) a shareable
write-up under `.claude/state/drafts/`. Tell the user the draft exists and
that it's theirs to review and post — nothing gets published
automatically, there's no posting capability in this project.

**Stage 11 — commit state**
Commit all state-file updates if this is a git repo.
