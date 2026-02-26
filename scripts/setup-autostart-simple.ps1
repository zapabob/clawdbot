$StartupFolder = [Environment]::GetFolderPath('Startup')
$ScriptPath = 'C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\scripts\launch-clawdbot.ps1'
$ShortcutPath = Join-Path $StartupFolder 'Clawdbot.lnk'

$WshShell = New-Object -ComObject WScript.Shell
$sc = $WshShell.CreateShortcut($ShortcutPath)
$sc.TargetPath = 'powershell.exe'
$sc.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File `"$ScriptPath`""
$sc.WorkingDirectory = 'C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main'
$sc.Description = 'Clawdbot Gateway'
$sc.WindowStyle = 7
$sc.Save()

Write-Host "Created: $ShortcutPath"
