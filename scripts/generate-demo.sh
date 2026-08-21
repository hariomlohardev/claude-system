#!/usr/bin/env bash
set -e
# generate-demo.sh — build demo.svg + demo.gif from real CLI outputs
# Usage: bash scripts/generate-demo.sh
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "› Building CLI…"
npm --prefix cli run build > /tmp/build.log 2>&1 | tail -n 5 || true
echo "› Generating demo assets (real outputs)…"
python3 scripts/build-demo-svg.py
echo "› Assets:"
ls -lh docs/assets/demo.* 2>&1 | cat
echo "✓ done — docs/assets/demo.svg + demo.gif ready"
