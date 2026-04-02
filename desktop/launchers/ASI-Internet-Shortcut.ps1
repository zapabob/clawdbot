$s = New-Object -ComObject WScript.Shell
$shortcut = $s.CreateShortcut("$env:USERPROFILE\Desktop\ASI-Internet.lnk")
$shortcut.TargetPath = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
$shortcut.Arguments = '-NoExit -ExecutionPolicy Bypass -File "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\scripts\launchers\launch-desktop-stack.ps1" -ForceVisibleGatewayAndTui -SpeakOnReady'
$shortcut.WorkingDirectory = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
$shortcut.IconLocation = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\assets\clawdbot.ico"
$shortcut.Description = "ASI Gateway Internet Mode"
$shortcut.Save()
Write-Host "Created: $env:USERPROFILE\Desktop\ASI-Internet.lnk"
