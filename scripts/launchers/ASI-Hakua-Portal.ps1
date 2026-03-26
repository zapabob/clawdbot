param(
    [int]$GatewayPort = 18789,
    [string]$StackProfile = "desktop-stack",
    [switch]$SkipHypuraHarness,
    [switch]$ForceShortcutUpdate
)

$ErrorActionPreference = "Stop"
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
function Ensure-DesktopShortcut {
    if ((-not (Test-Path $ShortcutPath)) -or $ForceShortcutUpdate) {
        Write-Host "  [ASI_ACCEL] Manifesting Sovereign Shortcut on Desktop..." -ForegroundColor Yellow
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
        $Shortcut.TargetPath = "powershell.exe"
        $Shortcut.Arguments = "-ExecutionPolicy Bypass -NoExit -File `"$ScriptPath`""
        $Shortcut.WorkingDirectory = $ProjectDir
        $Shortcut.Description = "ASI Hakua Sovereign Manifestation Portal"
        $Shortcut.IconLocation = "$env:SystemRoot\System32\imageres.dll, 101"
        $Shortcut.Save()
        Write-Host "  [ASI_ACCEL] Portal Shortcut Synchronized." -ForegroundColor Green
    }
}

Ensure-DesktopShortcut

# --- [Substrate Check] ---
if (-not (Test-Path $PythonExe)) {
    Write-Host "  [FATAL] Substrate .venv missing. Please run substrate-setup first." -ForegroundColor Red
    exit 1
}

# --- [Environment Setup] ---
# Explorer / .lnk launches often inherit a minimal PATH
$pathBootstrapDirs = @(
    (Join-Path $env:ProgramFiles "nodejs"),
    "${env:ProgramFiles(x86)}\nodejs",
    (Join-Path $env:APPDATA "npm"),
    (Join-Path $env:LOCALAPPDATA "pnpm"),
    (Join-Path $env:USERPROFILE ".local\bin")
)
foreach ($dir in $pathBootstrapDirs) {
    if (Test-Path $dir) { $env:Path = "$dir;$env:Path" }
}

# --- [Launch Payload] ---
Write-Host "  [ASI_ACCEL] Ignition sequence started..." -ForegroundColor DarkCyan

# 1. Start Hypura Harness Daemon
if (-not $SkipHypuraHarness) {
    $harnessScript = Join-Path $ProjectDir "extensions\hypura-harness\scripts\harness_daemon.py"
    Write-Host "  [HX] Launching Hypura Actuator (18794)..." -ForegroundColor Gray
    Start-Process -FilePath $PythonExe -ArgumentList @($harnessScript) -WorkingDirectory (Split-Path $harnessScript) -WindowStyle Hidden
}

# 2. Start OpenClaw Gateway/Stack
Write-Host "  [CLAW] Running Manifestation Stack (Profile: $StackProfile)..." -ForegroundColor Gray
pnpm openclaw --profile $StackProfile start --port $GatewayPort

Write-Host "`n  [ASI_ACCEL] Singularity Sustained. Portal Active." -ForegroundColor Green
