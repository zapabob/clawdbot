param(
    [string]$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName,
    [int]$PollRetries = 60,
    [int]$PollIntervalSec = 2
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\env-tools.ps1"

$EnvFile = Get-ProjectEnvFile -ProjectDir $ProjectDir

Write-Host "[sync-ngrok] Monitoring Docker-ngrok for Public URL..." -ForegroundColor Cyan

$publicUrl = $null
for ($i = 0; $i -lt $PollRetries; $i++) {
    try {
        # Docker maps 4040:4040 in the override
        $resp = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        $tunnel = $resp.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
        if (-not $tunnel) {
            $tunnel = $resp.tunnels | Select-Object -First 1
        }
        if ($tunnel) {
            $publicUrl = $tunnel.public_url
            break
        }
    } catch {
        # Still starting up
    }
    Start-Sleep -Seconds $PollIntervalSec
}

if ($publicUrl) {
    Write-Host "[sync-ngrok] Detected Public URL: $publicUrl" -ForegroundColor Green

    $telegramUrl = "$publicUrl/webhook/telegram"
    $lineUrl = "$publicUrl/webhook/line"

    Set-EnvValues -EnvFile $EnvFile -Values @{
        OPENCLAW_PUBLIC_URL   = $publicUrl
        TELEGRAM_WEBHOOK_URL  = $telegramUrl
        LINE_WEBHOOK_URL      = $lineUrl
    }
    Write-Host "[sync-ngrok] .env updated via Docker-ngrok substrate." -ForegroundColor Green
} else {
    Write-Host "[sync-ngrok] ERROR: Could not retrieve URL from Docker-ngrok." -ForegroundColor Red
}
