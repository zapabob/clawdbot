#!/usr/bin/env pwsh
# OpenClaw Gateway + WhatsApp Startup Script

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OpenClaw Gateway - WhatsApp Automation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Kill existing gateway processes
Write-Host "[1/5] Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*openclaw*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Ensure credentials directory exists
$credDir = "$env:USERPROFILE\.openclaw\credentials\whatsapp\default"
New-Item -ItemType Directory -Force -Path $credDir | Out-Null

# Set environment variables
$env:OPENCLAW_PROFILE = "prod"
$env:NODE_ENV = "production"

Write-Host "[2/5] Starting OpenClaw Gateway..." -ForegroundColor Yellow

# Use the script's directory as working directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start gateway in background
$gatewayProc = Start-Process -FilePath "node" -ArgumentList "scripts/node/run-node.mjs", "gateway", "run", "--bind", "0.0.0.0", "--port", "3000" -WorkingDirectory $scriptDir -PassThru -RedirectStandardOutput "$env:TEMP\openclaw-out.log" -RedirectStandardError "$env:TEMP\openclaw-err.log"

Start-Sleep -Seconds 5

# Check if gateway started
if (Get-Process -Id $gatewayProc.Id -ErrorAction SilentlyContinue) {
    Write-Host "[OK] Gateway started (PID: $($gatewayProc.Id))" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] Gateway failed to start" -ForegroundColor Red
    Get-Content "$env:TEMP\openclaw-err.log" -ErrorAction SilentlyContinue | Select-Object -Last 20
    exit 1
}

# Wait for gateway to be ready
Write-Host "[3/5] Waiting for gateway to be ready..." -ForegroundColor Yellow
$maxWait = 5
$waited = 0
while ($waited -lt $maxWait) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "[OK] Gateway is ready!" -ForegroundColor Green
            break
        }
    }
    catch {}
    Start-Sleep -Seconds 1
    $waited++
    Write-Host "  Waiting... $($waited)/$maxWait" -ForegroundColor Gray -NoNewline
    Write-Host "`r" -NoNewline
}
Write-Host ""

# Check WhatsApp channel status
Write-Host "[4/5] Checking WhatsApp channel status..." -ForegroundColor Yellow
$status = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/channels/whatsapp/status" -Headers @{"Authorization" = "Bearer test-token" } -TimeoutSec 5 -ErrorAction SilentlyContinue

if ($status -and $status.StatusCode -eq 200) {
    $statusData = $status.Content | ConvertFrom-Json
    if ($statusData.linked -eq $true) {
        Write-Host "[OK] WhatsApp already linked!" -ForegroundColor Green
    }
    else {
        Write-Host "[!] WhatsApp needs QR code login" -ForegroundColor Yellow
    }
}
else {
    Write-Host "[!] Could not check WhatsApp status" -ForegroundColor Yellow
}

# Configure WhatsApp if not configured
Write-Host "[5/5] Final configuration..." -ForegroundColor Yellow
$configBody = @{
    channels = @{
        whatsapp = @{
            dmPolicy         = "pairing"
            sendReadReceipts = $true
            ackReaction      = @{
                emoji  = "👀"
                direct = $true
                group  = "mentions"
            }
        }
    }
} | ConvertTo-Json -Depth 5

try {
    Invoke-WebRequest -Uri "http://localhost:3000/api/v1/config" -Method PUT -Body $configBody -ContentType "application/json" -Headers @{"Authorization" = "Bearer test-token" } -TimeoutSec 5 | Out-Null
    Write-Host "[OK] Configuration updated" -ForegroundColor Green
}
catch {
    Write-Host "[!] Could not update config via API" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To link WhatsApp, run in NEW terminal:" -ForegroundColor White
Write-Host "  cd $((Get-Location).Path)" -ForegroundColor Yellow
Write-Host "  pnpm openclaw channels login whatsapp" -ForegroundColor Yellow
Write-Host ""
Write-Host "Then scan the QR code with WhatsApp." -ForegroundColor White
Write-Host ""
Write-Host "Gateway is running at: http://localhost:3000" -ForegroundColor Green
Write-Host ""
