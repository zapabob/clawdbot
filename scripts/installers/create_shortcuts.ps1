$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$StartupPath = [Environment]::GetFolderPath('Startup')
$ProjectDir = $PSScriptRoot

# --- OpenClaw Server shortcut ---
$TargetPath = "$ProjectDir\start_openclaw.bat"

$Shortcut = $WshShell.CreateShortcut("$DesktopPath\OpenClaw.lnk")
$Shortcut.TargetPath = $TargetPath
$Shortcut.WorkingDirectory = $ProjectDir
$Shortcut.IconLocation = "$ProjectDir\assets\clawdbot.ico,0"
$Shortcut.Save()
Write-Host "Created Desktop shortcut: $DesktopPath\OpenClaw.lnk"

$StartupShortcut = $WshShell.CreateShortcut("$StartupPath\OpenClaw.lnk")
$StartupShortcut.TargetPath = $TargetPath
$StartupShortcut.WorkingDirectory = $ProjectDir
$StartupShortcut.IconLocation = "$ProjectDir\assets\clawdbot.ico,0"
$StartupShortcut.Save()
Write-Host "Created Startup shortcut: $StartupPath\OpenClaw.lnk"

# --- Hakua Avatar shortcut ---
$AvatarTarget = "$ProjectDir\scripts\start-avatar.bat"
$AvatarShortcut = $WshShell.CreateShortcut("$DesktopPath\HakuaAvatar.lnk")
$AvatarShortcut.TargetPath = $AvatarTarget
$AvatarShortcut.WorkingDirectory = "$ProjectDir\scripts"
$AvatarShortcut.Save()
Write-Host "Created Avatar shortcut: $DesktopPath\HakuaAvatar.lnk"

# --- Style-Bert-VITS2 TTS Server shortcut ---
$SbvTarget = "$ProjectDir\scripts\start-sbv2.bat"
$SbvShortcut = $WshShell.CreateShortcut("$DesktopPath\SBV2-TTS.lnk")
$SbvShortcut.TargetPath = $SbvTarget
$SbvShortcut.WorkingDirectory = "$ProjectDir\scripts"
$SbvShortcut.Save()
Write-Host "Created SBV2 TTS shortcut: $DesktopPath\SBV2-TTS.lnk"

Write-Host ""
Write-Host "All shortcuts created successfully!"
Write-Host "  OpenClaw.lnk    -> Start OpenClaw server"
Write-Host "  HakuaAvatar.lnk -> Launch Hakua 3D avatar window"
Write-Host "  SBV2-TTS.lnk    -> Start Style-Bert-VITS2 TTS API"
