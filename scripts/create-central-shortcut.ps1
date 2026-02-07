$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Gemini Central Brain.lnk")
$Shortcut.TargetPath = "$PSScriptRoot\start-gemini-central.bat"
$Shortcut.WorkingDirectory = "$PSScriptRoot"
$Shortcut.Description = "Gemini CLI as Central Brain - Controls OpenClaw"
$Shortcut.IconLocation = "$PSScriptRoot\..\assets\openclaw-icon.ico"
$Shortcut.Save()
Write-Host "Created desktop shortcut: $env:USERPROFILE\Desktop\Gemini Central Brain.lnk"
