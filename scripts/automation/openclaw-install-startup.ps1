#!/usr/bin/env pwsh
# OpenClaw auto-startup installer

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Path
$PsScript = Join-Path $ScriptDir "openclaw-auto-start.ps1"
$StartupDir = "$env:USERPROFILE\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup"
$ShortcutPath = Join-Path $StartupDir "OpenClaw.lnk"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "OpenClaw Auto-Startup Installer" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check main script exists
if (-not (Test-Path $PsScript)) {
    Write-Host "[ERROR] Main script not found: $PsScript" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Main script found" -ForegroundColor Green

# Create startup directory
if (-not (Test-Path $StartupDir)) {
    New-Item -ItemType Directory -Path $StartupDir -Force | Out-Null
    Write-Host "[Created] Startup directory" -ForegroundColor Yellow
}

# Remove existing shortcut
if (Test-Path $ShortcutPath) {
    Remove-Item $ShortcutPath -Force
    Write-Host "[Removed] Existing shortcut" -ForegroundColor Yellow
}

# Create shortcut
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$PsScript`""
$Shortcut.WorkingDirectory = $ScriptDir
$Shortcut.Description = "OpenClaw AI Assistant - Auto Start"
$Shortcut.Save()

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "[SUCCESS] Auto-startup configured!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Startup will run on next boot:" -ForegroundColor Cyan
Write-Host "  1. Tailscale Funnel" -ForegroundColor White
Write-Host "  2. OpenClaw Gateway" -ForegroundColor White
Write-Host "  3. LINE auto-pairing" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
