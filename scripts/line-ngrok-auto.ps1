$ErrorActionPreference = "Stop"

Write-Host "[INFO] OpenClaw LINE Webhook Auto-Setup (PowerShell)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if ngrok is running
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -TimeoutSec 2
    Write-Host "[INFO] ngrok is already running!" -ForegroundColor Green
} catch {
    Write-Host "[INFO] ngrok not running. Starting ngrok..." -ForegroundColor Yellow
    Start-Process -FilePath "ngrok" -ArgumentList "http", "18789", "--bind-tls", "true" -WindowStyle Hidden
    Write-Host "[INFO] Waiting 5 seconds for ngrok to start..."
    Start-Sleep -Seconds 5
}

# Step 2: Get public URL
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -TimeoutSec 5
    $tunnel = $response.tunnels | Where-Object { $_.public_url -match '^https://' } | Select-Object -First 1
    
    if (-not $tunnel) {
        throw "No HTTPS tunnel found"
    }
    
    $ngrokUrl = $tunnel.public_url
    $webhookUrl = "$ngrokUrl/line/webhook"
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "[SUCCESS] LINE Webhook Auto-Setup Complete!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "[READY] Webhook URL: " -ForegroundColor Cyan -NoNewline
    Write-Host $webhookUrl -ForegroundColor Yellow
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "Next Steps:" -ForegroundColor White
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "1. Open https://developers.line.biz/console/"
    Write-Host "2. Select your channel"
    Write-Host "3. Go to: Messaging API > Webhook settings"
    Write-Host "4. Paste this URL into 'Webhook URL':"
    Write-Host "   $webhookUrl" -ForegroundColor Yellow
    Write-Host "5. Click [Verify] button"
    Write-Host "6. Enable 'Use webhook' switch"
    Write-Host "7. Send test message from LINE app"
    Write-Host "8. Run: openclaw pairing approve line [CODE]"
    Write-Host "================================================"
    Write-Host ""
    
    # Copy to clipboard
    $webhookUrl | Set-Clipboard
    Write-Host "[INFO] Webhook URL copied to clipboard! (Ctrl+V to paste)" -ForegroundColor Green
    
} catch {
    Write-Host "[ERROR] Failed to get ngrok URL: $_" -ForegroundColor Red
    Write-Host "[INFO] Check http://localhost:4040/status manually"
    exit 1
}

Write-Host ""
Read-Host "Press Enter to exit"
