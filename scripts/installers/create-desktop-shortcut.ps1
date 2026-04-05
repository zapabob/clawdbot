#Requires -Version 5.1
# ============================================================
#  create-desktop-shortcut.ps1
#  Delegates to scripts/launchers/openclaw-desktop/Install-OpenClawDesktopShortcuts.ps1
#  (single source of truth), then removes obsolete shortcut names.
# ============================================================

[CmdletBinding()]
param(
    [string]$DesktopPath = [System.Environment]::GetFolderPath("Desktop"),
    [switch]$PreferPwsh
)

$ErrorActionPreference = "Stop"
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$Unified = Join-Path $ProjectDir "scripts\launchers\openclaw-desktop\Install-OpenClawDesktopShortcuts.ps1"

if (-not (Test-Path -LiteralPath $Unified)) {
    throw "Unified installer not found: $Unified"
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host "  OpenClaw Desktop Shortcuts (unified)"   -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host ""

& $Unified -ProjectRoot $ProjectDir -Force -IncludeCompanion -LegacyAliases -PreferPwsh:$PreferPwsh

$LegacyNames = @(
    "Clawdbot-Master.lnk",
    "OpenClaw Desktop Stack.lnk",
    "OpenClaw Launcher.lnk",
    "OpenClaw-Launcher.bat",
    "OpenClaw-All-In-One.bat",
    "Hakua.lnk",
    "Hakua Neural Link.lnk",
    "Hakua Link.lnk",
    "ASI_Manifestation.bat",
    "HAKUA_CORE.lnk",
    "OpenClaw-Sovereign.lnk",
    "OpenClaw-Desktop-Stack.lnk",
    "OpenClaw-Refresh-Shortcuts.lnk",
    "OpenClaw-Companion-Light.lnk",
    "OpenClaw-Companion-Only.lnk",
    "Install Shortcuts.lnk",
    "Clawdbot.lnk",
    "Hakua Companion.lnk",
    "Hakua Companion Only.lnk"
)
$removedCount = 0
foreach ($name in $LegacyNames) {
    $path = Join-Path $DesktopPath $name
    if (Test-Path -LiteralPath $path) {
        Remove-Item -LiteralPath $path -Force
        Write-Host "  [removed] $name" -ForegroundColor DarkGray
        $removedCount++
    }
}
if ($removedCount -gt 0) {
    Write-Host ""
}

Write-Host "  Done. Desktop: OpenClaw.lnk only (re-run this script to refresh)." -ForegroundColor Yellow
Write-Host ""
