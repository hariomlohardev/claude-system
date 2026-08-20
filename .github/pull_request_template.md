<!-- This repo is a curated registry — PRs should touch only systems/<name>/ -->
<!-- Do not edit cli/, schemas/, workflows/, or registry/index.json directly in a System PR. -->

## Checklist

- [ ] My PR touches only `systems/<name>/` (no `cli/` / `schemas/` / `workflows/` / `registry/index.json`)
- [ ] `system.json`: `name` === folder name (kebab-case, `^[a-z0-9]+(?:-[a-z0-9]+)*$`)
- [ ] Required files present: `system.json`, `CLAUDE.md`, `README.md`
- [ ] `permissions[]` honestly declared (`shell:exec` if `setup.sh` exists, `network:read` if fetching)
- [ ] `setup.sh` `WHY` message present if `setup.sh` exists (`# WHY:` or `echo` explaining why setup is needed)
- [ ] I ran locally and all pass: `npm --prefix cli run build && npm --prefix cli test && node cli/dist/index.js validate systems/<name> && node scripts/generate-index.js` (and restored `registry/index.json` with `git restore registry/index.json`)
- [ ] I did **not** hand-edit `registry/index.json` (it is generated)

## What does this System do?

<!-- One paragraph: who is it for, what workflow does it provide, what does CLAUDE.md instruct? -->

## How to test

<!-- Commands you ran, e.g. claude-system install <name> / claude-system run <name> / validate output -->

```sh
node cli/dist/index.js validate systems/<name>
```

## Notes for reviewer

<!-- Anything the reviewer should pay extra attention to: permissions, setup.sh behavior, dependencies, etc. -->
