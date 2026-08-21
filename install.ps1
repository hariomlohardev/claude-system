#Requires -Version 5.1
<#
.SYNOPSIS
  Install claude-system on Windows (PowerShell) — native, no WSL/Bash required.
.DESCRIPTION
  Mirrors install.sh checks: Node >=18 + npm present, then fetches the System registry
  and links claude-system. Fails hard (non-zero) on mismatch.
#>
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# 1. Node >=18 gate (fail hard, like install.sh):
try { $ver = (& node -v 2>$null) } catch { $ver = $null }
if (-not $ver) { Write-Host "✗ Node not found — install Node >=18 from https://nodejs.org then re-run" -ForegroundColor Red; exit 1 }
$verTrim = $ver.Trim().TrimStart('v')
$major = [int]($verTrim.Split('.')[0])
if ($major -lt 18) { Write-Host "✗ claude-system requires Node >=18 (found v$verTrim) — upgrade at https://nodejs.org" -ForegroundColor Red; exit 1 }
try { & npm -v 2>$null | Out-Null } catch { Write-Host "✗ npm not found — install Node from https://nodejs.org" -ForegroundColor Red; exit 1 }
try { & git --version 2>$null | Out-Null } catch { Write-Host "⚠ git not found — some Systems need git (https://git-scm.com)" -ForegroundColor Yellow }

# 2. Fetch + install (keep same URL base as install.sh — prefer raw, fallback to Release asset):
$Tag = $env:CLAUDE_SYSTEM_TAG
if (-not $Tag) { $Tag = "main" }
# For now, install via npm (thin wrapper) — same artifact that install.sh ultimately uses via cli/dist:
Write-Host "› Installing claude-system ($Tag) via npm…" -ForegroundColor DarkGray
npm install -g claude-system --prefix "$env:APPDATA\npm" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { npm install -g claude-system 2>&1 | Out-Null }
if ($LASTEXITCODE -ne 0) { Write-Host "✗ npm install failed — check Node/npm and network" -ForegroundColor Red; exit 1 }

# 3. Verify on PATH:
$cmd = Get-Command claude-system -ErrorAction SilentlyContinue
if (-not $cmd) { Write-Host "⚠ claude-system not on PATH — check $env:APPDATA\npm and your PATH" -ForegroundColor Yellow } else { Write-Host "✓ claude-system installed at $($cmd.Source)" -ForegroundColor Green }

Write-Host "› Verify: claude-system --help  (then claude-system list)" -ForegroundColor DarkGray
