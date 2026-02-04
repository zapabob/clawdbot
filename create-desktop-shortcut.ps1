#!/usr/bin/env pwsh
# Create OpenClaw Desktop Shortcut

$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "OpenClaw.lnk"
$targetPath = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\openclaw.mjs"
$workingDir = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
$iconPath = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\ui\public\favicon.ico"

# Create WScript.Shell COM object
$WshShell = New-Object -ComObject WScript.Shell

# Create shortcut
$shortcut = $WshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "node"
$shortcut.Arguments = '"' + $targetPath + '"'
$shortcut.WorkingDirectory = $workingDir
$shortcut.IconLocation = $iconPath
$shortcut.Description = "OpenClaw - WhatsApp Gateway CLI"
$shortcut.WindowStyle = 1  # Normal window

# Save shortcut
$shortcut.Save()

Write-Host "OpenClaw shortcut created at: $shortcutPath"
Write-Host "Target: node $targetPath"
Write-Host "Icon: $iconPath"
