# Installs a single desktop shortcut (OpenClaw.lnk). Launcher PS1 files live under scripts/launchers/openclaw-desktop/.
param(
    [Parameter(Mandatory = $false)]
    [string]$ProjectRoot = (Get-Item $PSScriptRoot).Parent.Parent.Parent.FullName,
    [switch]$Force,
    [switch]$PreferPwsh,
    # Kept for backward compatibility with older callers; ignored (no extra shortcuts).
    [switch]$IncludeCompanion,
    [switch]$LegacyAliases
)

$ErrorActionPreference = "Stop"

function Resolve-OpenClawPowerShellExe {
    param([switch]$UsePwsh)
    if ($UsePwsh) {
        $pwsh = Get-Command pwsh -ErrorAction SilentlyContinue
        if ($pwsh) {
            return $pwsh.Source
        }
        Write-Host "[shortcuts] pwsh not found; using powershell.exe" -ForegroundColor DarkYellow
    }
    return "powershell.exe"
}

$ShellExe = Resolve-OpenClawPowerShellExe -UsePwsh:$PreferPwsh
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$IconPath = Join-Path $ProjectRoot "assets\clawdbot.ico"
$HasIcon = Test-Path -LiteralPath $IconPath

$stackPs1 = Join-Path $ProjectRoot "scripts\launchers\openclaw-desktop\launch-desktop-stack.ps1"
if (-not (Test-Path -LiteralPath $stackPs1)) {
    throw "Stack launcher not found: $stackPs1"
}

$stackArgsFull =
    '-NoProfile -ExecutionPolicy Bypass -WindowStyle Normal -File "{0}" -ForceVisibleGatewayAndTui -SpeakOnReady -HypuraWaitSeconds 180 -HypuraHarnessWaitSeconds 45' -f $stackPs1

$obsoleteDesktopLnks = @(
    "OpenClaw-Sovereign.lnk",
    "OpenClaw-Desktop-Stack.lnk",
    "OpenClaw-Refresh-Shortcuts.lnk",
    "OpenClaw-Companion-Light.lnk",
    "OpenClaw-Companion-Only.lnk",
    "Install Shortcuts.lnk",
    "Clawdbot.lnk",
    "Hakua Companion.lnk",
    "Hakua Companion Only.lnk",
    "Clawdbot-Master.lnk",
    "OpenClaw Desktop Stack.lnk",
    "OpenClaw Launcher.lnk",
    "Hakua.lnk",
    "Hakua Neural Link.lnk",
    "Hakua Link.lnk",
    "HAKUA_CORE.lnk",
    "ASI-Internet.lnk",
    "ASI-ngrok.lnk",
    "ASI-Gateway.lnk",
    "ASI-TUI.lnk",
    "ASI-Hypura-Harness.lnk",
    "ASI-VOICEVOX.lnk",
    "ASI-Hakua-Sovereign.lnk",
    "Sovereign-Portal.lnk"
)

foreach ($name in $obsoleteDesktopLnks) {
    $p = Join-Path $DesktopPath $name
    if (Test-Path -LiteralPath $p) {
        Remove-Item -LiteralPath $p -Force
        Write-Host "[shortcuts] removed obsolete: $name" -ForegroundColor DarkGray
    }
}

$targetLnk = Join-Path $DesktopPath "OpenClaw.lnk"
if (-not $Force -and (Test-Path -LiteralPath $targetLnk)) {
    Write-Host "[shortcuts] OpenClaw.lnk exists; use -Force to rewrite" -ForegroundColor Yellow
    exit 0
}

$sc = $WshShell.CreateShortcut($targetLnk)
$sc.TargetPath = $ShellExe
$sc.Arguments = $stackArgsFull
$sc.WorkingDirectory = $ProjectRoot
$sc.Description = "OpenClaw — full desktop stack (Gateway, TUI, ngrok, Hypura, VOICEVOX, browser)."
if ($HasIcon) { $sc.IconLocation = $IconPath }
$sc.Save()
Write-Host "[LNK] OpenClaw.lnk  (single desktop entry; PS1 under scripts\launchers\openclaw-desktop\)" -ForegroundColor Green
