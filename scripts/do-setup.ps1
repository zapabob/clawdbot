$RepoRoot = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
$Launcher = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\scripts\launch-clawdbot.ps1"
$Desktop = [Environment]::GetFolderPath("Desktop")
$IcoSrc = "C:\Users\downl\clawd\clawdbot.ico"
$TaskName = "Clawdbot_AutoStart"

# 1. Clean old shortcuts
"OpenClaw.lnk", "OpenCode.lnk", "Clawdbot.lnk" | ForEach-Object {
    $p = Join-Path $Desktop $_
    if (Test-Path $p) { Remove-Item $p -Force; Write-Host "Removed: $_" }
}

# 2. Create lobster shortcut
$scPath = Join-Path $Desktop "Clawdbot.lnk"
$shell = New-Object -ComObject WScript.Shell
$sc = $shell.CreateShortcut($scPath)
$sc.TargetPath = "powershell.exe"
$sc.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File `"$Launcher`""
$sc.WorkingDirectory = $RepoRoot
$sc.IconLocation = "$IcoSrc,0"
$sc.Save()
Write-Host "Created: $scPath"

# 3. Schedule Task (Logon)
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File `"$Launcher`"" -WorkingDirectory $RepoRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 0) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) { Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false }

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Clawdbot Autostart" -Force | Out-Null
Write-Host "Registered Task: $TaskName"
