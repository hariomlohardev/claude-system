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
# pipefail for bash, ignore for sh/dash
set -o pipefail 2>/dev/null || true

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
  echo "✗ Node not found — install Node >=18 from https://nodejs.org then re-run" >&2
  exit 1
fi

NODE_VER="$(node -v 2>/dev/null | sed 's/^v//')"
NODE_MAJOR="$(echo "$NODE_VER" | cut -d. -f1)"
if [ "$NODE_MAJOR" -lt 18 ] 2>/dev/null; then
  echo "✗ claude-system requires Node >=18 (found v$NODE_VER) — upgrade at https://nodejs.org" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "✗ npm not found — install Node from https://nodejs.org" >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "⚠ git not found — some Systems need git (install from https://git-scm.com)" >&2
fi

# Helper: robust npm global install that handles EACCES on Linux (apt node)
npm_install_fallback() {
  # First try normal global install
  echo "› npm i -g claude-system"
  if npm i -g claude-system 2>&1; then
    echo ""
    echo "✓ claude-system installed via npm"
    echo "  Run: claude-system --help  (or npx claude-system --help)"
    return 0
  fi
  echo ""
  echo "  npm global install failed (likely EACCES: permission denied to /usr/local/lib/node_modules)"
  echo "  This happens when node was installed via apt. Retrying with user-owned prefix ~/.npm-global…"
  NPM_PREFIX="$HOME/.npm-global"
  mkdir -p "$NPM_PREFIX/bin" "$NPM_PREFIX/lib" 2>/dev/null || true
  # Try to set prefix to user dir (use --location=user if supported)
  if npm config set prefix "$NPM_PREFIX" --location=user 2>/dev/null; then
    :
  elif npm config set prefix "$NPM_PREFIX" 2>/dev/null; then
    :
  else
    echo "  Could not set npm prefix, trying with --prefix flag…"
  fi
  # Retry with user prefix
  if npm i -g claude-system 2>&1; then
    echo ""
    echo "✓ claude-system installed via npm (user prefix $NPM_PREFIX)"
    # Check if prefix bin is on PATH
    case ":$PATH:" in
      *":$NPM_PREFIX/bin:"*) ;;
      *)
        echo "  Add npm global bin to PATH:"
        echo "    echo 'export PATH=\"\$HOME/.npm-global/bin:\$HOME/.local/bin:\$PATH\"' >> ~/.bashrc"
        echo "    source ~/.bashrc"
        echo "  Or run directly:"
        echo "    $NPM_PREFIX/bin/claude-system --help"
        echo "    npx claude-system --help"
        ;;
    esac
    return 0
  fi
  echo ""
  echo "✗ npm install still failed."
  echo "  Try one of these (no sudo sh needed):"
  echo "    npx claude-system@latest --help          # zero-install, works immediately"
  echo "    pip install --user claude-system         # Python wrapper (needs pip)"
  echo "    pipx install claude-system               # isolated pip install"
  echo "  Or with sudo (if you have it):"
  echo "    sudo npm i -g claude-system"
  echo "  Or with nvm (recommended for Node devs):"
  echo "    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
  echo "    nvm install 20 && npm i -g claude-system"
  return 1
}

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
      npm_install_fallback
      exit $?
    else
      echo "✗ No release asset and npm not found. Install manually:"
      echo "  npm i -g claude-system"
      echo "  or: pip install claude-system"
      echo "  or: npx claude-system@latest --help"
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
    npm_install_fallback
    exit $?
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
