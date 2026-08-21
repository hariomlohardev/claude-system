# System Spec

> Status: draft


## 46. What NOT to build here (yet)

- No web marketplace
- No cloud backend
- No custom AI runtime
- No full GUI
- No multi-system dependency resolution beyond the simple case
- No enterprise auth

> **Footnote — Registry cache API is intentionally not in the "do not build first" group.** The read-through cache (`https://claude-system-tau.vercel.app/api/registry` backed by Supabase, with `raw.githubusercontent.com` as always-fresh fallback via `cli/src/lib/registry.ts`) is a performance layer for `list`/`browse`/`search` scale, not a marketplace or new source of truth. Source of truth remains `registry/index.json` generated from `systems/*/system.json`. If the cache dies, `raw` fallback keeps `install` working — see `.github/workflows/sync-registry.yml` ADR and `cli/src/lib/registry.ts` two-tier fetch. This footnote prevents future re-flagging of §46.
