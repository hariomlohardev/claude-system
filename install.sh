#!/bin/sh
# install.sh — curl | sh entrypoint for claude-system
# Fetches the appropriate GitHub Release asset for the user's platform
# and installs the `claude-system` binary. Thin, auditable, no reimplementation.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/hariomlohardev/claude-system/main/install.sh | sh
#   curl -fsSL https://raw.githubusercontent.com/hariomlohardev/claude-system/main/install.sh | sh -s -- --help
#
# Env:
#   CLAUDE_SYSTEM_VERSION  — specific version to install (e.g. v0.1.0), default: latest
#   CLAUDE_SYSTEM_INSTALL_DIR — install directory, default: $HOME/.local/bin or /usr/local/bin

set -eu

REPO="hariomlohardev/claude-system"
BIN_NAME="claude-system"
VERSION="${CLAUDE_SYSTEM_VERSION:-latest}"
INSTALL_DIR="${CLAUDE_SYSTEM_INSTALL_DIR:-}"

# Determine install directory
if [ -z "$INSTALL_DIR" ]; then
  if [ -w "/usr/local/bin" ]; then
    INSTALL_DIR="/usr/local/bin"
  else
    INSTALL_DIR="$HOME/.local/bin"
  fi
fi

# Determine platform
OS="$(uname -s 2>/dev/null || echo unknown)"
ARCH="$(uname -m 2>/dev/null || echo unknown)"

case "$OS" in
  Linux*)  OS="linux" ;;
  Darwin*) OS="darwin" ;;
  CYGWIN*|MINGW*|MSYS*) OS="windows" ;;
  *) OS="linux" ;;
esac

case "$ARCH" in
  x86_64|amd64) ARCH="x64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *) ARCH="x64" ;;
esac

echo "› claude-system installer"
echo "  repo:    $REPO"
echo "  version: $VERSION"
echo "  os/arch: $OS/$ARCH"
echo "  dest:    $INSTALL_DIR/$BIN_NAME"
echo ""

# Ensure install dir exists
mkdir -p "$INSTALL_DIR"

# Check for Node (required for the Node-based CLI)
if ! command -v node >/dev/null 2>&1; then
  echo "✗ Node.js is required (18+). Install from https://nodejs.org and re-run."
  exit 1
fi

NODE_VER="$(node -v 2>/dev/null | sed 's/^v//')"
NODE_MAJOR="$(echo "$NODE_VER" | cut -d. -f1)"
if [ "$NODE_MAJOR" -lt 18 ] 2>/dev/null; then
  echo "✗ Node.js 18+ is required (found v$NODE_VER). Please upgrade."
  exit 1
fi

# Resolve version → download URL
if [ "$VERSION" = "latest" ]; then
  # Use GitHub API to find latest release, fallback to main branch tarball for dev
  echo "› Resolving latest release…"
  # Try GitHub API (no auth, may be rate-limited)
  LATEST_URL="https://api.github.com/repos/$REPO/releases/latest"
  if command -v curl >/dev/null 2>&1; then
    DOWNLOAD_URL="$(curl -fsSL "$LATEST_URL" 2>/dev/null | grep -o '"browser_download_url": *"[^"]*claude-system[^"]*\.t*gz"' | head -n1 | cut -d'"' -f4 || true)"
  elif command -v wget >/dev/null 2>&1; then
    DOWNLOAD_URL="$(wget -qO- "$LATEST_URL" 2>/dev/null | grep -o '"browser_download_url": *"[^"]*claude-system[^"]*\.t*gz"' | head -n1 | cut -d'"' -f4 || true)"
  else
    DOWNLOAD_URL=""
  fi

  if [ -z "$DOWNLOAD_URL" ]; then
    echo "  No release asset found — installing via npm fallback…"
    if command -v npm >/dev/null 2>&1; then
      echo "› npm i -g claude-system"
      npm i -g claude-system
      echo ""
      echo "✓ claude-system installed via npm"
      echo "  Run: claude-system --help"
      exit 0
    else
      echo "✗ No release asset and npm not found. Install manually:"
      echo "  npm i -g claude-system"
      echo "  or: pip install claude-system"
      exit 1
    fi
  fi
else
  # Specific version
  DOWNLOAD_URL="https://github.com/$REPO/releases/download/$VERSION/claude-system-$OS-$ARCH.tar.gz"
fi

echo "› Downloading $DOWNLOAD_URL…"

TMPDIR="$(mktemp -d 2>/dev/null || mktemp -d -t claude-system)"
trap 'rm -rf "$TMPDIR"' EXIT INT TERM

if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$DOWNLOAD_URL" -o "$TMPDIR/claude-system.tar.gz"
elif command -v wget >/dev/null 2>&1; then
  wget -qO "$TMPDIR/claude-system.tar.gz" "$DOWNLOAD_URL"
else
  echo "✗ Need curl or wget to download."
  exit 1
fi

echo "› Extracting…"
tar -xzf "$TMPDIR/claude-system.tar.gz" -C "$TMPDIR"

# Find the binary (either bin/claude-system or claude-system)
BIN_SRC=""
if [ -f "$TMPDIR/bin/claude-system" ]; then
  BIN_SRC="$TMPDIR/bin/claude-system"
elif [ -f "$TMPDIR/claude-system" ]; then
  BIN_SRC="$TMPDIR/claude-system"
elif [ -f "$TMPDIR/cli/dist/index.js" ]; then
  BIN_SRC="$TMPDIR/cli/dist/index.js"
else
  BIN_SRC="$(find "$TMPDIR" -name "claude-system" -type f 2>/dev/null | head -n1 || true)"
  if [ -z "$BIN_SRC" ]; then
    BIN_SRC="$(find "$TMPDIR" -name "index.js" -path "*/cli/dist/*" 2>/dev/null | head -n1 || true)"
  fi
fi

if [ -z "$BIN_SRC" ] || [ ! -f "$BIN_SRC" ]; then
  echo "✗ Could not find claude-system binary in archive."
  echo "  Tried: $TMPDIR/bin/claude-system, $TMPDIR/claude-system, $TMPDIR/cli/dist/index.js"
  echo "  Fallback: npm i -g claude-system"
  if command -v npm >/dev/null 2>&1; then
    npm i -g claude-system
    echo "✓ Installed via npm fallback"
    exit 0
  fi
  exit 1
fi

# Install
cp "$BIN_SRC" "$INSTALL_DIR/$BIN_NAME"
chmod +x "$INSTALL_DIR/$BIN_NAME" 2>/dev/null || true

echo ""
echo "✓ Installed $BIN_NAME to $INSTALL_DIR/$BIN_NAME"
echo "  Version: $($INSTALL_DIR/$BIN_NAME --version 2>/dev/null || echo "$VERSION")"
echo ""
case ":$PATH:" in
  *":$INSTALL_DIR:"*) ;;
  *)
    echo "⚠ $INSTALL_DIR is not on your PATH."
    echo "  Add it:"
    echo "    export PATH=\"\$PATH:$INSTALL_DIR\""
    echo "  (add to ~/.bashrc, ~/.zshrc, or equivalent)"
    echo ""
    ;;
esac
echo "  Run: $BIN_NAME --help"
echo "  Docs: https://github.com/$REPO#readme"
