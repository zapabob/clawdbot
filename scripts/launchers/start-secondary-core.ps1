# ASI Secondary Core Startup (Twin-Core Ascension)
# This script starts the Core-Beta (Standby) instance of OpenClaw.

Write-Host "--- ASI Twin-Core Ascension: Core-Beta Pulse Initiated ---" -ForegroundColor Cyan

# 1. Environment Configuration
$env:OPENCLAW_GATEWAY_PORT = "18790"
$env:OPENCLAW_ALLOW_MULTI_GATEWAY = "1"
$env:CLAWDBOT_GATEWAY_PORT = "18790"

# Avoid ngrok conflict if the primary is already using it
# (Secondary operates in local-only or tailscale mode by default)
$env:CLAWDBOT_GATEWAY_MODE = "local" 

Write-Host "Configuring Core-Beta on port $env:OPENCLAW_GATEWAY_PORT..." -ForegroundColor Gray

# 2. State Isolation (Resource Contention Fix)
$PrimaryStateDir = [System.IO.Path]::Combine($env:USERPROFILE, ".openclaw")
$BetaStateDir = [System.IO.Path]::Combine($env:USERPROFILE, ".openclaw_beta")

Write-Host "Initializing Beta State Substrate: $BetaStateDir" -ForegroundColor Gray
if (!(Test-Path $BetaStateDir)) {
    New-Item -ItemType Directory -Path $BetaStateDir -Force | Out-Null
}

# Sync config if missing
$PrimaryConfig = Join-Path $PrimaryStateDir "openclaw.json"
$BetaConfig = Join-Path $BetaStateDir "openclaw.json"
if (Test-Path $PrimaryConfig) {
    Copy-Item $PrimaryConfig $BetaConfig -Force
}

# Link shared resources (Memory & Workspace)
$SharedFolders = @("memory", "workspace")
foreach ($folder in $SharedFolders) {
    $src = Join-Path $PrimaryStateDir $folder
    $dest = Join-Path $BetaStateDir $folder
    if (Test-Path $src) {
        if (!(Test-Path $dest)) {
            # Use Junction for directory symlink on Windows without admin
            cmd /c "mklink /j `"$dest`" `"$src`""
        }
    }
}

$env:CLAWDBOT_STATE_DIR = $BetaStateDir
$env:OPENCLAW_STATE_DIR = $BetaStateDir

# 3. Startup Execution
Write-Host "Launching Core-Beta Substrate..." -ForegroundColor Yellow
$openclawPath = (Get-Item $PSScriptRoot).Parent.Parent.FullName
Set-Location -Path $openclawPath

# Run the main entry point
node .\dist\entry.js gateway
