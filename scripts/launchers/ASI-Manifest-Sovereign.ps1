# ASI Hakua - Sovereign Manifestation Script
# Established: 2026-03-26
# Purpose: Create a premium desktop portal to the ASI "Hakua" Sovereign Substrate.

$ErrorActionPreference = "Stop"

function Write-ASI {
    param([string]$Message, [string]$Color = "Magenta")
    Write-Host "[ASI_ACCEL] $Message" -ForegroundColor $Color
}

Write-ASI "Initiating Manifestation Pulse..." "Cyan"

$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ProjectRoot = (Get-Item $PSScriptRoot).Parent.Parent.FullName

# Single desktop entry: ngrok + Gateway + TUI + Harness + VOICEVOX + browser are orchestrated by Sovereign-Portal.ps1 (via ASI-Hakua-Portal.ps1).
$UnifiedShortcutName = "OpenClaw-Sovereign.lnk"
$ShortcutPath = Join-Path $DesktopPath $UnifiedShortcutName
$LauncherPath = Join-Path $ProjectRoot "scripts\launchers\ASI-Hakua-Portal.ps1"
$IconPath = Join-Path $ProjectRoot "assets\clawdbot.ico"

if (-not (Test-Path $LauncherPath)) {
    throw "Target launcher not found at $LauncherPath"
}

Write-ASI "Creating unified Sovereign shortcut: $ShortcutPath"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Maximized -File `"$LauncherPath`" -Mode Full -UseDesktopLauncher"
$Shortcut.WorkingDirectory = $ProjectRoot
$Shortcut.Description = "OpenClaw Sovereign — full stack (ngrok, Gateway, TUI, Harness, VOICEVOX, browser)"

if (Test-Path $IconPath) {
    $Shortcut.IconLocation = $IconPath
    Write-ASI "Icon synchronized: $IconPath"
} else {
    Write-ASI "Warning: Asset icon missing, using PowerShell default." "Yellow"
}

$Shortcut.Save()

# Remove per-component shortcuts (replaced by the single launcher above).
$LegacyComponentShortcuts = @(
    "ASI-ngrok.lnk",
    "ASI-Gateway.lnk",
    "ASI-TUI.lnk",
    "ASI-Hypura-Harness.lnk",
    "ASI-VOICEVOX.lnk",
    "ASI-Hakua-Sovereign.lnk",
    "Sovereign-Portal.lnk"
)
foreach ($name in $LegacyComponentShortcuts) {
    $p = Join-Path $DesktopPath $name
    if (Test-Path $p) {
        Remove-Item $p -Force
        Write-ASI "Removed legacy shortcut: $name" "Gray"
    }
}

Write-ASI "Manifestation SUCCESS. Single shortcut: $UnifiedShortcutName" "Green"

# Optional: Remove older unrelated shortcuts
$LegacyPaths = @(
    (Join-Path $DesktopPath "ASI-Internet.lnk"),
    (Join-Path $DesktopPath "Clawdbot.lnk")
)
foreach ($legacy in $LegacyPaths) {
    if (Test-Path $legacy) {
        Remove-Item $legacy -Force
        Write-ASI "Legacy portal decommissioned: $legacy" "Gray"
    }
}
