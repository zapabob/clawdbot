param(
    [string]$ServiceName = "OpenClawFunnel",
    [string]$DisplayName = "OpenClaw + LINE Funnel",
    [string]$Description = "OpenClaw Gateway and LINE Webhook with Tailscale Funnel",
    [string]$ScriptPath = "$PSScriptRoot\start-openclaw-funnel.ps1"
)

$ErrorActionPreference = "Stop"

Write-Host "=== OpenClaw Funnel Service Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object System.Security.Principal.WindowsPrincipal($currentUser)
if (-not $principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

# Check if service exists
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if ($service) {
    Write-Host "Service '$ServiceName' already exists." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Green
    Write-Host "  1) Restart service" -ForegroundColor White
    Write-Host "  2) Stop service" -ForegroundColor White
    Write-Host "  3) Delete service" -ForegroundColor White
    Write-Host "  4) Exit" -ForegroundColor White
    Write-Host ""
    $choice = Read-Host "Select action (1-4)"

    switch ($choice) {
        "1" {
            Write-Host "Restarting service..." -ForegroundColor Yellow
            Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 3
            Start-Service -Name $ServiceName
            Write-Host "Service restarted." -ForegroundColor Green
        }
        "2" {
            Write-Host "Stopping service..." -ForegroundColor Yellow
            Stop-Service -Name $ServiceName -Force
            Write-Host "Service stopped." -ForegroundColor Green
        }
        "3" {
            Write-Host "Deleting service..." -ForegroundColor Yellow
            Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
            sc.exe delete $ServiceName
            Write-Host "Service deleted." -ForegroundColor Green
        }
        default {
            Write-Host "Exiting." -ForegroundColor Gray
        }
    }
    exit 0
}

# Create the service
Write-Host "Creating service '$ServiceName'..." -ForegroundColor Yellow

# Create scheduled task as service (more reliable than nssm for PowerShell scripts)
$taskName = $ServiceName
$taskDescription = $Description

# Create action
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""

# Create trigger (at logon for user, or at startup for system)
$trigger = New-ScheduledTaskTrigger -AtLogOn -RandomDelay (New-TimeSpan -Seconds 30)

# Create settings
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfOnBatteries -StartWhenAvailable -RunTimesAnyNoLimit

# Register the task
try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description $taskDescription -User "SYSTEM" -RunLevel Highest -ErrorAction Stop | Out-Null

    # Also add startup trigger for system boot
    $startupTrigger = New-ScheduledTaskTrigger -AtStartup -RandomDelay (New-TimeSpan -Seconds 60)
    Set-ScheduledTask -TaskName $taskName -Trigger $startupTrigger -ErrorAction SilentlyContinue

    Write-Host "Service created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The service will start:" -ForegroundColor White
    Write-Host "  - At system startup (60 second delay)" -ForegroundColor White
    Write-Host "  - At user logon (30 second delay)" -ForegroundColor White
    Write-Host ""
    Write-Host "To manage the service:" -ForegroundColor White
    Write-Host "  - View: Get-ScheduledTask -TaskName $taskName" -ForegroundColor Gray
    Write-Host "  - Run: Start-ScheduledTask -TaskName $taskName" -ForegroundColor Gray
    Write-Host "  - Stop: Stop-ScheduledTask -TaskName $taskName" -ForegroundColor Gray
    Write-Host "  - Delete: Unregister-ScheduledTask -TaskName $taskName" -ForegroundColor Gray
    Write-Host ""

    # Start the service immediately
    Write-Host "Starting service now..." -ForegroundColor Yellow
    Start-ScheduledTask -TaskName $taskName

    # Give it time to start
    Start-Sleep -Seconds 10

    # Check status
    $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($task.State -eq "Running") {
        Write-Host "Service is running!" -ForegroundColor Green
    } else {
        Write-Host "Service state: $($task.State)" -ForegroundColor Yellow
    }

} catch {
    Write-Host "ERROR: Failed to create service: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Trying alternative method with schtasks..." -ForegroundColor Yellow

    # Alternative: Use schtasks directly
    $schtaskResult = schtasks /Create /TN $ServiceName /TR "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`"" /SC ONLOGON /RU SYSTEM /RL HIGHEST /F 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Service created via schtasks!" -ForegroundColor Green
        Start-ScheduledTask -TaskName $ServiceName
    } else {
        Write-Host "schtasks error: $schtaskResult" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
