# CLI Map

Keywords: install.ps1, findRepoSystemSource, network:write, command.args, registry fallback

All commands are registered in [`cli/src/index.ts:18`](../cli/src/index.ts) via `commander`. Each maps to one file.

## Commands

| Command | File | Key logic | Tests |
|---|---|---|---|
| `list [--installed\|--available] [--category <cat>]` | [`cli/src/commands/list.ts:14`](../cli/src/commands/list.ts) | `registry.fetchIndex()` fresh (Vercel→raw→file); filter `--category` or `--installed` via `storage.ts:95` `listInstalled` | [`cli/tests/`](https://github.com/hariomlohardev/claude-system/tree/main/cli/tests) |
| `search <query>` | [`cli/src/commands/search.ts:12`](../cli/src/commands/search.ts) | `VercelRegistry.search` → `VERCEL_SEARCH_URL?q=` + local fallback via [registry.ts:42](../cli/src/lib/registry.ts) | — |
| `info <system>` | [`cli/src/commands/info.ts:22`](../cli/src/commands/info.ts) | Lookup by `name` in registry; show `permissions[]` + WHY; `isInstalled` from [storage.ts:78](../cli/src/lib/storage.ts) (reads installed copy if present) | — |
| `install <system>` | [`cli/src/commands/install.ts:58`](../cli/src/commands/install.ts) | `findRepoSystemSource` or `downloadSystemFromGitHub` (raw fallback via `repo.ts:42`); `cp` to `getSystemInstallPath` + `recordInstall` + `saveInstalledFiles` (manifest) | — |
| `remove <system>` | [`cli/src/commands/remove.ts:9`](../cli/src/commands/remove.ts) | **Flat delete:** `rm -rf` install dir + delete entry in `systems.json` (documented `--help` + README) | — |
| `update [<system>\|--all]` | [`cli/src/commands/update.ts:44`](../cli/src/commands/update.ts) | Manifest-aware: `collectInstalledFiles` + `hashFile` (sha256) → detect Modified/Untracked → prompt `[o]/[b]ackup to .bak.<timestamp>/[a]bort` (default abort) → clean `rm+cp` to drop untracked → `saveInstalledFiles` | — |
| `run <system> [-- <args>]` | [`cli/src/commands/run.ts:16`](../cli/src/commands/run.ts) | **5 lines:** `command.args.slice(1)` (was 3 derivations) → `maybeRunSetup` once-only → `claudeLauncher` spawn; forwards `-- <args>` (commander strips `--`) | — |
| `create <name>` | [`cli/src/commands/create.ts:22`](../cli/src/commands/create.ts) | `cp -r template/starter-system → systems/<name>/` + patch `system.json` `name` | — |
| `validate [path]` | [`cli/src/commands/validate.ts:18`](../cli/src/commands/validate.ts) | zod `systemJsonSchema.safeParse` + `name===folder` + `checkUnsafeContent` + `permissions vs setup.sh` + `stale-registry jq` | — |
| `report <system>` | [`cli/src/commands/report.ts:12`](../cli/src/commands/report.ts) | `bugs.url` → `repository/issues` → monorepo issues | — |
| `doctor` | [`cli/src/commands/doctor.ts:10`](../cli/src/commands/doctor.ts) | Node version, `claude` on PATH, storage health, registry fetch (two-tier) | — |
| `completion` | [`cli/src/commands/completion.ts:8`](../cli/src/commands/completion.ts) | Shell completion (bash/zsh/fish) | — |
| `--help` / `--version` | [`cli/src/index.ts:12`](../cli/src/index.ts) | `program.version(getVersion())` from `package.json:3` `0.2.0`, themed help via [theme.ts](../cli/src/utils/theme.ts) | — |

## Libs

| Module | Purpose | Key exports |
|---|---|---|
| [`cli/src/lib/registry.ts:13`](../cli/src/lib/registry.ts) | Registry abstraction, forward-compat, two-tier | `RegistrySource`, `GitHubRegistry` (`raw.githubusercontent.com` + `Cache-Control: no-cache`), `VercelRegistry` (primary, `VERCEL_REGISTRY_URL:10` `s-maxage=60`, 5s timeout, `fallback raw`) |
| [`cli/src/lib/storage.ts:196`](../cli/src/lib/storage.ts) | `~/.claude-system` bookkeeping — now with `installedFiles[]` manifest | `getStorageDir`, `readSystemsJson`, `recordInstall`, `saveInstalledFiles`, `collectInstalledFiles`, `hashFile` (sha256), `CLAUDE_SYSTEM_HOME` override |
| [`cli/src/lib/setupRunner.ts:24`](../cli/src/lib/setupRunner.ts) | Once-only `setup.sh` | `extractWhyMessage`, `promptConsent` (`y/N`, non-TTY→false), `maybeRunSetup` |
| [`cli/src/lib/version.ts:8`](../cli/src/lib/version.ts) | Semver compare, no dep | `parseSemver`, `compareSemver`, `isNewer` |
| [`cli/src/lib/repo.ts:14`](../cli/src/lib/repo.ts) | Resolve `systems/<name>` source — **fixed for “run from ~”** | `findRepoSystemSource` (1. `cli/dist` sibling `../../systems/<name>` before 2. `cwd` walk → 3. `CLAUDE_SYSTEM_REPO_ROOT`); `downloadSystemFromGitHub` fallback |
| [`cli/src/lib/claudeLauncher.ts:37`](../cli/src/lib/claudeLauncher.ts) | Spawn `claude` | `launchClaude({ systemPath, passthroughArgs })` `spawn('claude')` |

## Utils

| Module | Purpose |
|---|---|
| [`cli/src/utils/validation.ts:18`](../cli/src/utils/validation.ts) | zod mirror of `schemas/system.schema.json` (`systemJsonSchema`, `registryIndexSchema`, `checkUnsafeContent`); `permissions` enum 6 values; `oss-contrib-finder` now needs `network:write` |
| [`cli/src/utils/theme.ts:8`](../cli/src/utils/theme.ts) | ANSI theme `cyan/dim/bold/green/red`, `NO_COLOR` + `isTTY`, `box`, `success/error/warn` |
| [`cli/src/utils/errors.ts:8`](../cli/src/utils/errors.ts) | Typed errors `handleError` |
| [`cli/src/utils/format.ts:12`](../cli/src/utils/format.ts) | List/info formatting |

All `npm --prefix cli test` must pass (47 tests, see `vitest` in [`cli/package.json`](../cli/package.json)). Operations: see [OPERATIONS.md](OPERATIONS.md) for `install.ps1` Windows alternative (`irm .../install.ps1 | iex`).

See also: Flows → [FLOWS.md](FLOWS.md), Data → [DATA.md](DATA.md), Structure → [STRUCTURE.md](STRUCTURE.md)
