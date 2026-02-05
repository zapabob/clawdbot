#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  OpenClaw + LINE Funnel Auto-Start" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Checking LINE credentials..." -ForegroundColor Yellow

$lineToken = $env:LINE_CHANNEL_ACCESS_TOKEN
$lineSecret = $env:LINE_CHANNEL_SECRET

if (-not $lineToken) {
    Write-Host "  ERROR: LINE_CHANNEL_ACCESS_TOKEN not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "  To set:" -ForegroundColor White
    Write-Host "  1. Go to https://developers.line.me/console/" -ForegroundColor Gray
    Write-Host "  2. Copy Channel access token" -ForegroundColor Gray
    Write-Host '  3. Run: setx LINE_CHANNEL_ACCESS_TOKEN "your_token"' -ForegroundColor Gray
    exit 1
}

if (-not $lineSecret) {
    Write-Host "  WARNING: LINE_CHANNEL_SECRET not set" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  To set:" -ForegroundColor White
    Write-Host "  1. Go to https://developers.line.me/console/" -ForegroundColor Gray
    Write-Host "  2. Copy Channel secret from Basic information tab" -ForegroundColor Gray
    Write-Host "  3. Enter below:" -ForegroundColor Yellow
    $lineSecret = Read-Host "  Channel Secret"
    if ($lineSecret) {
        [Environment]::SetEnvironmentVariable("LINE_CHANNEL_SECRET", $lineSecret, "Machine")
        Write-Host "  OK: Channel Secret set" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Channel Secret is empty" -ForegroundColor Red
    }
} else {
    Write-Host "  OK: LINE credentials confirmed" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/5] Stopping existing processes..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*webhook*" -or $_.CommandLine -like "*line-ai-bridge*"
}
if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        Write-Host "  Stopping: PID $($_.Id)" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}
Write-Host "  OK: Done" -ForegroundColor Green

Write-Host ""
Write-Host "[3/5] Setting environment variables..." -ForegroundColor Yellow
$env:LINE_CHANNEL_ACCESS_TOKEN = $lineToken
$env:LINE_CHANNEL_SECRET = $lineSecret
$env:WEBHOOK_PORT = "3000"
Write-Host "  OK: Set" -ForegroundColor Green

Write-Host ""
Write-Host "[4/5] Starting webhook server..." -ForegroundColor Yellow

$webhookScript = $PSScriptRoot + "\..\extensions\line-ai-bridge\dist\src\webhook-server.js"

if (-not (Test-Path $webhookScript)) {
    Write-Host "  ERROR: Webhook server script not found" -ForegroundColor Red
    Write-Host "  Run: cd extensions/line-ai-bridge && npm run build" -ForegroundColor Yellow
    exit 1
}

Write-Host "  Starting..." -ForegroundColor Gray
$webhookProcess = Start-Process -FilePath "node" -ArgumentList $webhookScript -WindowStyle Hidden -PassThru -ErrorAction Stop
Start-Sleep -Seconds 3

$webhookRunning = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($webhookRunning) {
    Write-Host "  OK: Webhook server running (PID: $($webhookProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "  ERROR: Failed to start webhook server" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[5/5] Configuring Tailscale Funnel..." -ForegroundColor Yellow

$tailscaleRunning = Get-Process -Name "tailscale" -ErrorAction SilentlyContinue
if (-not $tailscaleRunning) {
    Write-Host "  Starting Tailscale..." -ForegroundColor Gray
    Start-Process -FilePath "tailscale" -ArgumentList "up" -WindowStyle Hidden -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 5
}

$null = Start-Process -FilePath "tailscale" -ArgumentList "funnel", "reset" -WindowStyle Hidden -PassThru -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
$null = Start-Process -FilePath "tailscale" -ArgumentList "funnel", "http://localhost:3000/webhook" -WindowStyle Hidden -PassThru -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Host "  OK: Funnel configured" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  STARTUP COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$localIP = (Get-NetIPAddress -InterfaceIndex (Get-NetConnectionProfile).InterfaceIndex -AddressFamily IPv4).IPAddress 2>$null
if (-not $localIP) { $localIP = "localhost" }
$tailnetName = (tailscale status --json 2>$null | ConvertFrom-Json | Select-Object -First 1).DNSName

Write-Host "Connection Info:" -ForegroundColor White
Write-Host ""
Write-Host "  LAN: http://$($localIP):3000/webhook/line" -ForegroundColor Cyan
if ($tailnetName) {
    Write-Host "  External: https://$($tailnetName)/webhook/line" -ForegroundColor Cyan
}
Write-Host "  Health: http://$($localIP):3000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "LINE Console Settings:" -ForegroundColor White
Write-Host "  1. Go to https://developers.line.me/console/" -ForegroundColor Gray
if ($tailnetName) {
    Write-Host "  2. Webhook URL: https://$($tailnetName)/webhook/line" -ForegroundColor Cyan
}
Write-Host "  3. Click 'Verify'" -ForegroundColor Gray
Write-Host ""
