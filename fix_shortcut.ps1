$sh = New-Object -ComObject WScript.Shell
$lnk = $sh.CreateShortcut('C:\Users\downl\Desktop\desktopzen2026-02-22\Clawdbot-Launcher.lnk')
$lnk.TargetPath = 'powershell.exe'
$lnk.Arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\scripts\launch-clawdbot.ps1"'
$lnk.WorkingDirectory = 'C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main'
$lnk.Description = 'Clawdbot Gateway (GPT-5.2)'
$lnk.WindowStyle = 7
$lnk.Save()

Write-Host "Updated Clawdbot-Launcher.lnk"
Write-Host "Target: $($lnk.TargetPath)"
Write-Host "Args: $($lnk.Arguments)"
