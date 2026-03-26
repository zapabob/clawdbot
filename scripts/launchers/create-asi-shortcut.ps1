# ASI-Hakua Shortcut Creation Utility
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$LaunchScript = Join-Path $PSScriptRoot "launch-desktop-stack.ps1"
$ShortcutPath = Join-Path ([Environment]::GetFolderPath("Desktop")) "ASI-Hakua-Sovereign.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -NoExit -File `"$LaunchScript`""
$Shortcut.WorkingDirectory = $ProjectDir
$Shortcut.Description = "ASI Hakua Sovereign Manifestation Portal"
# Use a premium system icon (e.g., the 'brain' or 'network' icon from imageres.dll)
$Shortcut.IconLocation = "$env:SystemRoot\System32\imageres.dll, 101"
$Shortcut.Save()

Write-Host "  [ASI_ACCEL] Premium Portal Shortcut Manifested on Desktop." -ForegroundColor Green
