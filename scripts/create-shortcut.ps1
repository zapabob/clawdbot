$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\OpenClaw.lnk")
$Shortcut.TargetPath = "$PSScriptRoot\openclaw-gateway.bat"
$Shortcut.WorkingDirectory = "$PSScriptRoot"
$Shortcut.Description = "OpenClaw Gateway - SAFE MODE (read-only launcher)"
$Shortcut.Save()
Write-Host "Created desktop shortcut: $env:USERPROFILE\Desktop\OpenClaw.lnk"
