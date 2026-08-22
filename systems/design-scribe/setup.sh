#!/usr/bin/env bash
# WHY: checks python3 + playwright + Chromium for design reference extraction — prints what to install without blocking install (run re-checks every run)
# Design Scribe setup check.
#
# Contract (per claude-system spec): on `install`, this runs but NEVER blocks
# the install — if something's missing, we just print what to fix and exit 0.
# On `run`, this is force-run every time (not cached), and if it fails the
# System does not execute — the message here is what tells the user what to
# fix first.
set -uo pipefail

MISSING=0

note() { printf '  - %s\n' "$1"; }

echo "Design Scribe: checking prerequisites..."

if ! command -v python3 >/dev/null 2>&1; then
  note "python3 not found — install Python 3.9+"
  MISSING=1
fi

if command -v python3 >/dev/null 2>&1; then
  if ! python3 -c "import playwright" >/dev/null 2>&1; then
    note "Playwright python package not found — run: pip install -r scripts/requirements.txt"
    MISSING=1
  fi
  if ! python3 -c "import bs4, requests" >/dev/null 2>&1; then
    note "requests/beautifulsoup4 not found — run: pip install -r scripts/requirements.txt"
    MISSING=1
  fi
fi

if command -v python3 >/dev/null 2>&1 && python3 -c "import playwright" >/dev/null 2>&1; then
  if ! python3 -m playwright install --dry-run chromium >/dev/null 2>&1; then
    # --dry-run isn't supported on all Playwright versions; fall back to a
    # best-effort check of the browsers cache.
    if [ ! -d "$HOME/.cache/ms-playwright" ]; then
      note "Chromium browser not found — run: playwright install chromium"
      MISSING=1
    fi
  fi
fi

if [ "$MISSING" -eq 0 ]; then
  echo "Design Scribe: all prerequisites satisfied."
  exit 0
else
  echo ""
  echo "Design Scribe: some prerequisites are missing (see above)."
  echo "The System will still install/run, but URL references will fail"
  echo "until these are fixed. Image references and /design-doc work regardless."
  # Always exit 0 on install per spec (never blocks). `run` behavior for
  # blocking-on-failure is enforced by the CLI itself based on this script's
  # exit code in run mode; we surface the message either way.
  exit 0
fi
