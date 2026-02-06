# OpenClaw WhatsApp Setup Script
# 電話番号: +818044420416

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OpenClaw WhatsApp 連携セットアップ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill existing processes
Write-Host "[1/3] 既存のプロセスを清理中..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*openclaw*" -or $_.CommandLine -like "*clawdbot*"
} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Start Gateway
Write-Host "[2/3] OpenClaw Gateway を起動中..." -ForegroundColor Yellow
$gatewayJob = Start-Process -FilePath "node" -ArgumentList "scripts/node/run-node.mjs", "gateway", "run", "--bind", "0.0.0.0", "--port", "3000" -WorkingDirectory (Get-Location) -PassThru -NoNewWindow

Write-Host "     Gateway PID: $($gatewayJob.Id)" -ForegroundColor Gray
Start-Sleep -Seconds 15

# Step 3: Check and show QR login
Write-Host "[3/3] WhatsApp QRログインを実行中..." -ForegroundColor Yellow
Write-Host ""
Write-Host "    QRコードを表示します。WhatsAppでスキャンしてください。" -ForegroundColor White
Write-Host "    スマートフォン: 設定 > リンクされたデバイス > デバイスをリンク" -ForegroundColor Gray
Write-Host ""

# Run QR login
$loginProc = Start-Process -FilePath "node" -ArgumentList "scripts/node/run-node.mjs", "channels", "login", "whatsapp" -WorkingDirectory (Get-Location) -PassThru -NoNewWindow

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       QRログイン 대기 중..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ゲートウェイ: http://localhost:3000" -ForegroundColor Green
Write-Host ""
