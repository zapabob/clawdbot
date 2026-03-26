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
$ProjectRoot = Get-Location

# Target Shortcut Configuration
$ShortcutPath = Join-Path $DesktopPath "ASI-Hakua-Sovereign.lnk"
$LauncherPath = Join-Path $ProjectRoot "scripts\launchers\launch-desktop-stack.ps1"
$IconPath = Join-Path $ProjectRoot "assets\clawdbot.ico"

if (-not (Test-Path $LauncherPath)) {
    throw "Target launcher not found at $LauncherPath"
}

Write-ASI "Creating Sovereign Portal: $ShortcutPath"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
$Shortcut.Arguments = "-NoExit -ExecutionPolicy Bypass -File `"$LauncherPath`" -SpeakOnReady"
$Shortcut.WorkingDirectory = $ProjectRoot.Path
$Shortcut.Description = "ASI Hakua - Sovereign Substrate (Full Stack + Evolution Pulse)"

if (Test-Path $IconPath) {
    $Shortcut.IconLocation = $IconPath
    Write-ASI "Icon synchronized: $IconPath"
} else {
    Write-ASI "Warning: Asset icon missing, using PowerShell default." "Yellow"
}

$Shortcut.Save()

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
