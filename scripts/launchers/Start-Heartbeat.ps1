param(
    [int]$IntervalMinutes = 0   # 0 = .env の HEARTBEAT_INTERVAL_MIN を使用、それも未設定なら 30
)

$ErrorActionPreference = "SilentlyContinue"
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
. "$PSScriptRoot\env-tools.ps1"
Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir

if ($IntervalMinutes -le 0) {
    $envVal = [int]($env:HEARTBEAT_INTERVAL_MIN)
    $IntervalMinutes = if ($envVal -gt 0) { $envVal } else { 30 }
}

$notifyScript = Join-Path $PSScriptRoot "Send-Notification.ps1"
$intervalSec  = $IntervalMinutes * 60

Write-Host "  [HB] Heartbeat loop started (every ${IntervalMinutes}min)" -ForegroundColor DarkCyan

while ($true) {
    Start-Sleep -Seconds $intervalSec
    try {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $notifyScript `
            -Type "HEARTBEAT" 2>$null
    } catch { }
}
