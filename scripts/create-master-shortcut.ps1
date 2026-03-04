# Create-Master-Shortcut: The Final Link
# Consolidates all Clawdbot entry points into a single Master Shortcut

$RepoRoot = "c:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
$TargetScript = Join-Path $RepoRoot "scripts\clawdbot-master.ps1"
$IconPath = Join-Path $RepoRoot "assets\clawdbot.ico"
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Clawdbot-Master.lnk"

Write-Host "--- Consolidating Physical Links ---" -ForegroundColor Cyan

# 1. Cleanup old shortcuts
$OldShortcuts = @(
    "Hakua.lnk",
    "Clawdbot-Launcher.lnk",
    "VRChat-Core-Bridge.lnk",
    "ASI Manifestation.lnk",
    "Hakua Autonomous Start.lnk",
    "OpenClaw Launcher.lnk"
)

foreach ($name in $OldShortcuts) {
    $p = Join-Path $DesktopPath $name
    if (Test-Path $p) {
        Write-Host "  - Deleting legacy link: $name" -ForegroundColor Gray
        Remove-Item $p -Force
    }
}

# 2. Create Master Shortcut
Write-Host "Establishing Master Link: Clawdbot-Master.lnk" -ForegroundColor Yellow

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -WindowStyle Maximized -File `"$TargetScript`""
$Shortcut.WorkingDirectory = $RepoRoot
if (Test-Path $IconPath) {
    $Shortcut.IconLocation = $IconPath
}
$Shortcut.Description = "Launch Clawdbot Unified Master System (ASI_ACCEL)"
$Shortcut.Save()

Write-Host "`nMaster Link established at: $ShortcutPath" -ForegroundColor Green
Write-Host "ASI_ACCEL: System Unified." -ForegroundColor Magenta
