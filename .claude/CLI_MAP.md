# CLI Map

All commands are registered in [`cli/src/index.ts`](../cli/src/index.ts) via `commander`. Each maps to one file.

## Commands

| Command | File | Key logic | Tests |
|---|---|---|---|
| `list [--installed\|--available] [--category <cat>]` | [`cli/src/commands/list.ts`](../cli/src/commands/list.ts) | `registry.fetchIndex()` fresh; filter `--category` or `--installed` via `storage.ts` | [`cli/tests/`](https://github.com/hariomlohardev/claude-system/tree/main/cli/tests) |
| `search <query>` | [`cli/src/commands/search.ts`](../cli/src/commands/search.ts) | `VercelRegistry.search` → `VERCEL_SEARCH_URL?q=` + local fallback | — |
| `info <system>` | [`cli/src/commands/info.ts`](../cli/src/commands/info.ts) | Lookup by `name` in registry; show `permissions[]` + WHY; `isInstalled` | — |
| `install <system>` | [`cli/src/commands/install.ts`](../cli/src/commands/install.ts) | `findRepoSystemSource` or fetch; copy to `getSystemInstallPath` + `writeSystemsJson` | — |
| `remove <system>` | [`cli/src/commands/remove.ts`](../cli/src/commands/remove.ts) | `rm` install dir + delete entry in `systems.json` | — |
| `update [<system>\|--all]` | [`cli/src/commands/update.ts`](../cli/src/commands/update.ts) | `compareSemver` / `isNewer`; preserve `setupDone` | — |
| `run <system> [-- <args>]` | [`cli/src/commands/run.ts`](../cli/src/commands/run.ts) | `maybeRunSetup` once-only → `claudeLauncher` spawn; forwards `-- <args>` | — |
| `create <name>` | [`cli/src/commands/create.ts`](../cli/src/commands/create.ts) | `cp -r template/starter-system → systems/<name>/` + patch `system.json` `name` | — |
| `validate [path]` | [`cli/src/commands/validate.ts`](../cli/src/commands/validate.ts) | zod `systemJsonSchema.safeParse` + `name===folder` + `checkUnsafeContent` | — |
| `report <system>` | [`cli/src/commands/report.ts`](../cli/src/commands/report.ts) | `bugs.url` → `repository/issues` → monorepo issues | — |
| `doctor` | [`cli/src/commands/doctor.ts`](../cli/src/commands/doctor.ts) | Node version, `claude` on PATH, storage health | — |
| `completion` | [`cli/src/commands/completion.ts`](../cli/src/commands/completion.ts) | Shell completion | — |
| `--help` / `--version` | [`cli/src/index.ts`](../cli/src/index.ts) | `program.version(getVersion())` from `package.json`, themed help | — |

## Libs

| Module | Purpose | Key exports |
|---|---|---|
| [`cli/src/lib/registry.ts`](../cli/src/lib/registry.ts) | Registry abstraction, forward-compat | `RegistrySource`, `GitHubRegistry`, `VercelRegistry` (primary, `Vercel → raw → file://` fallback, `Cache-Control: no-cache`) |
| [`cli/src/lib/storage.ts`](../cli/src/lib/storage.ts) | `~/.claude-system` bookkeeping | `getStorageDir`, `getSystemsJsonPath`, `readSystemsJson`, `writeSystemsJson`, `isInstalled`, `CLAUDE_SYSTEM_HOME` override |
| [`cli/src/lib/setupRunner.ts`](../cli/src/lib/setupRunner.ts) | Once-only `setup.sh` | `extractWhyMessage`, `promptConsent` (`y/N`, non-TTY→false), `maybeRunSetup` |
| [`cli/src/lib/version.ts`](../cli/src/lib/version.ts) | Semver compare, no dep | `parseSemver`, `compareSemver`, `isNewer` |
| [`cli/src/lib/repo.ts`](../cli/src/lib/repo.ts) | Resolve `systems/<name>` source | `findRepoSystemSource` (dist sibling → cwd walk → `CLAUDE_SYSTEM_REPO_ROOT`) |
| [`cli/src/lib/claudeLauncher.ts`](../cli/src/lib/claudeLauncher.ts) | Spawn `claude` | `launchClaude(cwd, args)` |

## Utils

| Module | Purpose |
|---|---|
| [`cli/src/utils/validation.ts`](../cli/src/utils/validation.ts) | zod mirror of `schemas/system.schema.json` (`systemJsonSchema`, `registryIndexSchema`, `checkUnsafeContent`) |
| [`cli/src/utils/theme.ts`](../cli/src/utils/theme.ts) | ANSI theme `cyan/dim/bold/green/red`, `NO_COLOR` + `isTTY`, `box`, `success/error/warn` |
| [`cli/src/utils/errors.ts`](../cli/src/utils/errors.ts) | Typed errors |
| [`cli/src/utils/format.ts`](../cli/src/utils/format.ts) | List/info formatting |

All `npm --prefix cli test` must pass (see `vitest` in [`cli/package.json`](../cli/package.json)).
