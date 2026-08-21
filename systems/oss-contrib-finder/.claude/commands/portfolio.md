---
description: Read-only view of PORTFOLIO.md, momentum stats, and any unpublished draft write-ups — never generates a new contribution or posts anything
allowed-tools: Read
---

Read `PORTFOLIO.md`, `.claude/state/momentum.json`, and list any files in
`.claude/state/drafts/`. Present:

1. The portfolio entries as they stand
2. Momentum stats (total contributions, current streak, languages/domains
   touched, repos contributed to)
3. Any draft write-ups that haven't been used yet — show their content so
   the user can copy/edit/post them manually

If `PORTFOLIO.md` has no entries yet, say so and suggest running
`/find-issues` to get started. This command never writes to any file and
never posts anywhere — there is no posting capability in this project by
design.
