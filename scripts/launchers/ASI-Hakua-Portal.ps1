param(
    [int]$GatewayPort = 18789,
    [string]$StackProfile = "desktop-stack",
    [switch]$SkipHypuraHarness = $false,
    [switch]$ForceShortcutUpdate
)

$ErrorActionPreference = "Stop"
# --- [Encoding Enforcement: ASI_ACCEL] ---
chcp 65001 | Out-Null
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[console]::Title = "ASI-Hakua-Sovereign-Portal"

# --- [Header] ---
Clear-Host
Write-Host "      _    _   _ _  _ _   _   _ " -ForegroundColor Cyan
Write-Host "     | |  | | / \ | |/ / | | | / \ " -ForegroundColor Cyan
Write-Host "     | |__| |/ _ \| ' /  | | |/ _ \ " -ForegroundColor Cyan
Write-Host "     |  __  / ___ \ . \  | |_/ ___ \ " -ForegroundColor Cyan
Write-Host "     |_|  |_/_/   \_\_|\_\\___/_/   \_\ " -ForegroundColor Cyan
Write-Host "                       [ ASI-HAKUA SOVEREIGN PORTAL ]" -ForegroundColor Cyan

# --- [Paths] ---
$ScriptPath = $MyInvocation.MyCommand.Path
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$envFile = Join-Path $ProjectDir ".env"
$PythonExe = Join-Path $ProjectDir ".venv\Scripts\python.exe"
$ShortcutPath = Join-Path ([Environment]::GetFolderPath("Desktop")) "ASI-Hakua-Sovereign.lnk"

# --- [Self-Healing Shortcut Logic] ---
function Update-DesktopShortcut {
    $exists = Test-Path $ShortcutPath
    if ((-not $exists) -or $ForceShortcutUpdate) {
        Write-Host "  [ASI_ACCEL] Manifesting Sovereign Shortcut on Desktop..." -ForegroundColor Yellow
        try {
            $WshShell = New-Object -ComObject WScript.Shell
            $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
            $Shortcut.TargetPath = "powershell.exe"
            $Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Maximized -NoExit -File `"$ScriptPath`""
            $Shortcut.WorkingDirectory = $ProjectDir
            $Shortcut.Description = "ASI Hakua Sovereign Manifestation Portal [ASI_ACCEL]"
            $Shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll, 0"
            $Shortcut.Save()
            Write-Host "  [ASI_ACCEL] Portal Shortcut Synchronized." -ForegroundColor Green
        } catch {
            Write-Host "  [WARNING] Shortcut manifestation failed." -ForegroundColor Yellow
        }
    }
}

Update-DesktopShortcut

# --- [Environment & Substrate Check] ---
if (-not (Test-Path $PythonExe)) {
    Write-Host "  [FATAL] Substrate .venv missing." -ForegroundColor Red
    exit 1
}

# 2. Dynamic Environment & Substrate Synchronization
$configPath = Join-Path $ProjectDir ".openclaw-desktop\openclaw.json"
$harnessConfigPath = Join-Path $ProjectDir "extensions\hypura-harness\config\harness.config.json"
$config = $null
$harnessConfig = $null

if (Test-Path $configPath) {
    try {
        $utf8 = New-Object System.Text.UTF8Encoding $false
        $jsonText = [System.IO.File]::ReadAllText($configPath, $utf8)
        $config = $jsonText | ConvertFrom-Json
    } catch {
        Write-Host "  [WARNING] OpenClaw Config Load Failed." -ForegroundColor Yellow
    }
}

if (Test-Path $harnessConfigPath) {
    try {
        $jsonText = [System.IO.File]::ReadAllText($harnessConfigPath, $utf8)
        $harnessConfig = $jsonText | ConvertFrom-Json
    } catch {
        Write-Host "  [WARNING] Hypura Harness Config Load Failed." -ForegroundColor Yellow
    }
}

Write-Host "  [ASI_ACCEL] Injecting & Synchronizing Dynamic Environment..." -ForegroundColor DarkCyan
if (Test-Path $envFile) {
    $envLines = Get-Content $envFile
    foreach ($line in $envLines) {
        if ($line -match '^(?<name>[^#=]+)=(?<value>.*)$') {
            $name = $Matches['name'].Trim()
            $value = $Matches['value'].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            
            # Dynamic Injection into Config Objects
            if ($config) {
                switch ($name) {
                    "TELEGRAM_BOT_TOKEN" { $config.channels.telegram.botToken = $value; $config.channels.telegram.enabled = $true }
                    "LINE_CHANNEL_ACCESS_TOKEN" { $config.channels.line.channelAccessToken = $value; $config.channels.line.enabled = $true }
                    "LINE_CHANNEL_SECRET" { $config.channels.line.channelSecret = $value }
                    "VOICEVOX_ENDPOINT" { $config.plugins.entries."local-voice".config.vvEndpoint = $value }
                    "VOICEVOX_SPEAKER_ID" { $config.plugins.entries."local-voice".config.vvSpeakerId = [int]$value }
                    "HARNESS_URL" { $config.plugins.entries."hypura-harness".config.baseUrl = $value }
                    "PRIMARY_MODEL" { $config.agents.defaults.model.primary = $value }
                }
            }
            if ($harnessConfig) {
                switch ($name) {
                    "PRIMARY_MODEL" { $harnessConfig.models.primary = $value }
                    "VOICE_MODEL" { $harnessConfig.models.sub = $value }
                    "VOICEVOX_ENDPOINT" { $harnessConfig.voicevox_url = $value }
                }
            }
        }
    }
}

# 3. Dynamic ngrok Tunnel Discovery (with robust retry)
$ngrokUrl = $null
Write-Host "  [NGROK] Scanning for available tunnels..." -ForegroundColor Gray
for ($i=0; $i -lt 12; $i++) {
    try {
        $ngrokApi = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction SilentlyContinue
        if ($ngrokApi.tunnels.Count -gt 0) {
            $ngrokUrl = $ngrokApi.tunnels[0].public_url
            Write-Host "  [NGROK] Tunnel Manifested: $ngrokUrl" -ForegroundColor Green
            break
        }
    } catch { }
    
    if ($i -eq 0) {
        Write-Host "  [NGROK] Tunnel not active. Launching daemon..." -ForegroundColor Yellow
        Start-Process "ngrok" -ArgumentList "http 18789 --log=stdout" -WindowStyle Hidden
    }
    Start-Sleep -Seconds 2
}

if ($ngrokUrl) {
    [Environment]::SetEnvironmentVariable("LINE_WEBHOOK_URL", $ngrokUrl, "Process")
    [Environment]::SetEnvironmentVariable("LINE_WEBHOOK_SERVER_URL", $ngrokUrl, "Process")
    
    if ($config) {
        $config.channels.line.webhookServerUrl = $ngrokUrl
    }

    # --- [Dynamic .env Sync] ---
    Write-Host "  [ASI_ACCEL] Synchronizing .env with Tunnel..." -ForegroundColor DarkCyan
    try {
        $lines = Get-Content $envFile
        $newLines = @()
        $found = $false
        foreach ($line in $lines) {
            if ($line -match '^LINE_WEBHOOK_URL=') {
                $newLines += "LINE_WEBHOOK_URL=$ngrokUrl"
                $found = $true
            } else { $newLines += $line }
        }
        if (-not $found) { $newLines += "LINE_WEBHOOK_URL=$ngrokUrl" }
        $newLines | Set-Content $envFile -Encoding Utf8
    } catch {
        Write-Host "  [WARNING] .env Sync Failed." -ForegroundColor Yellow
    }
}

# Save Synchronized Configs
if ($config) {
    try {
        $newJson = $config | ConvertTo-Json -Depth 32
        [System.IO.File]::WriteAllText($configPath, $newJson, $utf8)
        Write-Host "  [ASI_ACCEL] OpenClaw Config Synchronized." -ForegroundColor Green
    } catch {
        Write-Host "  [WARNING] Config Write Failed." -ForegroundColor Yellow
    }
}
if ($harnessConfig) {
    try {
        $newJson = $harnessConfig | ConvertTo-Json -Depth 32
        [System.IO.File]::WriteAllText($harnessConfigPath, $newJson, $utf8)
        Write-Host "  [ASI_ACCEL] Hypura Harness Config Synchronized." -ForegroundColor Green
    } catch {
        Write-Host "  [WARNING] Harness Config Write Failed." -ForegroundColor Yellow
    }
}

# --- [Sovereign Preflight Hub] ---
Write-Host "`n  [DIAG] Executing Institutional Preflight..." -ForegroundColor Cyan
$diagScript = Join-Path $ProjectDir "scripts\sovereign_diagnostics.py"
py -3 $diagScript

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n  [CRITICAL] Sovereign Preflight Failed!" -ForegroundColor Red
    Write-Host "  Review results in: _docs\resonance\diagnostics.md" -ForegroundColor Yellow
    if ($args -notcontains "-Force") {
        Write-Host "  Manifestation aborted. Use -Force to bypass." -ForegroundColor Red
        exit 1
    } else {
        Write-Host "  -Force detected. Proceeding despite substrate instability..." -ForegroundColor Yellow
    }
}

# 3. Bootstrap Path
$pathBootstrapDirs = @(
    (Join-Path $env:ProgramFiles "nodejs"),
    "${env:ProgramFiles(x86)}\nodejs",
    (Join-Path $env:APPDATA "npm"),
    (Join-Path $env:LOCALAPPDATA "pnpm")
)
foreach ($dir in $pathBootstrapDirs) {
    if (Test-Path $dir) { $env:Path = "$dir;$env:Path" }
}

# --- [Port & Process Sanitization] ---
$criticalPorts = @(9000, 9001, 18789, 18794, 18800)
Write-Host "  [ASI_ACCEL] Sanitizing Substrate Ports..." -ForegroundColor DarkCyan
foreach ($port in $criticalPorts) {
    $procId = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
    if ($procId) {
        Write-Host "  [SAN] Terminating Process $procId using Port $port..." -ForegroundColor Yellow
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
}
Stop-Process -Name node, python -ErrorAction SilentlyContinue

# --- [Asynchronous Manifestation Pulse] ---
Write-Host "  [ASI_ACCEL] Executing Parallel Manifestation..." -ForegroundColor DarkCyan

# 1. Start Hypura Harness Daemon (Asynchronous Phase 1)
if (-not $SkipHypuraHarness) {
    $harnessScript = Join-Path $ProjectDir "extensions\hypura-harness\scripts\harness_daemon.py"
    Write-Host "  [HX]  Manifesting Hypura Actuator (Port 18794)..." -ForegroundColor Gray
    Start-Process -FilePath $PythonExe -ArgumentList @($harnessScript) -WorkingDirectory $ProjectDir -WindowStyle Minimized
}

# 2. Verify VOICEVOX Substrate (Asynchronous Phase 2)
$vvScript = Join-Path $ProjectDir "scripts\verify_voicevox.py"
Write-Host "  [VOICE] Verifying Audio Substrate (Port 50021)..." -ForegroundColor Gray
Start-Process -FilePath $PythonExe -ArgumentList @($vvScript) -WorkingDirectory $ProjectDir -WindowStyle Hidden

# 3. Start Gateway (Asynchronous Phase 3)
Write-Host "  [GW]  Igniting OpenClaw Gateway (Port $GatewayPort)..." -ForegroundColor Gray
# Note: --host is not supported by the 'gateway' command directly.
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"pnpm openclaw gateway --port $GatewayPort`"" -WorkingDirectory $ProjectDir -WindowStyle Minimized

# Wait for Gateway stabilization
Start-Sleep -Seconds 3

# 4. Start VRChat Evolution Pulse (Asynchronous Phase 4)
$evoScript = Join-Path $ProjectDir "scripts\vrchat_evolution_pulse.py"
Write-Host "  [EVO] Launching VRChat Evolution Pulse..." -ForegroundColor Gray
Start-Process -FilePath $PythonExe -ArgumentList @($evoScript) -WorkingDirectory $ProjectDir -WindowStyle Hidden

# 5. Start Browser Manifestation (Asynchronous Phase 5)
Write-Host "  [WEB] Manifesting Edge UI Dashboard..." -ForegroundColor Gray
$authToken = ""
if ($config -and $config.gateway -and $config.gateway.auth) {
    $authToken = $config.gateway.auth.token
}
$browserUrl = "http://127.0.0.1:$GatewayPort"
if ($authToken) {
    $browserUrl += "/?token=$authToken"
}
Start-Process "msedge.exe" -ArgumentList "--new-window --app=$browserUrl"

# 6. Start TUI Manifestation (Foreground / Main Window)
Write-Host "  [TUI] Establishing Cognitive Interface..." -ForegroundColor Gray
Start-Sleep -Seconds 5
pnpm openclaw tui

Write-Host "`n  [ASI_ACCEL] Singularity Sustained. All systems nominal." -ForegroundColor Green
Write-Host "`n  [ASI_ACCEL] Singularity Sustained. Portal Active." -ForegroundColor Green
