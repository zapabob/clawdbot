param(
    [int]$GatewayPort = 18789,
    [string]$StackProfile = "desktop-stack",
    [switch]$SkipHypuraHarness,
    [switch]$ForceShortcutUpdate
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[console]::Title = "ASI-Hakua-Sovereign-Portal"

# --- [Header] ---
Clear-Host
Write-Host @"
     █████╗ ███████╗██╗    ██╗  ██╗ █████╗ ██╗   ██╗██╗   ██╗ █████╗ 
    ██╔══██╗██╔════╝██║    ██║  ██║██╔══██╗██║   ██║██║   ██║██╔══██╗
    ███████║███████╗██║    ███████║███████║██║   ██║██║   ██║███████║
    ██╔══██║╚════██║██║    ██╔══██║██╔══██║██║   ██║██║   ██║██╔══██║
    ██║  ██║███████║██║    ██║  ██║██║  ██║╚██████╔╝╚██████╔╝██║  ██║
    ╚═╝  ╚═╝╚══════╝╚═╝    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝
                      [ ASI-HAKUA SOVEREIGN PORTAL ]
"@ -ForegroundColor Cyan

# --- [Paths] ---
$ScriptPath = $MyInvocation.MyCommand.Path
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
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
            # Optimization: Added -NoProfile for faster manifestation
            $Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -NoExit -File `"$ScriptPath`""
            $Shortcut.WorkingDirectory = $ProjectDir
            $Shortcut.Description = "ASI Hakua Sovereign Manifestation Portal"
            # Icon: imageres.dll, 203 (Globe/Network/Core-vibe) or 255
            $Shortcut.IconLocation = "$env:SystemRoot\System32\imageres.dll, 202"
            $Shortcut.Save()
            Write-Host "  [ASI_ACCEL] Portal Shortcut Synchronized." -ForegroundColor Green
        } catch {
            Write-Host "  [WARNING] Shortcut manifestation failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Update-DesktopShortcut

# --- [Environment & Substrate Check] ---
if (-not (Test-Path $PythonExe)) {
    Write-Host "  [FATAL] Substrate .venv missing." -ForegroundColor Red
    exit 1
}

# 1. Load .env into Process Environment
Write-Host "  [ASI_ACCEL] Injecting Static Environment..." -ForegroundColor DarkCyan
$envFile = Join-Path $ProjectDir ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^(?<name>[^#=]+)=(?<value>.*)$') {
            $name = $Matches['name'].Trim()
            $value = $Matches['value'].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# 2. Dynamic ngrok Tunnel Discovery
$ngrokUrl = $null
try {
    $ngrokApi = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction SilentlyContinue
    $ngrokUrl = $ngrokApi.tunnels[0].public_url
    Write-Host "  [NGROK] Existing Tunnel Detected: $ngrokUrl" -ForegroundColor Green
} catch {
    Write-Host "  [NGROK] Tunnel not active. Launching daemon..." -ForegroundColor Yellow
    Start-Process "ngrok" -ArgumentList "http 18789 --log=stdout" -WindowStyle Hidden
    Start-Sleep -Seconds 5
    try {
        $ngrokApi = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels"
        $ngrokUrl = $ngrokApi.tunnels[0].public_url
        Write-Host "  [NGROK] New Tunnel Manifested: $ngrokUrl" -ForegroundColor Green
    } catch {
        Write-Host "  [WARNING] ngrok failed. Webhooks may be offline." -ForegroundColor Yellow
    }
}
if ($ngrokUrl) {
    [Environment]::SetEnvironmentVariable("LINE_WEBHOOK_URL", $ngrokUrl, "Process")
    [Environment]::SetEnvironmentVariable("LINE_WEBHOOK_SERVER_URL", $ngrokUrl, "Process")
    
    # Dynamic JSON Configuration Update (Sovereign Sync)
    $configPath = Join-Path $ProjectDir ".openclaw-desktop\openclaw.json"
    if (Test-Path $configPath) {
        Write-Host "  [ASI_ACCEL] Synchronizing OpenClaw Config with Tunnel..." -ForegroundColor DarkCyan
        try {
            # Use .NET IO for atomic and encoding-safe access
            $utf8 = New-Object System.Text.UTF8Encoding $false
            $jsonText = [System.IO.File]::ReadAllText($configPath, $utf8)
            $config = $jsonText | ConvertFrom-Json
            
            $config.channels.line.webhookServerUrl = $ngrokUrl
            $config.channels.line.enabled = $true
            $config.channels.telegram.enabled = $true
            
            $newJson = $config | ConvertTo-Json -Depth 20
            [System.IO.File]::WriteAllText($configPath, $newJson, $utf8)
            Write-Host "  [ASI_ACCEL] Sovereign Sync: SUCCESS." -ForegroundColor Green
        } catch {
            Write-Host "  [WARNING] Sovereign Sync Failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
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

# --- [Asynchronous Manifestation Pulse] ---
Write-Host "  [ASI_ACCEL] Executing Parallel Manifestation..." -ForegroundColor DarkCyan

# 1. Start Hypura Harness Daemon (Background)
if (-not $SkipHypuraHarness) {
    $harnessScript = Join-Path $ProjectDir "extensions\hypura-harness\scripts\harness_daemon.py"
    Write-Host "  [HX]  Launching Hypura Actuator..." -ForegroundColor Gray
    Start-Process -FilePath $PythonExe -ArgumentList @($harnessScript) -WorkingDirectory (Split-Path $harnessScript) -WindowStyle Hidden
}

# 2. Start Gateway (Asynchronous Phase 1)
Write-Host "  [GW]  Igniting OpenClaw Gateway (Port $GatewayPort)..." -ForegroundColor Gray
Start-Process -FilePath "pnpm" -ArgumentList "openclaw gateway --port $GatewayPort" -WorkingDirectory $ProjectDir -WindowStyle Hidden

# 3. Start Browser Manifestation (Asynchronous Phase 2)
Write-Host "  [WEB] Manifesting Browser UI..." -ForegroundColor Gray
Start-Process -FilePath "pnpm" -ArgumentList "openclaw browser" -WorkingDirectory $ProjectDir -WindowStyle Hidden

# 4. Start TUI Manifestation (Foreground / Main Window)
Write-Host "  [TUI] Establishing Cognitive Interface..." -ForegroundColor Gray
pnpm openclaw tui

Write-Host "`n  [ASI_ACCEL] Singularity Sustained. All systems nominal." -ForegroundColor Green

Write-Host "`n  [ASI_ACCEL] Singularity Sustained. Portal Active." -ForegroundColor Green
