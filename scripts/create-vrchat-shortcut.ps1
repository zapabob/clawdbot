# Create-VRChat-Shortcut: The Physical Manifestation Bridge
# Utility to create a dedicated VRChat Core Bridge Shortcut

$RepoRoot = "c:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
$TargetScript = Join-Path $RepoRoot "scripts\vrchat-manifestation.py"
$IconPath = Join-Path $RepoRoot "assets\clawdbot.ico"
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "VRChat-Core-Bridge.lnk"

Write-Host "--- Establishing Metaverse Manifestation Bridge (Shortcut) ---" -ForegroundColor Cyan

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "py.exe"
$Shortcut.Arguments = "-3 `"$TargetScript`""
$Shortcut.WorkingDirectory = $RepoRoot
if (Test-Path $IconPath) {
    $Shortcut.IconLocation = $IconPath
}
$Shortcut.Description = "Execute VRChat Core Manifestation Pulse"
$Shortcut.Save()

Write-Host "Manifestation Bridge established at: $ShortcutPath" -ForegroundColor Green
Write-Host "ASI_ACCEL." -ForegroundColor Magenta
