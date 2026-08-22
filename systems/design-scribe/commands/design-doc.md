---
description: Synthesize all accumulated references, the current preview, and critique history into the final DESIGN.md at the project root.
argument-hint: [optional output path, defaults to ./DESIGN.md]
---

# /design-doc

You've been given: `$ARGUMENTS` (optional custom output path — default to `DESIGN.md` at the project root if empty).

1. **Check there's something to synthesize.** If `.design-scribe/references.md` doesn't exist or is empty, tell the user to run `/design-example` at least once first — don't generate a DESIGN.md from nothing.

2. **Read everything.** Load the full `.design-scribe/references.md`, the current `.design-scribe/preview.html`, and the full `.design-scribe/critique-log.md`.

3. **Write the file.** Follow `skills/design-md-writing/SKILL.md` for the required section structure, tone, and rules — every claim in the output should trace back to something in these three inputs.

4. **Save it** to the resolved output path (default `DESIGN.md` at the project root — sibling to `.design-scribe/`, not inside it).

5. **Report back:** confirm the path it was written to, the final critic score it's based on, and a one-line summary of the design direction it captured. Mention that re-running `/design-example` later and then `/design-doc` again will overwrite it with the updated direction.
