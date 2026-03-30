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
 
 # Target Shortcut Configuration
 $ShortcutPath = Join-Path $DesktopPath "ASI-Hakua-Sovereign.lnk"
 $LauncherPath = Join-Path $ProjectRoot "scripts\launchers\ASI-Hakua-Portal.ps1"
 $IconPath = Join-Path $ProjectRoot "assets\clawdbot.ico"
 
 if (-not (Test-Path $LauncherPath)) {
     throw "Target launcher not found at $LauncherPath"
 }
 
 Write-ASI "Creating Sovereign Portal: $ShortcutPath"
 
 $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
 $Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Maximized -File `"$LauncherPath`" -Mode Full -UseDesktopLauncher"
 $Shortcut.WorkingDirectory = $ProjectRoot
$Shortcut.Description = "ASI Hakua - Sovereign Substrate (Full Stack + Evolution Pulse)"

if (Test-Path $IconPath) {
    $Shortcut.IconLocation = $IconPath
    Write-ASI "Icon synchronized: $IconPath"
} else {
    Write-ASI "Warning: Asset icon missing, using PowerShell default." "Yellow"
}

$Shortcut.Save()

function New-ASIDesktopShortcut {
    param(
        [string]$LinkName,
        [string]$PsArguments,
        [string]$Description
    )
    $path = Join-Path $DesktopPath "$LinkName.lnk"
    $sc = $WshShell.CreateShortcut($path)
    $sc.TargetPath = "powershell.exe"
    $sc.Arguments = $PsArguments
    $sc.WorkingDirectory = $ProjectRoot
    $sc.Description = $Description
    if (Test-Path $IconPath) {
        $sc.IconLocation = $IconPath
    }
    $sc.Save()
    Write-ASI "Shortcut: $path" "Gray"
}

$ngrokLauncher = Join-Path $ProjectRoot "scripts\launchers\start_ngrok.ps1"
$gwLauncher = Join-Path $ProjectRoot "scripts\launchers\Start-Gateway.ps1"
$tuiLauncher = Join-Path $ProjectRoot "scripts\launchers\Start-TUI.ps1"
$harnessLauncher = Join-Path $ProjectRoot "scripts\launchers\Start-Hypura-Harness.ps1"
$voicevoxLauncher = Join-Path $ProjectRoot "scripts\launchers\start-voicevox-engine.ps1"

New-ASIDesktopShortcut "ASI-ngrok" "-NoProfile -ExecutionPolicy Bypass -File `"$ngrokLauncher`"" "ngrok tunnel + .env URL (404 API)"
New-ASIDesktopShortcut "ASI-Gateway" "-NoProfile -ExecutionPolicy Bypass -File `"$gwLauncher`"" "OpenClaw Gateway (OPENCLAW_CONFIG_PATH)"
New-ASIDesktopShortcut "ASI-TUI" "-NoProfile -ExecutionPolicy Bypass -File `"$tuiLauncher`"" "OpenClaw TUI"
New-ASIDesktopShortcut "ASI-Hypura-Harness" "-NoProfile -ExecutionPolicy Bypass -File `"$harnessLauncher`"" "Hypura harness daemon (18794)"
New-ASIDesktopShortcut "ASI-VOICEVOX" "-NoProfile -ExecutionPolicy Bypass -File `"$voicevoxLauncher`"" "VOICEVOX ENGINE :50021 + verify_voicevox.py"

Write-ASI "Manifestation SUCCESS. Portal active on Desktop." "Green"

# Optional: Remove legacy shortcuts for clarity
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
