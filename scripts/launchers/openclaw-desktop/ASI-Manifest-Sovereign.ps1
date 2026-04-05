# ASI Hakua - Sovereign Manifestation Script
# Established: 2026-03-26
# Purpose: Install the single OpenClaw desktop shortcut and remove legacy .lnk files.

$ErrorActionPreference = "Stop"

function Write-ASI {
    param([string]$Message, [string]$Color = "Magenta")
    Write-Host "[ASI_ACCEL] $Message" -ForegroundColor $Color
}

Write-ASI "Initiating Manifestation Pulse..." "Cyan"

$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ProjectRoot = (Get-Item $PSScriptRoot).Parent.Parent.Parent.FullName
$Installer = Join-Path $PSScriptRoot "Install-OpenClawDesktopShortcuts.ps1"

if (-not (Test-Path -LiteralPath $Installer)) {
    throw "Shortcut installer not found: $Installer"
}

Write-ASI "Installing single desktop shortcut OpenClaw.lnk (pwsh if available)..." "Cyan"
& $Installer -ProjectRoot $ProjectRoot -Force -PreferPwsh

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

Write-ASI "Manifestation SUCCESS. Desktop: OpenClaw.lnk only." "Green"

$LegacyPaths = @(
    (Join-Path $DesktopPath "ASI-Internet.lnk")
)
foreach ($legacy in $LegacyPaths) {
    if (Test-Path $legacy) {
        Remove-Item $legacy -Force
        Write-ASI "Legacy portal decommissioned: $legacy" "Gray"
    }
}
