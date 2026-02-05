#!/usr/bin/env pwsh
# OpenClaw Auto-Start on Boot Installation Script
# LINEボットを電源投入時に自動起動

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AutoStartScript = "$ScriptDir\openclaw-line-full-auto.ps1"
$StartupScript = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\openclaw-line.bat"
$RegKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message"
}

function Test-Admin {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-StartupShortcut {
    Write-Log "Installing startup shortcut..." -Level "INFO"
    
    $batContent = @"
@echo off
REM OpenClaw LINE Auto-Start
cd /d "%~dp0"
PowerShell -ExecutionPolicy Bypass -File "..\..\scripts\openclaw-line-full-auto.ps1"
"@
    
    $batPath = "$env:USERPROFILE\openclaw-line-startup.bat"
    $batContent | Set-Content $batPath -Encoding ASCII
    
    $wscript = New-Object -ComObject WScript.Shell
    $shortcut = $wscript.CreateShortcut($StartupScript)
    $shortcut.TargetPath = $batPath
    $shortcut.WorkingDirectory = "$env:USERPROFILE"
    $shortcut.Save()
    
    Write-Log "Shortcut created: $StartupScript" -Level "OK"
    return $true
}

function Install-RegistryRun {
    Write-Log "Installing registry auto-start..." -Level "INFO"
    
    $psPath = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
    $psArgs = "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$AutoStartScript`""
    
    Set-ItemProperty -Path $RegKey -Name "OpenClawLINE" -Value "$psPath $psArgs" -ErrorAction Stop
    
    Write-Log "Registry entry added: OpenClawLINE" -Level "OK"
    return $true
}

function Install-ScheduledTask {
    Write-Log "Installing scheduled task..." -Level "INFO"
    
    $taskName = "OpenClaw-LINE-AutoStart"
    
    $action = New-ScheduledTaskAction -Execute "PowerShell" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$AutoStartScript`""
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -User $env:USERNAME -RunLevel Limited -ErrorAction Stop
    
    Write-Log "Scheduled task registered: $taskName" -Level "OK"
    return $true
}

function Start-ServicesNow {
    Write-Log "Starting services now..." -Level "INFO"
    
    if (Test-Path $AutoStartScript) {
        Write-Log "Running auto-start script..." -Level "INFO"
        & $AutoStartScript
        return $true
    }
    
    Write-Log "Auto-start script not found: $AutoStartScript" -Level "WARN"
    return $false
}

function Show-Status {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "Auto-Start Installation Status" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    
    $shortcutExists = Test-Path $StartupScript
    $regExists = (Get-ItemProperty -Path $RegKey -Name "OpenClawLINE" -ErrorAction SilentlyContinue) -ne $null
    $taskExists = Get-ScheduledTask -TaskName "OpenClaw-LINE-AutoStart" -ErrorAction SilentlyContinue
    
    Write-Host "Startup Shortcut:  $($shortcutExists ? '✓' : '✗')" -ForegroundColor $(if ($shortcutExists) { "Green" } else { "Red" })
    Write-Host "Registry Run:      $($regExists ? '✓' : '✗')" -ForegroundColor $(if ($regExists) { "Green" } else { "Red" })
    Write-Host "Scheduled Task:   $($taskExists ? '✓' : '✗')" -ForegroundColor $(if ($taskExists) { "Green" } else { "Red" })
    Write-Host ""
    Write-Host "Auto-Start Script: $AutoStartScript" -ForegroundColor Gray
    Write-Host ""
}

# Main
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "OpenClaw LINE Auto-Start Installer" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

if (-not (Test-Path $AutoStartScript)) {
    Write-Log "Auto-start script not found: $AutoStartScript" -Level "ERROR"
    Write-Host "Please ensure the script exists at: scripts\openclaw-line-full-auto.ps1" -ForegroundColor Red
    exit 1
}

Write-Log "Source script: $AutoStartScript" -Level "INFO"

Write-Host ""
Write-Host "Installation Options:" -ForegroundColor Yellow
Write-Host "1. Install all auto-start methods (recommended)" -ForegroundColor White
Write-Host "2. Install startup shortcut only" -ForegroundColor White
Write-Host "3. Install registry only" -ForegroundColor White
Write-Host "4. Install scheduled task only" -ForegroundColor White
Write-Host "5. Start services now (no install)" -ForegroundColor White
Write-Host "6. Show current status" -ForegroundColor White
Write-Host "Q. Quit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select option"

switch ($choice.ToUpper()) {
    "1" {
        Install-StartupShortcut
        Install-RegistryRun
        Install-ScheduledTask
        Show-Status
        Write-Host ""
        Write-Host "Restart your PC to test auto-start!" -ForegroundColor Green
    }
    "2" {
        Install-StartupShortcut
        Show-Status
    }
    "3" {
        Install-RegistryRun
        Show-Status
    }
    "4" {
        Install-ScheduledTask
        Show-Status
    }
    "5" {
        Start-ServicesNow
    }
    "6" {
        Show-Status
    }
    "Q" {
        exit 0
    }
    default {
        Write-Host "Invalid option" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Log "Installation complete" -Level "INFO"
