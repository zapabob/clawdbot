$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$LauncherPs1 = Join-Path $ProjectDir "scripts\launchers\launch-desktop-stack.ps1"
$IconPath = Join-Path $ProjectDir "assets\clawdbot.ico"
$DesktopPath = [System.Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "OpenClaw Desktop Stack.lnk"

Write-Host "=== Creating OpenClaw Desktop Shortcut ===" -ForegroundColor Cyan

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$LauncherPs1`" -SpeakOnReady"
$Shortcut.WorkingDirectory = $ProjectDir
$Shortcut.Description = "Launch OpenClaw gateway, TUI, browser, ngrok, and VOICEVOX"

if (Test-Path $IconPath) {
    $Shortcut.IconLocation = "$IconPath,0"
} else {
    $Shortcut.IconLocation = "powershell.exe,0"
}

$Shortcut.WindowStyle = 1
$Shortcut.Save()

Write-Host "[OK] Shortcut created: $ShortcutPath" -ForegroundColor Green
Write-Host "Double-click to start VOICEVOX, ngrok, gateway, TUI, and the browser." -ForegroundColor Yellow
