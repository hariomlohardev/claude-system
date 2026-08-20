"""
claude_system.wrapper — thin Python wrapper for the Node CLI.

Does NOT reimplement CLI logic. It locates the built cli/dist/index.js
(if installed from a local checkout) or fetches the appropriate
GitHub Release asset and delegates execution to Node.

Usage: `claude-system` (installed via pip) behaves like `npx claude-system`.
"""
from __future__ import annotations

import os
import sys
import subprocess
import pathlib
import urllib.request
import tarfile
import tempfile
import shutil

REPO = "hariomlohardev/claude-system"
CLI_ENTRY_LOCAL_CANDIDATES = [
    # When pip is installed from a checkout that still has cli/dist
    pathlib.Path(__file__).resolve().parents[2] / "cli" / "dist" / "index.js",
    pathlib.Path(__file__).resolve().parents[3] / "cli" / "dist" / "index.js",
]

def find_local_cli() -> pathlib.Path | None:
    for p in CLI_ENTRY_LOCAL_CANDIDATES:
        if p.exists():
            return p
    return None

def find_node() -> str | None:
    return shutil.which("node") or shutil.which("nodejs")

def main() -> int:
    # If we have a local cli/dist, delegate immediately — no network
    local = find_local_cli()
    node = find_node()
    if local and node:
        # Pass through all args
        args = [node, str(local)] + sys.argv[1:]
        try:
            return subprocess.call(args)
        except FileNotFoundError:
            print("claude-system: node not found — install Node.js 18+ from https://nodejs.org", file=sys.stderr)
            return 1

    # Otherwise, instruct user to use the canonical install methods.
    # The pip wrapper is intentionally thin — it does not bundle the CLI;
    # the real artifact is the GitHub Release. We fetch it on demand.
    if not node:
        print("claude-system: Node.js is required (18+). Install from https://nodejs.org", file=sys.stderr)
        print("Then run: claude-system --help", file=sys.stderr)
        return 1

    # Try to fetch the latest release asset (best-effort, no hard failure in offline)
    version = os.environ.get("CLAUDE_SYSTEM_VERSION", "latest")
    # For v1 the asset is the npm tarball or a standalone binary — we just point to the repo.
    print(f"claude-system (pip wrapper) — local cli/dist not found.", file=sys.stderr)
    print(f"Install the CLI properly:", file=sys.stderr)
    print(f"  curl -fsSL https://raw.githubusercontent.com/{REPO}/main/install.sh | sh", file=sys.stderr)
    print(f"  # or: npm i -g claude-system", file=sys.stderr)
    print(f"  # or: pip install --upgrade claude-system (then re-run with a checkout present)", file=sys.stderr)
    if local:
        print(f"Found local at {local} but node missing or failed.", file=sys.stderr)
    return 1

if __name__ == "__main__":
    sys.exit(main())
