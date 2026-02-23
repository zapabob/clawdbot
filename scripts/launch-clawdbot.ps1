<#
.SYNOPSIS
  Clawdbot Launcher - OpenClaw Gateway Launcher
.DESCRIPTION
  openclaw gateway port 6000
#>

param(
  [switch]$NoDaemon
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot   = (Resolve-Path "$PSScriptRoot\..").Path
$LogDir     = Join-Path $Home "clawd"
$LogFile    = Join-Path $LogDir "launcher.log"
$LockFile   = Join-Path $LogDir "launcher.lock"

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

if (Test-Path $LockFile) {
    $lockedPidContent = Get-Content $LockFile -ErrorAction SilentlyContinue
    if ($lockedPidContent) {
        $lockedPid = [int]$lockedPidContent
        if ($lockedPid -and (Get-Process -Id $lockedPid -ErrorAction SilentlyContinue)) {
            Write-Host "[Clawdbot] Already running (PID $lockedPid). Exit." -ForegroundColor Yellow
            exit 0
        }
    }
    Remove-Item $LockFile -Force
}
$PID | Out-File $LockFile -Encoding ascii -Force

function Write-Log {
  param([string]$Msg, [string]$Level = 'INFO')
  $ts = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
  $line = "[$ts] [$Level] $Msg"
  Add-Content -Path $LogFile -Value $line -Encoding UTF8
  Write-Host $line
}

Write-Log "=== Clawdbot Launcher START (PID $PID) ==="

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Log "node.exe not found. Install Node.js." 'ERROR'
  Remove-Item $LockFile -Force
  exit 1
}
Write-Log "Node: $($node.Source) $(node --version)"

Write-Log "Starting openclaw gateway on port 6000..."
$env:OPENCLAW_GATEWAY_PORT = "6000"

Set-Location $RepoRoot
& pnpm start 2>&1
