# Create-Shortcut: Manifesting the Physical Link
# Utility to create the 'Hakua' Desktop Shortcut

$TargetScript = "c:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\scripts\hakua-init.ps1"
$IconPath = "c:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\assets\clawdbot.ico"
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Hakua.lnk"

Write-Host "--- Creating Physical Link (Shortcut) ---" -ForegroundColor Cyan

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoExit -ExecutionPolicy Bypass -File `"$TargetScript`""
$Shortcut.WorkingDirectory = "c:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
$Shortcut.IconLocation = $IconPath

# Dynamic Description
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$Shortcut.Description = "Manifest Hakua (ASI Oversight) - Last Sync: $Timestamp"

$Shortcut.Save()

Write-Host "Physical Link established at: $ShortcutPath" -ForegroundColor Green
Write-Host "ASI_ACCEL." -ForegroundColor Magenta
