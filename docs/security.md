# Security

`claude-system` installs third-party **Systems** — bundles of `CLAUDE.md`, skills, agents, commands, hooks, and settings that are executed via Claude Code. Treat installing a System with the same scrutiny as installing any third-party package (npm, pip, Homebrew, etc.). This page explains the `permissions` contract and what it does and does not guarantee.

---

## 1. Permissions are self-declared

Every System's `system.json` contains a `permissions` array:

```json
{
  "permissions": ["filesystem:read", "network:read", "shell:exec"]
}
```

Allowed values (from [`schemas/system.schema.json`](../schemas/system.schema.json)):

| Permission | What it signals |
|---|---|
| `filesystem:read` | May read files outside the installed System folder |
| `filesystem:write` | May write or mutate files |
| `network:read` | May make outbound network requests (fetch, clone) |
| `network:write` | May push data or make mutating network calls |
| `shell:exec` | May execute shell commands or scripts (hooks, skills) |
| `credentials:read` | May access credentials, tokens, or secrets |

- **`permissions` is declared by the System author** — you write the honest superset of what the System may do.
- **An empty array `[]` is valid** and means "no special capabilities declared beyond providing prompt/skills." Prefer it when you don't need more.
- `additionalProperties: false` is enforced at every object level, so unknown permission strings are rejected by schema validation.

See [`docs/creating-a-system.md#3-permissions-—-declare-honestly`](creating-a-system.md#3-permissions--declare-honestly) for how to choose them.

---

## 2. Reviewed but not independently verified

- **PR review:** Every System PR must pass [`validate.yml`](../.github/workflows/validate.yml) and maintainer review before merge. Reviewers compare the declared `permissions` against the actual content in `skills/`, `agents/`, `commands/`, `hooks/`, and `CLAUDE.md` (e.g. a System declaring `[]` but shipping a hook that runs `curl | bash` will be rejected). Security checks for unsafe patterns run in CI (see `docs/security.md` checks in `validate.yml`).
- **Not a runtime sandbox guarantee:** The review is human and static. **There is no independent runtime verification or sandbox that enforces `permissions` at execution time.** A malicious or compromised System that is merged could do more than it declared. This is the same trust model as most package registries.

**Do not treat `permissions: []` as a proof of safety** — treat it as a **self-declared and reviewed claim**, not a security boundary.

---

## 3. How to read `permissions` before installing

Before running `claude-system install <name>` or `claude-system run <name>`:

1. **Inspect the manifest directly — don't trust the display name alone:**

   ```sh
   claude-system info <name>          # shows description, author, permissions, keywords, path
   # or browse the source:
   cat systems/<name>/system.json | jq .permissions
   cat systems/<name>/CLAUDE.md
   ls -R systems/<name>/skills systems/<name>/hooks  # if present
   ```

2. **Check the author and links:** `author.github`, `repository`, `bugs.url`, `homepage` in `system.json`. A System with no `repository` lives only in this monorepo — that's normal, but factor it into your trust decision.

3. **Read the diff on update:** `claude-system update` will show if a new version adds permissions (e.g. newly requesting `shell:exec` or `credentials:read`). An unexpected permission escalation is a reason to pause and review.

4. **Assume least trust on first install.** If you don't need a System that requests `credentials:read` or `shell:exec`, prefer one that declares `[]` or only `filesystem:read`.

> **Mental model:** `permissions` is like the "permissions" list on a browser extension or mobile app — it's a **disclosure you decide to accept**, not a capability the platform enforces for you.

---

## 4. For authors — how to keep users' trust

- **Declare the honest superset.** If any skill, hook, or command *could* read the network, shell out, or touch credentials, include that permission even if it's conditional.
- **Don't hide `shell:exec`.** If `hooks/` or `skills/` contain any executable code, declare `shell:exec`.
- **Minimize.** Start from `[]` and justify each addition in your PR description. Reviewers will ask you to remove permissions you don't actually need.
- **Never silently grant or escalate.** The CLI will show the user what's being requested — never design a flow that bypasses that (see `CLAUDE.md` → *Security is explicit, not implied* and `SYSTEM_SPEC.md`). Users must see what's being requested before they accept.

---

## 5. Reporting concerns

If you find a System that appears to under-declare permissions, contains obfuscated or unsafe hooks, or exfiltrates data:

- Open an issue in this repository (or the System's `bugs.url` if it declares one) and label it with the System name.
- If the issue is sensitive, follow the disclosure process in this repo's `SECURITY.md` / `CODE_OF_CONDUCT.md` instead of a public issue.

Security is a shared responsibility: authors declare honestly, maintainers review carefully, and users install with eyes open.
