param(
    [switch]$Remove
)

# Setup-NotificationTasks.ps1
# Reads .env and registers Windows Task Scheduler tasks for heartbeat only (Telegram/LINE).
# Startup/boot SITREP was removed (no AtStartup task). Run manually: .\Setup-NotificationTasks.ps1
#
# ENV KEYS:
#   HEARTBEAT_INTERVAL_MIN  integer minutes, default 30
#   TELEGRAM_BOT_TOKEN      Telegram bot token
#   TELEGRAM_CHAT_ID        target chat id (auto-detected from pairing if unset)
#   LINE_CHANNEL_ACCESS_TOKEN  LINE channel access token
#   LINE_USER_ID            LINE target user id (broadcast if unset)

$ErrorActionPreference = "Stop"
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
. "$PSScriptRoot\env-tools.ps1"
Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir
Set-OpenClawDesktopConfigEnv -ProjectDir $ProjectDir

$notifyScript = Join-Path $ProjectDir "scripts\launchers\Send-Notification.ps1"
$taskFolder   = "Clawdbot"
$hbTaskName   = "$taskFolder\Heartbeat"
$srTaskName   = "$taskFolder\StartupSITREP"

# Remove mode
if ($Remove) {
    foreach ($t in @($hbTaskName, $srTaskName)) {
        if (Get-ScheduledTask -TaskPath "\$taskFolder\" -TaskName (Split-Path $t -Leaf) -ErrorAction SilentlyContinue) {
            Unregister-ScheduledTask -TaskPath "\$taskFolder\" -TaskName (Split-Path $t -Leaf) -Confirm:$false
            Write-Host "  [TASK] Removed: $t" -ForegroundColor Yellow
        }
    }
    # Gateway 自動起動タスクも掃除（存在する場合のみ）
    # Use single quotes — parentheses in double-quoted strings are subexpressions in PowerShell.
    $gwTaskName = 'OpenClaw Gateway (desktop-stack)'
    try {
        $existingGw = Get-ScheduledTask -TaskName $gwTaskName -ErrorAction SilentlyContinue
        if ($existingGw) {
            Unregister-ScheduledTask -TaskName $gwTaskName -Confirm:$false -ErrorAction Stop
            Write-Host "  [TASK] Removed gateway auto-start task: $gwTaskName" -ForegroundColor Yellow
        }
    } catch {
        Write-Host ("  [TASK] Could not remove gateway task (run elevated if needed): {0}" -f $_) -ForegroundColor DarkYellow
    }
    return
}

# Read interval from .env
$intervalMin = [int]($env:HEARTBEAT_INTERVAL_MIN)
if ($intervalMin -le 0) { $intervalMin = 30 }
$repetition = New-TimeSpan -Minutes $intervalMin

# Build scheduled task action (re-injects .env at run time)
function New-NotifyAction {
    param([string]$NotifyType)
    $cmd = [string]::Join(" ", @(
        "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command",
        (". '{0}\scripts\launchers\env-tools.ps1';" +
         "Merge-OpenClawEnvToProcess -ProjectDir '{0}';" +
         "Set-OpenClawDesktopConfigEnv -ProjectDir '{0}';" +
         "& '{1}' -Type {2}") -f $ProjectDir, $notifyScript, $NotifyType
    ))
    return New-ScheduledTaskAction -Execute "powershell.exe" -Argument $cmd `
        -WorkingDirectory $ProjectDir
}

# Create task folder if missing
$scheduler = New-Object -ComObject "Schedule.Service"
$scheduler.Connect()
$rootFolder = $scheduler.GetFolder("\")
try {
    $rootFolder.GetFolder($taskFolder) | Out-Null
} catch {
    $rootFolder.CreateFolder($taskFolder) | Out-Null
    Write-Host "  [TASK] Created folder: \$taskFolder" -ForegroundColor Gray
}

# 1. Heartbeat task (repeating)
$hbAction  = New-NotifyAction -NotifyType "HEARTBEAT"
$hbTrigger = New-ScheduledTaskTrigger -RepetitionInterval $repetition `
    -At (Get-Date).AddMinutes(2) -Once
$hbTrigger.Repetition.StopAtDurationEnd = $false

$hbSettings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 2) `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -MultipleInstances IgnoreNew

$hbPrincipal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType Interactive `
    -RunLevel Limited

Register-ScheduledTask `
    -TaskPath "\$taskFolder\" `
    -TaskName "Heartbeat" `
    -Action $hbAction `
    -Trigger $hbTrigger `
    -Settings $hbSettings `
    -Principal $hbPrincipal `
    -Description "Clawdbot heartbeat to Telegram/LINE (interval: ${intervalMin}min, from .env)" `
    -Force | Out-Null

Write-Host ("  [TASK] Heartbeat registered: every {0}min (from HEARTBEAT_INTERVAL_MIN)" -f $intervalMin) -ForegroundColor Green
Write-Host "  [TASK] Done. To remove tasks: Setup-NotificationTasks.ps1 -Remove" -ForegroundColor DarkCyan
