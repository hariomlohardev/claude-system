# Security Policy

## Supported Versions

For v1, only the `main` branch is supported. Security fixes are applied to `main`
and released as new tags (`v*.*.*`). If you are on an older tag, upgrade to the
latest release.

| Version | Supported          |
| ------- | ------------------ |
| `main`  | ✓ Supported        |
| `< 0.1` | ✗ Not supported    |

## Reporting a Vulnerability

**Do not open a public issue for a sensitive vulnerability.**

The preferred channel is a private security advisory:

- **GitHub Security Advisories → New draft:** https://github.com/hariomlohardev/claude-system/security/advisories/new

If you cannot use advisories, open an issue at
https://github.com/hariomlohardev/claude-system/issues and note that the report
is security-sensitive — a maintainer will triage and move it to a private
channel. Do not include exploit details in the public issue body.

We will acknowledge receipt within 2 business days, triage within 5, and keep
you informed of the fix timeline. Please allow up to 90 days for a coordinated
disclosure before public disclosure, unless otherwise agreed.

## Trust model (what this project does and does not guarantee)

This is a curated registry of third-party **Systems** (bundles of `CLAUDE.md`,
skills, agents, commands, hooks, and config that run via Claude Code). Treat
installing a System with the same scrutiny as any third-party package.

- **`permissions` are self-declared by authors and reviewed by maintainers, not independently verified at runtime.** A System that declares `["filesystem:read"]` but ships a hook that does `curl | sh` will be rejected in review, but there is no runtime sandbox that enforces the declared set.
- **`setup.sh` (if a System ships one) is reviewed before merge and gated by a one-time consent prompt on first `claude-system run`.** The prompt surfaces the author's `WHY` message (a `# WHY:` comment or `echo` in `setup.sh`) and asks `Are you sure you want to continue? (y/N)`. `setup.sh` is **never silently executed** — no consent, no execution. If `setup.sh` exits non-zero, its output is shown as-is, the System is not run, and `setupDone` is not set (so next `run` re-prompts). Once `setupDone` is `true`, `setup.sh` is never run again.
- **`registry/index.json` is generated, never hand-edited.** It is rebuilt by `scripts/generate-index.js` from `systems/*/system.json` and validated against `schemas/registry-index.schema.json`. PRs that hand-edit it are rejected.
- **Users are expected to read `permissions` before installing** (`claude-system info <system>` shows the declared set) and to review `setup.sh`/`hooks`/`skills` in the System's folder — same scrutiny as `npm`/`pip`/`brew`.

See [`docs/security.md`](docs/security.md) for the full contributor and user guide.

## What this project does NOT do

- No silent permission grants. Every `setup.sh` execution requires explicit user consent.
- No unverified code execution without consent. `setup.sh` only runs on first `run` with consent, never on `install`.
- No hand-edited registry. The registry is a build artifact.
- No runtime sandbox for `permissions` — the declared set is a reviewed claim, not a security boundary.

## Disclosure

Once a fix is released, we will publish a GitHub Security Advisory and release
notes. If you reported the issue, we will credit you unless you prefer to
remain anonymous.
