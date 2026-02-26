<#
.SYNOPSIS
  Clawdbot Launcher - OpenClaw Gateway Launcher
.DESCRIPTION
  openclaw gateway port 18789
#>

param(
  [switch]$NoDaemon
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$LogDir = Join-Path $Home "clawd"
$LogFile = Join-Path $LogDir "launcher.log"
$LockFile = Join-Path $LogDir "launcher.lock"

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

Write-Log "Starting openclaw gateway on port 18789..."
$env:OPENCLAW_GATEWAY_PORT = "18789"

# --- ASI ngrok Automation ---
$EnvFile = Join-Path $RepoRoot ".env"
$IsOnline = $false
if (Test-Path $EnvFile) {
  $envContent = Get-Content $EnvFile -Raw
  if ($envContent -match "CLAWDBOT_GATEWAY_MODE=online") {
    $IsOnline = $true
  }
}

# --- Dynamic Token Generation ---
$TokenUpdated = $false
if (Test-Path $EnvFile) {
  $currentEnv = Get-Content $EnvFile -Raw
  if ($currentEnv -notmatch "CLAWDBOT_GATEWAY_TOKEN=") {
    $newToken = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    $tokenLine = "CLAWDBOT_GATEWAY_TOKEN=$newToken"
    Add-Content -Path $EnvFile -Value $tokenLine -Encoding UTF8
    $env:CLAWDBOT_GATEWAY_TOKEN = $newToken
    Write-Log "Generated new gateway token: $newToken" "INFO"
    $TokenUpdated = $true
  }
}
if (-not $TokenUpdated -and (Test-Path $EnvFile)) {
  $envVars = Get-Content $EnvFile | ForEach-Object {
    if ($_ -match "^([^=]+)=(.*)$") {
      [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
  }
}
# ----------------------------

if ($IsOnline) {
  Write-Log "Online mode detected. Managing ngrok..."
  $ngrokProcess = Get-Process ngrok -ErrorAction SilentlyContinue
  if (-not $ngrokProcess) {
    Write-Log "Starting ngrok tunnel (Port 18789)..."
    Start-Process "ngrok" -ArgumentList "http 18789 --log=stdout" -NoNewWindow
  }
  else {
    Write-Log "ngrok is already running."
  }
    
  Write-Log "Synchronizing ngrok URL in background..."
  $syncScript = Join-Path $RepoRoot "scripts\sync-ngrok-url.ps1"
  if (Test-Path $syncScript) {
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$syncScript`"" -NoNewWindow
  }
}
# ----------------------------

Set-Location $RepoRoot
& pnpm start 2>&1
