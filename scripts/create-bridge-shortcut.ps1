$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Gemini-OpenClaw Bridge.lnk")
$Shortcut.TargetPath = "$PSScriptRoot\gemini-openclaw-bridge.bat"
$Shortcut.WorkingDirectory = "$PSScriptRoot"
$Shortcut.Description = "Gemini CLI ↔ OpenClaw Gateway Bridge"
$Shortcut.IconLocation = "$PSScriptRoot\..\assets\openclaw-icon.ico"
$Shortcut.Save()
Write-Host "Created desktop shortcut: $env:USERPROFILE\Desktop\Gemini-OpenClaw Bridge.lnk"
