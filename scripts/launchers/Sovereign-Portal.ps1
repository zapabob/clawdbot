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
$ScriptPath = $MyInvocation.MyCommand.Path
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$PythonExe = Join-Path $ProjectDir ".venv\Scripts\python.exe"
$IconPath = Join-Path $ProjectDir "assets\clawdbot.ico"
$envFile = Join-Path $ProjectDir ".env"

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
Write-Host "  [ASI_ACCEL] Mode: $Mode Manifesting (Asynchronous Pulse)..." -ForegroundColor Yellow
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
    $procId = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
    if ($procId) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }
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
$WorkspaceRoot = if ($env:OPENCLAW_AGENT_WORKSPACE) { $env:OPENCLAW_AGENT_WORKSPACE } else { $ProjectDir }
$LocalSkills = Join-Path $ProjectDir "skills"
$WorkspaceSkills = Join-Path $WorkspaceRoot "skills"

if ((Test-Path $LocalSkills) -and ($WorkspaceSkills -ne $LocalSkills)) {
    if (-not (Test-Path $WorkspaceSkills)) {
        New-Item -ItemType Directory -Path $WorkspaceSkills -Force | Out-Null
    }
    Copy-Item -Path "$LocalSkills\*" -Destination $WorkspaceSkills -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  [SYNC] Repo skills -> workspace: $WorkspaceSkills" -ForegroundColor Gray
}

Write-Host "  [ASI_ACCEL] Igniting Substrate Components in Parallel..." -ForegroundColor DarkCyan

# 0. Docker Manifestation (Compose)
if ($Mode -eq "Docker" -or $Mode -eq "Full-Docker") {
    Write-Host "  [DOCKER] Manifesting containers via docker-compose..." -ForegroundColor Blue
    try {
        Start-Process -FilePath "docker" -ArgumentList "compose", "up", "-d" -WorkingDirectory $ProjectDir -WindowStyle Minimized -Wait
        Write-Host "  [DOCKER] Containers Ignited." -ForegroundColor Green
    } catch {
        Write-Host "  [ERROR] Docker manifestation failed: $_" -ForegroundColor Red
    }
}

# 0. VOICEVOX ENGINE (SOUL.md: metaverse / voice substrate; Hypura + local-voice expect :50021)
if ($Mode -eq "Harness" -or $Mode -eq "Full" -or $Mode -eq "Ghost" -or $Mode -eq "Full-Docker") {
    if ($env:SKIP_VOICEVOX_START -ne "1") {
        $vvPs1 = Join-Path $ProjectDir "scripts\launchers\start-voicevox-engine.ps1"
        Start-Process -FilePath "powershell.exe" -ArgumentList @(
            "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $vvPs1,
            "-ListenHost", "127.0.0.1", "-Port", "50021", "-Quiet"
        ) -WorkingDirectory $ProjectDir -WindowStyle Minimized
        Write-Host "  [VV]  VOICEVOX engine + verify (child window)..." -ForegroundColor Gray
    }
}

# 1. ngrok (HANDOFF 2-2: 404 API -> .env + process env)
$ngrokPs1 = Join-Path $ProjectDir "scripts\launchers\start_ngrok.ps1"
Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $ngrokPs1, "-Port", "$GatewayPort"
) -WorkingDirectory $ProjectDir -WindowStyle Minimized

# 2. Hypura Harness (Asynchronous)
if ($Mode -eq "Harness" -or $Mode -eq "Full" -or $Mode -eq "Ghost" -or $Mode -eq "Full-Docker") {
    if (-not $SkipHypuraHarness) {
        $harnessPs1 = Join-Path $ProjectDir "scripts\launchers\Start-Hypura-Harness.ps1"
        Start-Process -FilePath "powershell.exe" -ArgumentList @(
            "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $harnessPs1
        ) -WorkingDirectory $ProjectDir -WindowStyle Minimized
        Write-Host "  [HX]  Harness Actuator Pulsing..." -ForegroundColor Gray
    }
}

# 3. OpenClaw Gateway (Asynchronous)
if ($Mode -eq "Full" -or $Mode -eq "Ghost" -or $Mode -eq "Full-Docker") {
    $gwStyle = if ($Mode -eq "Ghost") { "Hidden" } else { "Minimized" }
    $gwPs1 = Join-Path $ProjectDir "scripts\launchers\Start-Gateway.ps1"
    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $gwPs1, "-Port", "$GatewayPort"
    ) -WorkingDirectory $ProjectDir -WindowStyle $gwStyle
    Write-Host "  [GW]  Gateway Ignition Staged..." -ForegroundColor Gray
}

# 4. Notification Tasks - env-driven Task Scheduler registration + startup SITREP
$setupTasksPs1 = Join-Path $ProjectDir "scripts\launchers\Setup-NotificationTasks.ps1"
$notifyPs1     = Join-Path $ProjectDir "scripts\launchers\Send-Notification.ps1"
if (Test-Path $setupTasksPs1) {
    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $setupTasksPs1
    ) -WorkingDirectory $ProjectDir -WindowStyle Hidden -Wait -ErrorAction SilentlyContinue
    Write-Host "  [TASK] Notification tasks registered from .env" -ForegroundColor DarkCyan
}
if (Test-Path $notifyPs1) {
    $notifyCmdArg = "-NoProfile -ExecutionPolicy Bypass -File `"$notifyPs1`" -Type STARTUP"
    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command",
        "Start-Sleep -Seconds 10; powershell.exe $notifyCmdArg"
    ) -WorkingDirectory $ProjectDir -WindowStyle Hidden
    Write-Host "  [NTF] SITREP queued (10s, env-injected)..." -ForegroundColor DarkCyan
}

# --- [Reactive Polling Loop] ---
# Test-NetConnection is slow; use short TCP probe only.
function Test-TcpPortOpen {
    param(
        [int]$Port,
        [int]$TimeoutMs = 750
    )
    $ComputerName = '127.0.0.1'
    $c = $null
    try {
        $c = New-Object System.Net.Sockets.TcpClient
        $iar = $c.BeginConnect($ComputerName, $Port, $null, $null)
        if (-not $iar.AsyncWaitHandle.WaitOne($TimeoutMs, $false)) {
            return $false
        }
        try {
            $c.EndConnect($iar)
            return $true
        } catch {
            return $false
        }
    } catch {
        return $false
    } finally {
        if ($null -ne $c) {
            try { $c.Close() } catch { }
        }
    }
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
    $maxAttempts = [Math]::Max(1, [int][Math]::Ceiling($MaxSeconds * 1000.0 / $PollMs))
    $gwPs1 = if ($RepoRoot) { Join-Path $RepoRoot "scripts\launchers\Start-Gateway.ps1" } else { "" }
    $nodeRun = if ($NodeExe -and (Test-Path -LiteralPath $NodeExe)) {
        ('& ''{0}'' .\scripts\run-node.mjs gateway --port {1}' -f $NodeExe, $Port)
    } else {
        ('node .\scripts\run-node.mjs gateway --port {0}' -f $Port)
    }
    Write-Host "  [WAIT] $Label port $Port (max ~${MaxSeconds}s, first build can be slow)..." -ForegroundColor Gray
    $hint60 = $false
    for ($i = 0; $i -lt $maxAttempts; $i++) {
        if (Test-TcpPortOpen -Port $Port -TimeoutMs 800) {
            $elapsed = [int](($i + 1) * $PollMs / 1000)
            Write-Host "  [WAIT] [ONLINE] after ~${elapsed}s" -ForegroundColor Green
            return $true
        }
        $sec = [int](($i + 1) * $PollMs / 1000)
        if ($sec -gt 0 -and ($sec % 15 -eq 0)) {
            Write-Host "  [WAIT] ... ${sec}s - check minimized Gateway PowerShell for node/ts errors" -ForegroundColor DarkGray
            if ($RepoRoot -and ($sec -eq 15)) {
                Write-Host ('  [HINT] Foreground: Set-Location -LiteralPath ''{0}''; {1}' -f $RepoRoot, $nodeRun) -ForegroundColor DarkGray
            }
        } else {
            Write-Host "." -NoNewline -ForegroundColor DarkGray
        }
        if (-not $hint60 -and $sec -ge 60 -and $RepoRoot -and (Test-Path -LiteralPath $gwPs1)) {
            $hint60 = $true
            Write-Host ""
            Write-Host ('  [HINT] 60s+: new window -> powershell -NoProfile -ExecutionPolicy Bypass -File "{0}" -Port {1}' -f $gwPs1, $Port) -ForegroundColor Yellow
        }
        Start-Sleep -Milliseconds $PollMs
    }
    Write-Host ""
    Write-Host "  [WAIT] [TIMEOUT] after ~${MaxSeconds}s" -ForegroundColor Red
    Write-Host '  [HINT] Gateway: minimized PowerShell window - node errors? First run: bundle/build can take minutes.' -ForegroundColor Yellow
    if ($RepoRoot) {
        Write-Host ('  [HINT] Manual: Set-Location -LiteralPath ''{0}''; {1}' -f $RepoRoot, $nodeRun) -ForegroundColor DarkGray
        if (Test-Path -LiteralPath $gwPs1) {
            Write-Host ('  [HINT] Or: powershell -NoProfile -ExecutionPolicy Bypass -File "{0}" -Port {1}' -f $gwPs1, $Port) -ForegroundColor DarkGray
        }
    } else {
        Write-Host ('  [HINT] Manual: cd <repo> ; node scripts/run-node.mjs gateway --port ' + $Port) -ForegroundColor DarkGray
    }
    Write-Host '  [HINT] Skip wait next time: $env:OPENCLAW_SKIP_GATEWAY_WAIT = ''1''' -ForegroundColor DarkGray
    return $false
}

# Gateway started async above; no blocking wait. Test-TcpPortOpen / Wait-Port kept for future use.
if ($Mode -eq "Full" -or $Mode -eq "Ghost") {
    Write-Host "  [GW]  Gateway starting async (first build may take ~1-3 min)..." -ForegroundColor Gray
    Write-Host "  [HINT] To diagnose: check the minimized Gateway PowerShell window for node/ts errors." -ForegroundColor DarkGray
}

if ($Mode -eq "Full" -or $Mode -eq "Full-Docker") {
    Write-Host '  [UI]  Deploying Cognitive Interfaces...' -ForegroundColor DarkCyan

    $edgeExe = $null
    foreach ($cand in @(
            $(if (${env:ProgramFiles(x86)}) { Join-Path ${env:ProgramFiles(x86)} "Microsoft\Edge\Application\msedge.exe" } else { $null }),
            $(Join-Path $env:ProgramFiles "Microsoft\Edge\Application\msedge.exe")
        )) {
        if (-not $cand) { continue }
        if (Test-Path -LiteralPath $cand) { $edgeExe = $cand; break }
    }
    if (-not $edgeExe) {
        $g = Get-Command msedge.exe -ErrorAction SilentlyContinue
        if ($g -and $g.Source) { $edgeExe = $g.Source }
    }
    if (-not $edgeExe) { $edgeExe = 'msedge.exe' }

    # Inject gateway auth token from openclaw.json dynamically.
    $gwToken = $null
    $ocJsonPath = Join-Path $ProjectDir ".openclaw-desktop\openclaw.json"
    if (Test-Path $ocJsonPath) {
        try {
            $ocCfg = Get-Content $ocJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
            $gwToken = [string]$ocCfg.gateway.auth.token
        } catch { }
    }
    if (-not $gwToken) { $gwToken = $env:OPENCLAW_GATEWAY_TOKEN }
    $baseUrl = 'http://127.0.0.1:{0}' -f $GatewayPort
    $edgeUrl  = if ($gwToken) { '{0}?token={1}' -f $baseUrl, $gwToken } else { $baseUrl }
    $edgeApp  = '--app={0}' -f $edgeUrl
    try {
        Start-Process -FilePath $edgeExe -ArgumentList @('--new-window', $edgeApp) -ErrorAction Stop
        Write-Host ("  [EDGE] Browser launched async (token injected: {0})." -f $(if ($gwToken) { 'yes' } else { 'no' })) -ForegroundColor Gray
    } catch {
        Write-Host "  [WARN] Could not start Edge ($edgeExe): $_" -ForegroundColor Yellow
        Write-Host "  [HINT] Install Edge or open manually: $edgeUrl" -ForegroundColor DarkGray
    }

    # TUI launched async in its own console window (non-blocking).
    $tuiPs1 = Join-Path $ProjectDir "scripts\launchers\Start-TUI.ps1"
    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $tuiPs1
    ) -WorkingDirectory $ProjectDir
    Write-Host "  [TUI] TUI launched async (new window)." -ForegroundColor Gray
}

# --- [Shortcut Management] ---
if ($ForceShortcutUpdate -or -not (Test-Path "$HOME\Desktop\Sovereign-Portal.lnk")) {
    try {
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut("$HOME\Desktop\Sovereign-Portal.lnk")
        $Shortcut.TargetPath = "powershell.exe"
        $Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`" -Mode Full-Docker"
        $Shortcut.WorkingDirectory = $ProjectDir
        if (Test-Path $IconPath) { $Shortcut.IconLocation = $IconPath }
        $Shortcut.Save()
        Write-Host "  [LNK] Desktop shortcut updated: Sovereign-Portal.lnk" -ForegroundColor Gray
    } catch {
        Write-Host "  [WARN] Failed to update desktop shortcut: $_" -ForegroundColor Yellow
    }
}

Write-Host ''
Write-Host '  [ASI_ACCEL] Manifestation Sustained. Sync Complete.' -ForegroundColor Green
Write-Host "  [SUMMARY] Gateway: async (port $GatewayPort)  Browser: async  TUI: async" -ForegroundColor DarkCyan
Write-Host '  [EXIT]  Portal manifest complete. All components running in background.' -ForegroundColor Cyan
