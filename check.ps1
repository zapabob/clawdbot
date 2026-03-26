$s = New-Object -ComObject WScript.Shell
$c = $s.CreateShortcut("C:\Users\downl\Desktop\Clawdbot.lnk")
Write-Host "Target:" $c.TargetPath
Write-Host "Args:" $c.Arguments
Write-Host "Dir:" $c.WorkingDirectory
Write-Host "Icon:" $c.IconLocation
