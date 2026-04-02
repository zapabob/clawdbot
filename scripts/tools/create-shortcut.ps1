$s = New-Object -ComObject WScript.Shell
$c = $s.CreateShortcut("C:\Users\downl\Desktop\ASI-Internet.lnk")
$c.TargetPath = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
$c.Arguments = "-NoExit -ExecutionPolicy Bypass -File `"C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\scripts\launchers\launch-desktop-stack.ps1`" -ForceVisibleGatewayAndTui -SpeakOnReady"
$c.WorkingDirectory = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
$c.IconLocation = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\assets\clawdbot.ico"
$c.Description = "ASI Gateway - Full Stack with VOICEVOX & TUI"
$c.Save()
Write-Host "Created: C:\Users\downl\Desktop\ASI-Internet.lnk"
