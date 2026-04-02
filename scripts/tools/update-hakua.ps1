$s = New-Object -ComObject WScript.Shell
$c = $s.CreateShortcut("C:\Users\downl\Desktop\Hakua Companion.lnk")
$c.TargetPath = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
$c.Arguments = "-NoExit -ExecutionPolicy Bypass -File `"C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\scripts\launchers\launch-desktop-stack.ps1`" -ForceVisibleGatewayAndTui -SpeakOnReady -HypuraWaitSeconds 180 -HypuraHarnessWaitSeconds 45"
$c.WorkingDirectory = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
$c.IconLocation = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\assets\clawdbot.ico"
$c.Description = "ASI Gateway Internet Mode - Full Stack"
$c.Save()
Write-Host "Shortcut updated successfully"
Write-Host "Target: $($c.TargetPath)"
Write-Host "Args: $($c.Arguments)"
