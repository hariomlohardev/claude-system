---
description: Read-only summary of past contributions and accumulated growth notes — never generates or changes state
allowed-tools: Read
---

Read `.claude/state/contributions-log.md` and `.claude/state/growth-notes.md`
(if they exist) and present:

1. A short table/list of past contributions (repo, issue, PR link, outcome)
2. The current growth notes — recurring strengths and things to watch for

If neither file exists yet, just say no contributions have been logged yet
and suggest running `/find-issues` to get started. Do not write or modify
any files in this command.
