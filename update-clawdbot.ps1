$s = New-Object -ComObject WScript.Shell
$c = $s.CreateShortcut("C:\Users\downl\Desktop\Clawdbot.lnk")
$c.TargetPath = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\scripts\start-asi-internet.bat"
$c.WorkingDirectory = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
$c.IconLocation = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\assets\clawdbot.ico"
$c.Description = "ASI Gateway Internet Mode"
$c.Save()
Write-Host "Shortcut updated successfully"
