param(
    [int]$GatewayPort = 18789,
    [string]$Mode = "Menu", # Menu, Full, Ghost, Harness, Diag
    [switch]$SkipHypuraHarness = $false,
    [switch]$ForceShortcutUpdate = $false,
    # If Gateway never binds in time, still open Edge + TUI (default: do not exit 1). Use -StrictGatewayWait for old behavior.
    [switch]$StrictGatewayWait = $false
)

$ErrorActionPreference = "Stop"
chcp 65001 | Out-Null
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[console]::Title = "Sovereign-Portal: Manifestation Hub"

# --- [Paths] ---
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$PythonExe = Join-Path $ProjectDir ".venv\Scripts\python.exe"

. "$PSScriptRoot\env-tools.ps1"
Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir
# Child Start-Process sessions inherit this PATH (node / ngrok on PATH)
Add-SovereignDevToolsToPath
Set-OpenClawDesktopConfigEnv -ProjectDir $ProjectDir

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
    Write-Host "  [5] Docker Manifestation" -ForegroundColor Blue
    Write-Host "      (Docker Compose UP -d)" -ForegroundColor Gray
    Write-Host "  [6] Full Manifestation (Local + Docker)" -ForegroundColor Cyan
    Write-Host "      (Gateway + Harness + UI + Docker Compose)" -ForegroundColor Gray
    Write-Host "  [Q] Exit Portal`n" -ForegroundColor Red
    
    $choice = Read-Host "  Select Manifestation Mode"
    switch ($choice) {
        "1" { $Mode = "Full" }
        "2" { $Mode = "Ghost" }
        "3" { $Mode = "Harness" }
        "4" { $Mode = "Diag" }
        "5" { $Mode = "Docker" }
        "6" { $Mode = "Full-Docker" }
        "Q" { exit 0 }
        Default { exit 0 }
    }
}

Show-Header
Write-Host ("  [ASI_ACCEL] Mode: {0} Manifesting (Asynchronous Pulse)..." -f $Mode) -ForegroundColor Yellow
Write-Host "  [GHOST] Ghost Bridge Active: Antigravity Substrate Integration." -ForegroundColor Cyan

# Verify Substrate (venv or uv for harness)
if (-not (Test-Path $PythonExe) -and -not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Host "  [FATAL] Python venv missing and uv not on PATH." -ForegroundColor Red
    exit 1
}

# --- [Port Sanitization] ---
# Stop gateway service first (schtasks), then kill any remaining listeners.
schtasks /End /TN "OpenClaw Gateway (desktop-stack)" 2>$null | Out-Null
Start-Sleep -Milliseconds 600
$criticalPorts = @(18789, 18794, 18800)
foreach ($port in $criticalPorts) {
    try {
        $procId = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
        if ($procId) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }
    } catch { }
}
Start-Sleep -Milliseconds 400

# --- [Repo Config Sync] ---
$syncPs1 = Join-Path $ProjectDir "scripts\Sync-OpenClawDesktop.ps1"
if (Test-Path $syncPs1) {
    Write-Host "  [SYNC] Syncing repo config -> .openclaw-desktop..." -ForegroundColor DarkCyan
    & $syncPs1 -ProjectDir $ProjectDir -Quiet
}

# --- [Asynchronous Initiation] ---
Write-Host "  [ASI_ACCEL] Synchronizing Skill Substrate..." -ForegroundColor Cyan
if ($env:OPENCLAW_AGENT_WORKSPACE) { 
    $WorkspaceRoot = $env:OPENCLAW_AGENT_WORKSPACE 
} else { 
    $WorkspaceRoot = $ProjectDir 
}

$LocalSkills = Join-Path $ProjectDir "skills"
$WorkspaceSkills = Join-Path $WorkspaceRoot "skills"

if ((Test-Path $LocalSkills) -and ($WorkspaceSkills -ne $LocalSkills)) {
    if (-not (Test-Path $WorkspaceSkills)) {
        New-Item -ItemType Directory -Path $WorkspaceSkills -Force | Out-Null
    }
    Copy-Item -Path "$LocalSkills\*" -Destination $WorkspaceSkills -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host ("  [SYNC] Repo skills -> workspace: {0}" -f $WorkspaceSkills) -ForegroundColor Gray
}

Write-Host "  [ASI_ACCEL] Igniting Substrate Components in Parallel..." -ForegroundColor DarkCyan

# 0. Docker Manifestation (Compose)
if ($Mode -eq "Docker" -or $Mode -eq "Full-Docker") {
    Write-Host "  [DOCKER] Manifesting containers via docker-compose..." -ForegroundColor Blue
    try {
        Start-Process "docker" -ArgumentList "compose", "up", "-d" -WorkingDirectory $ProjectDir -WindowStyle Minimized -Wait
        Write-Host "  [DOCKER] Containers Ignited." -ForegroundColor Green

        # Start ngrok sync sidecar
        $syncNgrokPs1 = Join-Path $PSScriptRoot "sync-docker-ngrok.ps1"
        if (Test-Path $syncNgrokPs1) {
            Start-Process -FilePath "powershell.exe" -ArgumentList @(
                "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $syncNgrokPs1
            ) -WorkingDirectory $ProjectDir -WindowStyle Hidden
            Write-Host "  [SYNC] Docker-ngrok monitor started." -ForegroundColor DarkCyan
        }
    } catch {
        Write-Host ("  [ERROR] Docker manifestation failed: {0}" -f $_) -ForegroundColor Red
    }
}

# 0. VOICEVOX ENGINE (SOUL.md: metaverse / voice substrate)
if ($Mode -match "Harness|Full|Ghost|Full-Docker") {
    if ($env:SKIP_VOICEVOX_START -ne "1") {
        $vvPs1 = Join-Path $ProjectDir "scripts\launchers\start-voicevox-engine.ps1"
        Start-Process -FilePath "powershell.exe" -ArgumentList @(
            "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $vvPs1,
            "-ListenHost", "127.0.0.1", "-Port", "50021", "-Quiet"
        ) -WorkingDirectory $ProjectDir -WindowStyle Minimized
        Write-Host "  [VV]  VOICEVOX engine + verify (child window)..." -ForegroundColor Gray
    }
}

# 1. ngrok
$ngrokPs1 = Join-Path $ProjectDir "scripts\launchers\start_ngrok.ps1"
Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $ngrokPs1, "-Port", "$GatewayPort"
) -WorkingDirectory $ProjectDir -WindowStyle Minimized

# 2. Hypura Harness
if ($Mode -match "Harness|Full|Ghost|Full-Docker") {
    if (-not $SkipHypuraHarness) {
        $harnessPs1 = Join-Path $ProjectDir "scripts\launchers\Start-Hypura-Harness.ps1"
        Start-Process -FilePath "powershell.exe" -ArgumentList @(
            "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $harnessPs1
        ) -WorkingDirectory $ProjectDir -WindowStyle Minimized
        Write-Host "  [HX]  Harness Actuator Pulsing..." -ForegroundColor Gray
    }
}

# 3. OpenClaw Gateway
if ($Mode -match "Full|Ghost|Full-Docker") {
    $gwStyle = "Minimized"
    if ($Mode -eq "Ghost") { $gwStyle = "Hidden" }
    
    $gwPs1 = Join-Path $ProjectDir "scripts\launchers\Start-Gateway.ps1"
    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $gwPs1, "-Port", "$GatewayPort"
    ) -WorkingDirectory $ProjectDir -WindowStyle $gwStyle
    Write-Host "  [GW]  Gateway Ignition Staged..." -ForegroundColor Gray
}

# 4. Notification Tasks
$setupTasksPs1 = Join-Path $ProjectDir "scripts\launchers\Setup-NotificationTasks.ps1"
$notifyPs1     = Join-Path $ProjectDir "scripts\launchers\Send-Notification.ps1"

if (Test-Path $setupTasksPs1) {
    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $setupTasksPs1
    ) -WorkingDirectory $ProjectDir -WindowStyle Hidden -Wait -ErrorAction SilentlyContinue
    Write-Host "  [TASK] Notification tasks registered from .env" -ForegroundColor DarkCyan
}

if (Test-Path $notifyPs1) {
    $notifyCmdArg = '-NoProfile -ExecutionPolicy Bypass -File "{0}" -Type STARTUP' -f $notifyPs1
    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command",
        "Start-Sleep -Seconds 10; powershell.exe $notifyCmdArg"
    ) -WorkingDirectory $ProjectDir -WindowStyle Hidden
    Write-Host "  [NTF] SITREP queued (10s, env-injected)..." -ForegroundColor DarkCyan
}

# --- [Reactive Polling Loop] ---
function Test-TcpPortOpen {
    param([int]$Port, [int]$TimeoutMs = 750)
    $ComputerName = '127.0.0.1'
    $client = $null
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $iar = $client.BeginConnect($ComputerName, $Port, $null, $null)
        if ($iar.AsyncWaitHandle.WaitOne($TimeoutMs, $false)) {
            $client.EndConnect($iar)
            return $true
        }
    } catch { } finally {
        if ($client) { $client.Close() }
    }
    return $false
}

function Wait-Port {
    param(
        [int]$Port,
        [string]$Label,
        [int]$MaxSeconds = 300,
        [int]$PollMs = 1000,
        [string]$RepoRoot = "",
        [string]$NodeExe = ""
    )
    $maxAttempts = [Math]::Max(1, [int]($MaxSeconds * 1000 / $PollMs))
    
    if ($RepoRoot) { 
        $gwPs1 = Join-Path $RepoRoot "scripts\launchers\Start-Gateway.ps1" 
    } else { 
        $gwPs1 = "" 
    }
    
    if ($NodeExe -and (Test-Path -LiteralPath $NodeExe)) {
        $nodeRun = '& "{0}" .\scripts\run-node.mjs gateway --port {1}' -f $NodeExe, $Port
    } else {
        $nodeRun = 'node .\scripts\run-node.mjs gateway --port {0}' -f $Port
    }
    
    Write-Host ("  [WAIT] {0} port {1} (max ~{2}s)..." -f $Label, $Port, $MaxSeconds) -ForegroundColor Gray
    
    for ($i = 0; $i -lt $maxAttempts; $i++) {
        if (Test-TcpPortOpen -Port $Port -TimeoutMs 800) {
            Write-Host "  [WAIT] [ONLINE]" -ForegroundColor Green
            return $true
        }
        Start-Sleep -Milliseconds $PollMs
    }
    return $false
}

# Gateway started async; no blocking wait.
if ($Mode -match "Full|Ghost") {
    Write-Host "  [GW]  Gateway starting async..." -ForegroundColor Gray
}

if ($Mode -match "Full|Full-Docker") {
    Write-Host '  [UI]  Deploying Cognitive Interfaces...' -ForegroundColor DarkCyan

    $edgeExe = "msedge.exe"
    $candPaths = @(
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    )
    foreach ($cand in $candPaths) {
        if (Test-Path -LiteralPath $cand) { $edgeExe = $cand; break }
    }

    $gwToken = $null
    $ocJsonPath = Join-Path $ProjectDir ".openclaw-desktop\openclaw.json"
    if (Test-Path $ocJsonPath) {
        try {
            $ocCfg = Get-Content $ocJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
            $gwToken = [string]$ocCfg.gateway.auth.token
        } catch { }
    }
    if (-not $gwToken) { $gwToken = $env:OPENCLAW_GATEWAY_TOKEN }

    $baseUrl = "http://127.0.0.1:$GatewayPort"
    if ($gwToken) {
        $edgeUrl = "{0}?token={1}" -f $baseUrl, $gwToken
    } else {
        $edgeUrl = $baseUrl
    }
    
    $edgeApp = "--app=$edgeUrl"
    try {
        Start-Process -FilePath $edgeExe -ArgumentList @('--new-window', $edgeApp) -ErrorAction Stop
        Write-Host "  [EDGE] Browser launched async." -ForegroundColor Gray
    } catch {
        Write-Host ("  [WARN] Could not start Edge: {0}" -f $_) -ForegroundColor Yellow
    }

    $tuiPs1 = Join-Path $ProjectDir "scripts\launchers\Start-TUI.ps1"
    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $tuiPs1
    ) -WorkingDirectory $ProjectDir
    Write-Host "  [TUI] TUI launched async." -ForegroundColor Gray
}

# --- [Shortcut Management] ---
if ($ForceShortcutUpdate -or -not (Test-Path "$HOME\Desktop\Sovereign-Portal.lnk")) {
    try {
        $curScript = $MyInvocation.MyCommand.Path
        $curIcon = Join-Path $ProjectDir "assets\clawdbot.ico"
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut("$HOME\Desktop\Sovereign-Portal.lnk")
        $Shortcut.TargetPath = "powershell.exe"
        $Shortcut.Arguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}" -Mode Full-Docker' -f $curScript
        $Shortcut.WorkingDirectory = $ProjectDir
        if (Test-Path $curIcon) { $Shortcut.IconLocation = $curIcon }
        $Shortcut.Save()
        Write-Host "  [LNK] Desktop shortcut updated." -ForegroundColor Gray
    } catch { }
}

Write-Host ''
Write-Host '  [ASI_ACCEL] Manifestation Sustained. Sync Complete.' -ForegroundColor Green
Write-Host '  [EXIT]  Portal manifest complete.' -ForegroundColor Cyan
