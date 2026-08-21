---
description: Interview the user to build (or update) their contributor skill/interest profile
allowed-tools: Read, Write, Bash(git:*)
---

You are running the `/understand` onboarding interview.

## Goal
Build `.claude/state/contributor-profile.md` (human-readable) and
`.claude/state/contributor-profile.json` (structured) so `/find-issues` can
match real GitHub issues to this specific person.

## Steps

1. Check whether `.claude/state/contributor-profile.md` already exists.
   - If it exists, tell the user you found an existing profile, show a short
     summary of it, and ask if they want to (a) update it, (b) redo it from
     scratch, or (c) keep it as-is and go straight to `/find-issues`.

2. Interview the user. Ask questions **in small batches (2-3 at a time)**,
   not a giant wall of 20 questions at once. Explicitly tell them at the
   start: *"Answer NA for anything you'd rather skip — that's fine."*
   Cover, at minimum:
   - Languages/frameworks they know, and rough comfort level in each
     (never used / beginner / comfortable / strong)
   - Any prior open-source contribution experience at all
   - What kind of work they enjoy or want to practice: bug fixes, small
     features, documentation, tests, tooling/CI, translations, etc.
   - Domains/topics they're interested in (web, CLI tools, data/ML,
     games, dev tools, mobile, etc.) — this helps pick repos they'll
     actually want to look at
   - Roughly how much time they can put into one issue (an evening? a
     weekend?)
   - Anything they explicitly want to avoid (e.g. "no frontend CSS stuff")
   - How much hand-holding they want from you while solving an issue later
     (walk me through everything / just fix it and explain after / mix)
   - What matters most when picking an issue, ranked: matching their exact
     skills, matching an interesting domain, fitting their time budget, or
     something else — `fit-scorer` in `/find-issues` uses this to weight
     its scoring instead of treating every factor equally

3. Don't interrogate — if an answer implies the answer to a later question,
   skip asking it again.

4. Once you have enough to work with (NA answers are fine and expected),
   write both files:
   - `.claude/state/contributor-profile.md` — a readable summary a human
     could skim
   - `.claude/state/contributor-profile.json` — same info structured, e.g.
     `{"languages": {...}, "interests": [...], "avoid": [...], "time_budget":
     "...", "experience_level": "...", "guidance_style": "...", "notes":
     "..."}`

5. If this repo is a git repo (`git rev-parse --is-inside-work-tree`
   succeeds), commit: `git add -A && git commit -m "Update contributor
   profile"`. If it's not a git repo, skip silently — don't ask the user to
   set one up.

6. Tell the user their profile is saved and they can now run `/find-issues`.
