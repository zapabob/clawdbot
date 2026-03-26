$sh = New-Object -ComObject WScript.Shell
$sc = $sh.CreateShortcut("C:\Users\downl\Desktop\Clawdbot.lnk")
Write-Host "Target:" $sc.TargetPath
Write-Host "Args:" $sc.Arguments
Write-Host "Dir:" $sc.WorkingDirectory
Write-Host "Icon:" $sc.IconLocation
