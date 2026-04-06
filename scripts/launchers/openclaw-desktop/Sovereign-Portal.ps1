param(
    [int]$GatewayPort = 18789,
    [string]$Mode = "Menu", # Menu, Full, Ghost, Harness, Diag
    [switch]$SkipHypuraHarness = $false,
    [switch]$ForceShortcutUpdate = $false,
    [switch]$UseDesktopLauncher = $false,
    # If Gateway never binds in time, still open Edge + TUI (default: do not exit 1). Use -StrictGatewayWait for old behavior.
    [switch]$StrictGatewayWait = $false
)

$ErrorActionPreference = "Stop"
chcp 65001 | Out-Null
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[console]::Title = "Sovereign-Portal: Manifestation Hub"

# --- [Paths] ---
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.Parent.FullName
$PythonExe = Join-Path $ProjectDir ".venv\Scripts\python.exe"

. "$PSScriptRoot\..\env-tools.ps1"
Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir
Ensure-GatewayTokenInProcess -ProjectDir $ProjectDir | Out-Null
# Child Start-Process sessions inherit this PATH (node / ngrok on PATH)
Add-SovereignDevToolsToPath
# nvm4w アクティブノードを C:\Program Files\nodejs (v25) より優先させる
# Add-SovereignDevToolsToPath が Program Files\nodejs を先頭に追加するため、nvm を再先頭へ
if ($env:NVM_SYMLINK -and (Test-Path (Join-Path $env:NVM_SYMLINK "node.exe"))) {
    $env:Path = "$env:NVM_SYMLINK;$env:Path"
} elseif (Test-Path "C:\nvm4w\nodejs\node.exe") {
    $env:Path = "C:\nvm4w\nodejs;$env:Path"
}
if ($UseDesktopLauncher) {
    $env:OPENCLAW_USE_REPO_LAUNCHER = "0"
} elseif (($env:OPENCLAW_USE_REPO_LAUNCHER -eq "0") -or [string]::IsNullOrWhiteSpace([string]$env:OPENCLAW_USE_REPO_LAUNCHER)) {
    $env:OPENCLAW_USE_REPO_LAUNCHER = "1"
}
Set-OpenClawDesktopConfigEnv -ProjectDir $ProjectDir

function Invoke-OpenClawRepoDistPreflight {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepoRoot
    )
    if ([string]$env:OPENCLAW_SKIP_REPO_DIST_PREFLIGHT -eq "1") {
        return $true
    }
    $nodePf = Resolve-NodeExecutable
    if (-not $nodePf) {
        Write-Host "  [PREFLIGHT] node.exe not found; cannot refresh dist." -ForegroundColor Yellow
        return $false
    }
    Write-Host "  [PREFLIGHT] dist sync: tsdown --no-clean + runtime-postbuild + build-stamp (stabilizes Gateway on Windows)..." -ForegroundColor DarkCyan
    Write-Host "  [PREFLIGHT] Tip: full pnpm build needs Git Bash/WSL for canvas:a2ui. Skip this block: `$env:OPENCLAW_SKIP_REPO_DIST_PREFLIGHT='1'" -ForegroundColor DarkGray
    Push-Location $RepoRoot
    try {
        $steps = @(
            @{ Args = @("scripts/tsdown-build.mjs", "--no-clean"); Label = "tsdown" },
            @{ Args = @("scripts/runtime-postbuild.mjs"); Label = "runtime-postbuild" },
            @{ Args = @("scripts/build-stamp.mjs"); Label = "build-stamp" }
        )
        foreach ($step in $steps) {
            $cmdArgs = $step.Args
            & $nodePf @cmdArgs
            if ($LASTEXITCODE -ne 0) {
                Write-Host ("  [PREFLIGHT][ERROR] {0} failed (exit {1})." -f $step.Label, $LASTEXITCODE) -ForegroundColor Red
                return $false
            }
        }
    } finally {
        Pop-Location
    }
    Write-Host "  [PREFLIGHT] dist sync OK." -ForegroundColor Green
    return $true
}

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
    Write-Host "  [7] ngrok + Telegram Webhook Quick Repair" -ForegroundColor DarkCyan
    Write-Host "      (Gateway確認 + ngrok再作成 + setWebhook検証)" -ForegroundColor Gray
    Write-Host "  [Q] Exit Portal`n" -ForegroundColor Red
    
    $choice = Read-Host "  Select Manifestation Mode"
    $choice = if ($null -ne $choice) { $choice.Trim() } else { "" }
    # Desktop shortcut + Enter だけだと従来は即 exit して何も起動しなかった
    if ([string]::IsNullOrWhiteSpace($choice)) {
        $choice = "1"
        Write-Host '  (空入力 -> [1] Standard Manifestation を使用)' -ForegroundColor DarkGray
    }
    switch ($choice) {
        "1" { $Mode = "Full" }
        "2" { $Mode = "Ghost" }
        "3" { $Mode = "Harness" }
        "4" { $Mode = "Diag" }
        "5" { $Mode = "Docker" }
        "6" { $Mode = "Full-Docker" }
        "7" { $Mode = "RepairWebhook" }
        "q" { exit 0 }
        "Q" { exit 0 }
        Default {
            Write-Host '  無効な選択です。[1] Standard Manifestation で続行します。' -ForegroundColor Yellow
            $Mode = "Full"
        }
    }
}

Show-Header
Write-Host ("  [ASI_ACCEL] Mode: {0} Manifesting (Asynchronous Pulse)..." -f $Mode) -ForegroundColor Yellow
Write-Host "  [GHOST] Ghost Bridge Active: Antigravity Substrate Integration." -ForegroundColor Cyan

if ($Mode -eq "RepairWebhook") {
    $repairPs1 = Join-Path $ProjectDir "scripts\launchers\repair-ngrok-and-telegram-webhook.ps1"
    if (-not (Test-Path -LiteralPath $repairPs1)) {
        Write-Host ("  [REPAIR][ERROR] Script not found: {0}" -f $repairPs1) -ForegroundColor Red
        exit 1
    }
    Write-Host "  [REPAIR] Running ngrok + Telegram webhook one-shot recovery..." -ForegroundColor DarkCyan
    & $repairPs1 -Port $GatewayPort
    if ($LASTEXITCODE -ne 0) {
        Write-Host ("  [REPAIR][ERROR] Recovery exited with code {0}" -f $LASTEXITCODE) -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "  [REPAIR] Completed." -ForegroundColor Green
    exit 0
}

# Hypura harness needs Python venv or uv; Gateway/TUI/Browser do not — do not exit the whole portal.
$pythonHarnessMissing = (-not (Test-Path $PythonExe)) -and -not (Get-Command uv -ErrorAction SilentlyContinue)
if ($pythonHarnessMissing) {
    if ($Mode -eq "Harness") {
        Write-Host "  [FATAL] Harness-only mode requires repo .venv or uv on PATH." -ForegroundColor Red
        exit 1
    }
    Write-Host "  [WARN] No repo .venv and no uv — skipping Hypura harness (Gateway/TUI/UI still run)." -ForegroundColor Yellow
    $SkipHypuraHarness = $true
}

# --- [Port Sanitization + Node Process Cleanup] ---
# 1. Kill ALL node.exe processes unconditionally (orphan gateway, pnpm dev, build, etc.)
#    WMI/CimInstance フィルタを廃止 → 高速化 + 取りこぼし防止
Write-Host "  [KILL] Purging ALL node.exe processes..." -ForegroundColor DarkYellow
$nodeProcs = @(Get-Process -Name "node" -ErrorAction SilentlyContinue)
$killedPids = 0
foreach ($proc in $nodeProcs) {
    try {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        $killedPids++
        Write-Host ("  [KILL] PID {0} terminated" -f $proc.Id) -ForegroundColor DarkYellow
    } catch { }
}
if ($killedPids -gt 0) {
    Write-Host ("  [KILL] {0} node process(es) killed. Waiting for file handles to release..." -f $killedPids) -ForegroundColor Yellow
    Start-Sleep -Seconds 2
} else {
    Write-Host "  [KILL] No node.exe processes found." -ForegroundColor DarkGray
}

# 3. Kill any remaining port listeners (ALL PIDs, not just first)
$criticalPorts = @(18789, 18794, 18799, 18800)
foreach ($port in $criticalPorts) {
    try {
        $procIds = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
                   Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $procIds) {
            if ($procId) {
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                Write-Host ("  [KILL] Port {0} listener PID {1} terminated" -f $port, $procId) -ForegroundColor DarkYellow
            }
        }
    } catch { }
}
Start-Sleep -Milliseconds 500

# Refresh dist before Gateway so run-node does not race a second incremental build; avoids broken channel loads on some Windows/Node combos.
if ($Mode -eq "Full" -or $Mode -eq "Ghost") {
    $pfOk = Invoke-OpenClawRepoDistPreflight -RepoRoot $ProjectDir
    if ($pfOk) {
        $env:OPENCLAW_RUNNODE_SKIP_BUILD = "1"
        Write-Host "  [PREFLIGHT] OPENCLAW_RUNNODE_SKIP_BUILD=1 for child launchers (dist already synced)." -ForegroundColor DarkGray
    }
}

# dist/extensions の .runtime-deps-* 一時ディレクトリのみ削除（残留ゴミ）
# node_modules は削除しない → 削除すると毎回 npm install が走り起動が遅くなる
# 完全クリーンが必要な場合は scripts\Kill-OpenclawNodes.ps1 を使う
$distExtDir = Join-Path $ProjectDir "dist\extensions"
if (Test-Path $distExtDir) {
    Get-ChildItem $distExtDir -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        Get-ChildItem $_.FullName -Directory -Filter ".runtime-deps-*" -ErrorAction SilentlyContinue |
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# --- [Repo Config Sync] ---
$syncPs1 = Join-Path $ProjectDir "scripts\Sync-OpenClawDesktop.ps1"
if (([string]$env:OPENCLAW_USE_REPO_LAUNCHER -eq "0") -and (Test-Path $syncPs1)) {
    Write-Host "  [SYNC] Syncing repo config -> .openclaw-desktop..." -ForegroundColor DarkCyan
    & $syncPs1 -ProjectDir $ProjectDir -Quiet
} else {
    Write-Host "  [SYNC] Repo config sync skipped (desktop launcher mode is off)." -ForegroundColor DarkGray
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

# Full-Docker: Docker publishes Gateway (18789) and often Hypura (18794) + ngrok API (:4040).
# Starting the same services on the host causes bind conflicts -> child PowerShell exits immediately (Minimized = invisible).
$startHostNgrok = $true
$dockerProvidesHarness18794 = $false
# True when not using Docker compose this run; if compose runs, set true only on exit code 0
$dockerComposeUpOk = ($Mode -ne "Docker" -and $Mode -ne "Full-Docker")

# 0. Docker Manifestation (Compose)
if ($Mode -eq "Docker" -or $Mode -eq "Full-Docker") {
    Write-Host "  [DOCKER] Manifesting containers via docker-compose..." -ForegroundColor Blue

    # docker-compose.yml requires non-empty OPENCLAW_CONFIG_DIR / OPENCLAW_WORKSPACE_DIR for volume source paths.
    $cfgDir = [string]$env:OPENCLAW_CONFIG_DIR
    if ([string]::IsNullOrWhiteSpace($cfgDir)) {
        $cfgDir = Join-Path $ProjectDir ".openclaw-desktop"
        $env:OPENCLAW_CONFIG_DIR = $cfgDir
        Write-Host ("  [DOCKER] OPENCLAW_CONFIG_DIR unset -> {0}" -f $cfgDir) -ForegroundColor DarkCyan
    }
    $wsDir = [string]$env:OPENCLAW_WORKSPACE_DIR
    if ([string]::IsNullOrWhiteSpace($wsDir)) {
        if ($env:OPENCLAW_AGENT_WORKSPACE) {
            $wsDir = [string]$env:OPENCLAW_AGENT_WORKSPACE
        } else {
            $wsDir = Join-Path $ProjectDir "workspace"
        }
        $env:OPENCLAW_WORKSPACE_DIR = $wsDir
        Write-Host ("  [DOCKER] OPENCLAW_WORKSPACE_DIR unset -> {0}" -f $wsDir) -ForegroundColor DarkCyan
    }
    function Resolve-ComposeHostPath {
        param([string]$Raw)
        if ([string]::IsNullOrWhiteSpace($Raw)) { return $Raw }
        $t = $Raw.Trim()
        if (-not [System.IO.Path]::IsPathRooted($t)) {
            $t = $t.TrimStart([char]'.', [char]'/', [char]'\')
            return [System.IO.Path]::GetFullPath((Join-Path $ProjectDir $t))
        }
        return [System.IO.Path]::GetFullPath($t)
    }
    try {
        $env:OPENCLAW_CONFIG_DIR = Resolve-ComposeHostPath -Raw $env:OPENCLAW_CONFIG_DIR
        $env:OPENCLAW_WORKSPACE_DIR = Resolve-ComposeHostPath -Raw $env:OPENCLAW_WORKSPACE_DIR
    } catch {
        Write-Host ("  [DOCKER][ERROR] Invalid OPENCLAW_* directory path: {0}" -f $_) -ForegroundColor Red
    }
    foreach ($d in @($env:OPENCLAW_CONFIG_DIR, $env:OPENCLAW_WORKSPACE_DIR)) {
        if (-not [string]::IsNullOrWhiteSpace($d) -and -not (Test-Path -LiteralPath $d)) {
            New-Item -ItemType Directory -Path $d -Force | Out-Null
        }
    }

    $openclawImage = "openclaw:local"
    if ($env:OPENCLAW_IMAGE -and $env:OPENCLAW_IMAGE.Trim().Length -gt 0) {
        $openclawImage = $env:OPENCLAW_IMAGE.Trim()
    }
    $dockerExe = Get-Command docker -ErrorAction SilentlyContinue
    if ($dockerExe) {
        $imgInspect = Start-Process -FilePath "docker" -ArgumentList @("image", "inspect", $openclawImage) `
            -WorkingDirectory $ProjectDir -WindowStyle Hidden -Wait -PassThru
        if ($imgInspect.ExitCode -ne 0) {
            Write-Host ("  [DOCKER][WARN] Image not found locally: {0}" -f $openclawImage) -ForegroundColor Yellow
            Write-Host '  [DOCKER][WARN] Build: docker build -t openclaw:local -f Dockerfile .' -ForegroundColor Yellow
            Write-Host '  [DOCKER][WARN] Or set OPENCLAW_IMAGE (GHCR tags: docs/install/docker.md).' -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [DOCKER][WARN] docker.exe not on PATH; skipping image preflight." -ForegroundColor Yellow
    }

    try {
        $composeProc = Start-Process -FilePath "docker" -ArgumentList @("compose", "up", "-d") `
            -WorkingDirectory $ProjectDir -WindowStyle Minimized -Wait -PassThru
        if ($composeProc.ExitCode -eq 0) {
            $dockerComposeUpOk = $true
            Write-Host "  [DOCKER] Containers Ignited." -ForegroundColor Green
        } else {
            Write-Host ("  [DOCKER][ERROR] docker compose exited with code {0}. Try: docker compose logs" -f $composeProc.ExitCode) -ForegroundColor Red
        }
    } catch {
        Write-Host ("  [DOCKER][ERROR] Docker manifestation failed: {0}" -f $_) -ForegroundColor Red
    }

    if ($dockerComposeUpOk) {
        # Start ngrok sync sidecar
        $syncNgrokPs1 = Join-Path $PSScriptRoot "..\sync-docker-ngrok.ps1"
        if (Test-Path $syncNgrokPs1) {
            Start-Process -FilePath "powershell.exe" -ArgumentList @(
                "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $syncNgrokPs1
            ) -WorkingDirectory $ProjectDir -WindowStyle Hidden
            Write-Host "  [SYNC] Docker-ngrok monitor started." -ForegroundColor DarkCyan
        }

        if ($Mode -eq "Full-Docker") {
            for ($d = 0; $d -lt 20; $d++) {
                $listen18794 = @(Get-NetTCPConnection -LocalPort 18794 -State Listen -ErrorAction SilentlyContinue)
                if ($listen18794.Count -gt 0) {
                    $dockerProvidesHarness18794 = $true
                    Write-Host "  [DOCKER] Port 18794 in use -> Hypura Harness is Docker-side; skipping local harness." -ForegroundColor DarkCyan
                    break
                }
                Start-Sleep -Milliseconds 800
            }
            $listen4040 = @(Get-NetTCPConnection -LocalPort 4040 -State Listen -ErrorAction SilentlyContinue)
            if ($listen4040.Count -gt 0) {
                $startHostNgrok = $false
                Write-Host "  [DOCKER] Port 4040 in use -> skipping host start_ngrok.ps1 (use Docker ngrok dashboard)." -ForegroundColor DarkCyan
            }
        }
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

# 2. Hypura Harness
if ($Mode -match "Harness|Full|Ghost|Full-Docker") {
    if (-not $SkipHypuraHarness) {
        $launchLocalHarness = ($Mode -ne "Full-Docker") -or (-not $dockerProvidesHarness18794)
        if ($launchLocalHarness) {
            $harnessPs1 = Join-Path $ProjectDir "scripts\launchers\Start-Hypura-Harness.ps1"
            Start-Process -FilePath "powershell.exe" -ArgumentList @(
                "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $harnessPs1
            ) -WorkingDirectory $ProjectDir -WindowStyle Minimized
            Write-Host "  [HX]  Harness Actuator Pulsing..." -ForegroundColor Gray
        } elseif ($Mode -eq "Full-Docker") {
            Write-Host "  [HX]  Harness provided by Docker on 18794." -ForegroundColor Gray
        }
    }
}

# 3. OpenClaw Gateway (skip local node gateway when Docker publishes the same port)
if ($Mode -match "Full|Ghost|Full-Docker") {
    if ($Mode -eq "Full-Docker") {
        Write-Host ("  [GW]  Gateway in Docker on port {0}; local Start-Gateway.ps1 skipped." -f $GatewayPort) -ForegroundColor DarkCyan
    } else {
        # Full: show Gateway window so startup errors are visible (set OPENCLAW_MINIMIZE_LAUNCHERS=1 to hide).
        $gwStyle = "Normal"
        if ($Mode -eq "Ghost") { $gwStyle = "Hidden" }
        elseif ($Mode -eq "Full" -and [string]$env:OPENCLAW_MINIMIZE_LAUNCHERS -eq "1") { $gwStyle = "Minimized" }

        $gwPs1 = Join-Path $ProjectDir "scripts\launchers\Start-Gateway.ps1"
        Start-Process -FilePath "powershell.exe" -ArgumentList @(
            "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $gwPs1, "-Port", "$GatewayPort"
        ) -WorkingDirectory $ProjectDir -WindowStyle $gwStyle
        Write-Host "  [GW]  Gateway Ignition Staged..." -ForegroundColor Gray
    }
}

# 1. ngrok (host binary; skip when Docker ngrok already bound :4040)
#    After Gateway (or Docker bind on host port): upstream must be listening or ERR_NGROK_8012 / bad upstream addr.
$ngrokPs1 = Join-Path $ProjectDir "scripts\launchers\start_ngrok.ps1"
if ($startHostNgrok) {
    Write-Host ("  [ngrok] Waiting for TCP listen on port {0} (upstream http://127.0.0.1:{0})..." -f $GatewayPort) -ForegroundColor DarkCyan
    $ngDeadline = [DateTime]::Now.AddSeconds(90)
    while ([DateTime]::Now -lt $ngDeadline) {
        $listenGw = @(Get-NetTCPConnection -LocalPort $GatewayPort -State Listen -ErrorAction SilentlyContinue)
        if ($listenGw.Count -gt 0) {
            break
        }
        Start-Sleep -Milliseconds 500
    }
    Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir
    $ngrokTunnelPort = Get-NgrokUpstreamTunnelMatchPort -GatewayPort $GatewayPort -ProjectDir $ProjectDir
    if ($ngrokTunnelPort -ne $GatewayPort) {
        Write-Host ("  [ngrok] Upstream port {0}; waiting for listener (up to 120s)..." -f $ngrokTunnelPort) -ForegroundColor DarkCyan
        $upDeadline = [DateTime]::Now.AddSeconds(120)
        while ([DateTime]::Now -lt $upDeadline) {
            $listenUp = @(Get-NetTCPConnection -LocalPort $ngrokTunnelPort -State Listen -ErrorAction SilentlyContinue)
            if ($listenUp.Count -gt 0) { break }
            Start-Sleep -Milliseconds 500
        }
    }
    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $ngrokPs1, "-Port", "$GatewayPort"
    ) -WorkingDirectory $ProjectDir -WindowStyle Minimized
    $syncedNgrokUrl = Sync-NgrokPublicUrlToEnv -ProjectDir $ProjectDir -MaxWaitSeconds 12 -PollMs 1000 -GatewayPort $GatewayPort
    if ($syncedNgrokUrl) {
        Write-Host ("  [ngrok] Dynamic env sync: {0}" -f $syncedNgrokUrl) -ForegroundColor DarkCyan
    } else {
        Write-Host "  [ngrok] Dynamic env sync pending (will continue in ngrok side process)." -ForegroundColor DarkGray
    }
} else {
    Write-Host "  [ngrok] Host tunnel not started (Docker or busy :4040)." -ForegroundColor DarkGray
    $syncedNgrokUrl = Sync-NgrokPublicUrlToEnv -ProjectDir $ProjectDir -MaxWaitSeconds 4 -PollMs 800 -GatewayPort $GatewayPort
    if ($syncedNgrokUrl) {
        Write-Host ("  [ngrok] Reused existing public URL: {0}" -f $syncedNgrokUrl) -ForegroundColor DarkCyan
    }
}

# Notification: optional scheduled Heartbeat only — run manually:
#   .\scripts\launchers\Setup-NotificationTasks.ps1
# (Startup SITREP / portal-queued Telegram+LINE were removed from automatic startup.)

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

# Gateway status hint (avoid -match Full|Ghost: Full-Docker also matches substring Full)
if ($Mode -eq "Full" -or $Mode -eq "Ghost") {
    Write-Host "  [GW]  Gateway starting async..." -ForegroundColor Gray
} elseif ($Mode -eq "Full-Docker") {
    Write-Host "  [GW]  Expecting Gateway from Docker on this machine's port $GatewayPort..." -ForegroundColor Gray
}

if ($Mode -match "Full|Full-Docker") {
    if ($Mode -eq "Full-Docker") {
        if (-not $dockerComposeUpOk) {
            Write-Host "  [WARN] docker compose failed; skipping Docker gateway wait and browser launch." -ForegroundColor Yellow
        } else {
            Write-Host ("  [WAIT] Checking TCP {0} (Docker openclaw-gateway)..." -f $GatewayPort) -ForegroundColor Gray
            $gwReady = Wait-Port -Port $GatewayPort -Label "Docker gateway" -MaxSeconds 180 -PollMs 1500
            if (-not $gwReady) {
                Write-Host "  [WARN] Port not open. Check: docker compose ps ; docker compose logs openclaw-gateway" -ForegroundColor Yellow
                Write-Host "  [WARN] Ensure image exists (e.g. openclaw:local). Base compose requires a built image." -ForegroundColor Yellow
            }
        }
    }

    Write-Host '  [UI]  Deploying Cognitive Interfaces...' -ForegroundColor DarkCyan

    $tuiPs1 = Join-Path $ProjectDir "scripts\launchers\Start-TUI.ps1"
    $launchTuiAfterGatewayWait = ($Mode -eq "Full")
    if ($launchTuiAfterGatewayWait) {
        Write-Host "  [TUI] Delaying TUI launch until Gateway wait completes..." -ForegroundColor DarkGray
    } else {
        $tuiWin = "Normal"
        if ([string]$env:OPENCLAW_MINIMIZE_LAUNCHERS -eq "1") { $tuiWin = "Minimized" }
        Start-Process -FilePath "powershell.exe" -ArgumentList @(
            "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $tuiPs1
        ) -WorkingDirectory $ProjectDir -WindowStyle $tuiWin
        Write-Host "  [TUI] TUI launched async." -ForegroundColor Gray
    }

    $edgeExe = $null
    $candPaths = @(
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    )
    foreach ($cand in $candPaths) {
        if ($cand -and (Test-Path -LiteralPath $cand)) { $edgeExe = $cand; break }
    }
    if (-not $edgeExe) {
        $edgeCmd = Get-Command "msedge.exe" -ErrorAction SilentlyContinue
        if ($edgeCmd -and $edgeCmd.Source) { $edgeExe = $edgeCmd.Source }
    }
    if (-not $edgeExe) {
        $chromeCmd = Get-Command "chrome.exe" -ErrorAction SilentlyContinue
        if ($chromeCmd -and $chromeCmd.Source) { $edgeExe = $chromeCmd.Source }
    }
    if (-not $edgeExe) {
        $edgeExe = "msedge.exe"
        Write-Host "  [WARN] Edge/Chrome not found on disk; trying msedge.exe on PATH." -ForegroundColor Yellow
    }

    # openclaw.json からトークンを動的に読み込む（リポジトリ優先、次に desktop 同期、最後にユーザ既定）
    $gwToken = $null
    $ocCandidates = @(
        (Join-Path $ProjectDir "openclaw.json"),
        (Join-Path $ProjectDir ".openclaw-desktop\openclaw.json"),
        (Join-Path $env:USERPROFILE ".openclaw\openclaw.json")
    )
    foreach ($ocJsonPath in $ocCandidates) {
        if (-not (Test-Path -LiteralPath $ocJsonPath)) { continue }
        try {
            $ocCfg = Get-Content $ocJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
            $gwToken = [string]$ocCfg.gateway.auth.token
            if ($gwToken) { break }
        } catch { }
    }
    if (-not $gwToken) { $gwToken = $env:OPENCLAW_GATEWAY_TOKEN }

    $baseUrl = "http://127.0.0.1:$GatewayPort"
    if (-not [string]::IsNullOrWhiteSpace([string]$env:OPENCLAW_PUBLIC_URL)) {
        $baseUrl = [string]$env:OPENCLAW_PUBLIC_URL
    }
    if ($gwToken) {
        $edgeUrl = "{0}?token={1}" -f $baseUrl, $gwToken
    } else {
        $edgeUrl = $baseUrl
    }

    # Full (local): wait for gateway before browser. Full-Docker: skip browser if compose failed.
    $launchEdge = $true
    if ($Mode -eq "Full-Docker" -and -not $dockerComposeUpOk) {
        $launchEdge = $false
    }
    if ($Mode -eq "Full") {
        if ([string]$env:OPENCLAW_USE_REPO_LAUNCHER -eq "0") {
            $gwLauncherLogDir = Join-Path $ProjectDir ".openclaw-desktop\logs"
        } else {
            $gwLauncherLogDir = Join-Path $ProjectDir "logs\launcher"
        }
        Write-Host ("  [HINT] Gateway transcript logs: {0}\gateway-*.log" -f $gwLauncherLogDir) -ForegroundColor DarkGray
        $gwReadyLocal = Wait-Port -Port $GatewayPort -Label "Gateway" -MaxSeconds 120 -PollMs 1000
        if (-not $gwReadyLocal -and $StrictGatewayWait) {
            Write-Host "  [ERROR] Gateway did not start. Aborting browser launch." -ForegroundColor Red
            $launchEdge = $false
        } elseif (-not $gwReadyLocal) {
            Write-Host "  [WARN] Gateway not ready yet; opening browser anyway..." -ForegroundColor Yellow
        }
        if (-not $gwReadyLocal) {
            $latestGwLog = Get-ChildItem -Path $gwLauncherLogDir -Filter "gateway-*.log" -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending | Select-Object -First 1
            if ($latestGwLog) {
                Write-Host ("  [HINT] Latest gateway log: {0}" -f $latestGwLog.FullName) -ForegroundColor DarkGray
            }
        }
    }

    if ($launchTuiAfterGatewayWait) {
        $tuiWinFull = "Normal"
        if ([string]$env:OPENCLAW_MINIMIZE_LAUNCHERS -eq "1") { $tuiWinFull = "Minimized" }
        Start-Process -FilePath "powershell.exe" -ArgumentList @(
            "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $tuiPs1
        ) -WorkingDirectory $ProjectDir -WindowStyle $tuiWinFull
        Write-Host "  [TUI] TUI launched after Gateway wait." -ForegroundColor Gray
    }

    if ($launchEdge) {
        $edgeApp = "--app=$edgeUrl"
        try {
            Start-Process -FilePath $edgeExe -ArgumentList @('--new-window', $edgeApp) -ErrorAction Stop
            if ($gwToken) {
                Write-Host "  [EDGE] Browser launched (token injected)." -ForegroundColor Gray
            } else {
                Write-Host "  [EDGE] Browser launched (no token)." -ForegroundColor Yellow
            }
        } catch {
            Write-Host ("  [WARN] Could not start Edge: {0}" -f $_) -ForegroundColor Yellow
        }
    } elseif ($Mode -eq "Full-Docker" -and -not $dockerComposeUpOk) {
        Write-Host "  [EDGE] Skipped (fix docker compose / image, then re-run)." -ForegroundColor DarkGray
    }
}

# --- [Shortcut Management] ---
$openClawLnk = Join-Path $env:USERPROFILE "Desktop\OpenClaw.lnk"
$shortcutInstaller = Join-Path $ProjectDir "scripts\launchers\openclaw-desktop\Install-OpenClawDesktopShortcuts.ps1"
$needLnk = $ForceShortcutUpdate -or -not (Test-Path -LiteralPath $openClawLnk)
if ($needLnk -and (Test-Path -LiteralPath $shortcutInstaller)) {
    try {
        & $shortcutInstaller -ProjectRoot $ProjectDir -Force:$ForceShortcutUpdate
        Write-Host "  [LNK] Desktop shortcut: OpenClaw.lnk" -ForegroundColor Gray
    } catch {
        Write-Host ("  [LNK] Shortcut install skipped: {0}" -f $_) -ForegroundColor DarkYellow
    }
}

Write-Host ''
Write-Host '  [ASI_ACCEL] Manifestation Sustained. Sync Complete.' -ForegroundColor Green
Write-Host '  [EXIT]  Portal manifest complete.' -ForegroundColor Cyan
