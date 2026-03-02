# Create Hakua Desktop Shortcut
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.IO.Path]::Combine([System.Environment]::GetFolderPath("Desktop"), "Hakua Autonomous Start.lnk")
$Shortcut = $WshShell.CreateShortcut($DesktopPath)

$ProjectRoot = (Get-Item $PSScriptRoot).Parent.FullName
$ScriptPath = Join-Path $ProjectRoot "scripts\autonomous_hakua_start.ps1"
$IconPath = Join-Path $ProjectRoot "assets\clawdbot.ico"

# We use powershell.exe to launch the ps1 script
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$ScriptPath`""
$Shortcut.WorkingDirectory = $ProjectRoot
$Shortcut.Description = "Autonomous Clawdbot Startup Protocol (Hakua)"

if (Test-Path $IconPath) {
    $Shortcut.IconLocation = $IconPath
}

$Shortcut.Save()

Write-Host "--- Shortcut Created on Desktop ---" -ForegroundColor Green
Write-Host "Path: $DesktopPath" -ForegroundColor Gray
