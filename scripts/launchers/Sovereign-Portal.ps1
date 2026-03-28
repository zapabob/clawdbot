param(
    [int]$GatewayPort = 18789,
    [string]$Mode = "Menu", # Menu, Full, Ghost, Harness, Diag
    [switch]$SkipHypuraHarness = $false,
    [switch]$ForceShortcutUpdate = $false
)

$ErrorActionPreference = "Stop"
chcp 65001 | Out-Null
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[console]::Title = "Sovereign-Portal: Manifestation Hub"

# --- [Paths] ---
$ScriptPath = $MyInvocation.MyCommand.Path
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$PythonExe = Join-Path $ProjectDir ".venv\Scripts\python.exe"
$IconPath = Join-Path $ProjectDir "assets\clawdbot.ico"
$envFile = Join-Path $ProjectDir ".env"

# --- [Header] ---
function Show-Header {
    Clear-Host
    Write-Host "      _    _   _ _  _ _   _   _ " -ForegroundColor Cyan
    Write-Host "     | |  | | / \ | |/ / | | | / \ " -ForegroundColor Cyan
    Write-Host "     | |__| |/ _ \| ' /  | | |/ _ \ " -ForegroundColor Cyan
    Write-Host "     |  __  / ___ \ . \  | |_/ ___ \ " -ForegroundColor Cyan
    Write-Host "     |_|  |_/_/   \_\_|\_\\___/_/   \_\ " -ForegroundColor Cyan
    Write-Host "                       [ SOVEREIGN MANIFESTATION HUB ]" -ForegroundColor Cyan
    Write-Host "                       [ Parallel Accelerator: ACTIVE ]`n" -ForegroundColor DarkCyan
}

# --- [Sovereign Menu] ---
if ($Mode -eq "Menu") {
    Show-Header
    Write-Host "  [1] Standard Manifestation" -ForegroundColor White
    Write-Host "      (Gateway + Harness + Browser UI + TUI)" -ForegroundColor Gray
    Write-Host "  [2] Ghost Oversight" -ForegroundColor Yellow
    Write-Host "      (Gateway + Harness + Stealth Pulse, No UI)" -ForegroundColor Gray
    Write-Host "  [3] Harness Actuator Only" -ForegroundColor Magenta
    Write-Host "      (Voicevox/Python Actuator, Port 18794)" -ForegroundColor Gray
    Write-Host "  [4] Sovereign Diagnostics" -ForegroundColor Green
    Write-Host "      (Preflight Substrate Check)" -ForegroundColor Gray
    Write-Host "  [Q] Exit Portal`n" -ForegroundColor Red
    
    $choice = Read-Host "  Select Manifestation Mode"
    switch ($choice) {
        "1" { $Mode = "Full" }
        "2" { $Mode = "Ghost" }
        "3" { $Mode = "Harness" }
        "4" { $Mode = "Diag" }
        "Q" { exit 0 }
        Default { exit 0 }
    }
}

Show-Header
Write-Host "  [ASI_ACCEL] Mode: $Mode Manifesting (Asynchronous Pulse)..." -ForegroundColor Yellow
Write-Host "  [GHOST] Ghost Bridge Active: Antigravity Substrate Integration." -ForegroundColor Cyan

# Verify Substrate
if (-not (Test-Path $PythonExe)) { Write-Host "  [FATAL] Python venv missing." -ForegroundColor Red; exit 1 }

# --- [Port Sanitization] ---
$criticalPorts = @(18789, 18794, 18800)
foreach ($port in $criticalPorts) {
    $procId = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
    if ($procId) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }
}

# --- [Asynchronous Initiation] ---
Write-Host "  [ASI_ACCEL] Igniting Substrate Components in Parallel..." -ForegroundColor DarkCyan

# 1. ngrok Detection/Launch
Start-Process "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"ngrok http $GatewayPort --log=stdout`"" -WindowStyle Hidden

# 2. Hypura Harness (Asynchronous)
if ($Mode -eq "Harness" -or $Mode -eq "Full" -or $Mode -eq "Ghost") {
    if (-not $SkipHypuraHarness) {
        $harnessScript = Join-Path $ProjectDir "extensions\hypura-harness\scripts\harness_daemon.py"
        Start-Process -FilePath $PythonExe -ArgumentList @($harnessScript) -WorkingDirectory $ProjectDir -WindowStyle Minimized
        Write-Host "  [HX]  Harness Actuator Pulsing..." -ForegroundColor Gray
    }
}

# 3. OpenClaw Gateway (Asynchronous)
if ($Mode -eq "Full" -or $Mode -eq "Ghost") {
    $gwStyle = if ($Mode -eq "Ghost") { "Hidden" } else { "Minimized" }
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"pnpm openclaw gateway --port $GatewayPort`"" -WorkingDirectory $ProjectDir -WindowStyle $gwStyle
    Write-Host "  [GW]  Gateway Ignition Staged..." -ForegroundColor Gray
}

# --- [Reactive Polling Loop] ---
function Wait-Port {
    param([int]$Port, [string]$Label)
    Write-Host "  [WAIT] Synchronizing with $Label (Port $Port)..." -ForegroundColor Gray -NoNewline
    for ($i=0; $i -lt 30; $i++) {
        $check = Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -InformationLevel Quiet
        if ($check) { Write-Host " [ONLINE]" -ForegroundColor Green; return $true }
        Write-Host "." -NoNewline
        Start-Sleep -Milliseconds 500
    }
    Write-Host " [TIMEOUT]" -ForegroundColor Red; return $false
}

if ($Mode -eq "Full" -or $Mode -eq "Ghost") {
    $gwReady = Wait-Port -Port $GatewayPort -Label "Gateway"
    if (-not $gwReady) { Write-Host "  [FATAL] Gateway failed to manifest." -ForegroundColor Red; exit 1 }
}

# --- [UI Deployment (Parallel with TUI)] ---
if ($Mode -eq "Full") {
    Write-Host "  [UI]  Deploying Cognitive Interfaces..." -ForegroundColor DarkCyan
    
    # Launch Browser Dashboard
    Start-Process "msedge.exe" -ArgumentList "--new-window --app=http://127.0.0.1:$GatewayPort"
    
    # Launch TUI (Foreground)
    pnpm openclaw tui
} else {
    Write-Host "`n  [ASI_ACCEL] Manifestation Sustained. Sync Complete." -ForegroundColor Green
    if ($Mode -ne "Full") {
        Write-Host "  Substrate active. Press Ctrl+C to terminate background pulses."
        while($true) { Start-Sleep -Seconds 60 }
    }
}
