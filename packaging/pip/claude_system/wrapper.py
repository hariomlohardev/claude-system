"""
claude_system.wrapper — thin Python wrapper for the Node CLI.

Bundles cli/dist (copied at build time) and delegates to Node.
If Node dependencies are missing, it runs `npm install` once.
"""
from __future__ import annotations

import os
import sys
import subprocess
import pathlib
import shutil

REPO = "hariomlohardev/claude-system"

def find_local_cli() -> pathlib.Path | None:
    here = pathlib.Path(__file__).resolve().parent
    candidates = [
        here / "dist" / "index.js",  # pip install: claude_system/dist
        here.parent.parent / "cli" / "dist" / "index.js",  # checkout: packaging/pip -> cli/dist
        here.parents[2] / "cli" / "dist" / "index.js",
    ]
    for p in candidates:
        if p.exists():
            return p
    return None

def find_node() -> str | None:
    return shutil.which("node") or shutil.which("nodejs")

def ensure_deps(cli_path: pathlib.Path) -> None:
    """If node_modules missing for the bundled dist, run npm install once."""
    # cli_path is .../claude_system/dist/index.js, package.json is at .../claude_system/package.json
    pkg_dir = cli_path.parent.parent  # claude_system/
    pkg_json = pkg_dir / "package.json"
    node_modules = pkg_dir / "node_modules"
    # Also check for zod specifically
    if pkg_json.exists() and not (node_modules / "zod").exists():
        # Try npm install (best-effort, no hard fail if npm missing)
        npm = shutil.which("npm")
        if npm:
            try:
                print(f"claude-system: installing Node dependencies in {pkg_dir} ...", file=sys.stderr)
                subprocess.run([npm, "install", "--omit=dev", "--ignore-scripts"], cwd=str(pkg_dir), check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
            except Exception:
                pass

def main() -> int:
    cli = find_local_cli()
    node = find_node()

    if cli and node:
        # Ensure deps for pip-bundled dist
        ensure_deps(cli)
        args = [node, str(cli)] + sys.argv[1:]
        try:
            return subprocess.call(args)
        except FileNotFoundError:
            print("claude-system: node not found — install Node.js 18+ from https://nodejs.org", file=sys.stderr)
            return 1

    if not node:
        print("claude-system: Node.js is required (18+). Install from https://nodejs.org", file=sys.stderr)
        print("Then run: claude-system --help", file=sys.stderr)
        return 1

    print(f"claude-system (pip wrapper) — bundled cli not found.", file=sys.stderr)
    print(f"  Searched: {find_local_cli()}", file=sys.stderr)
    print(f"  Install properly:", file=sys.stderr)
    print(f"    curl -fsSL https://raw.githubusercontent.com/{REPO}/main/install.sh | sh", file=sys.stderr)
    print(f"    # or: npm i -g claude-system", file=sys.stderr)
    return 1

if __name__ == "__main__":
    sys.exit(main())
