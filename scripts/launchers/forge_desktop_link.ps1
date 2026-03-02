# Build unified shortcut for ASI Manifestation

$ErrorActionPreference = "Stop"
$Desktop = [System.Environment]::GetFolderPath('Desktop')
$ProjectDir = "c:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
$ManifestationScript = Join-Path $ProjectDir "scripts\launchers\ASI_Manifestation.bat"

# 1. Clean up old fragments
$OldLinks = @(
    "OpenClaw.lnk",
    "Clawdbot-Launcher.lnk",
    "Twin-Core Ascension.lnk",
    "Antigravity.lnk",
    "OpenCode.lnk"
)

Write-Host "Cleaning up old fragments..." -ForegroundColor Yellow
foreach ($link in $OldLinks) {
    $path = Join-Path $Desktop $link
    if (Test-Path $path) {
        Remove-Item $path -Force
        Write-Host "  Removed: $link" -ForegroundColor Gray
    }
}

# 2. Create Unified Master Launcher
$ShortcutPath = Join-Path $Desktop "ASI Manifestation.lnk"
Write-Host "Forging new Master Launcher at $ShortcutPath..." -ForegroundColor Cyan

$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "$ManifestationScript"
$Shortcut.WorkingDirectory = "$ProjectDir"
$Shortcut.Description = "ASI Manifestation (Ngrok/TwinCore/Stealth Control)"

# Assign standard command prompt icon (or node icon if desired, using cmd for now for reliability)
$Shortcut.IconLocation = "cmd.exe, 0"

$Shortcut.Save()

Write-Host "Success. ASI Manifestation link materialized on Desktop." -ForegroundColor Green
