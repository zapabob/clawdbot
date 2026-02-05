# OpenClaw + LINE + Tailscale 全自動化スクリプト

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  OpenClaw + LINE + Tailscale 全自動化" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Gateway停止
Write-Host "[1/5] Gatewayを停止中..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "    完了" -ForegroundColor Green
Write-Host ""

# 2. Tailscale確認
Write-Host "[2/5] Tailscale接続確認..." -ForegroundColor Yellow
try {
    $tsStatus = & "tailscale.exe" status 2>&1
    if ($tsStatus -match "\d+\.\d+\.\d+\.\d+") {
        Write-Host "    接続済み" -ForegroundColor Green
        $tsIP = & "tailscale.exe" ip 2>&1
        Write-Host "    IP: $tsIP" -ForegroundColor Green
    } else {
        Write-Host "    未接続、接続試行中..." -ForegroundColor Yellow
        & "tailscale.exe" up 2>&1 | Out-Null
        Start-Sleep -Seconds 5
        $tsIP = & "tailscale.exe" ip 2>&1
        if ($tsIP) {
            Write-Host "    接続完了: $tsIP" -ForegroundColor Green
        } else {
            Write-Host "    接続失敗" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "    エラー: $_" -ForegroundColor Red
}
Write-Host ""

# 3. Tailscale Funnel設定（Webhook公開）
Write-Host "[3/5] Tailscale Funnel設定..." -ForegroundColor Yellow
try {
    Write-Host "    Funnelを有効化中..."
    & "tailscale.exe" funnel 18789 2>&1 | Out-Null
    Start-Sleep -Seconds 3
    
    $funnelStatus = & "tailscale.exe" funnel status 2>&1
    Write-Host "    Funnel状態: $funnelStatus" -ForegroundColor Green
    
    # Funnel URL取得
    $funnelUrl = "https://$tsIP:18789"
    Write-Host "    Webhook URL: $funnelUrl/line/webhook" -ForegroundColor Cyan
} catch {
    Write-Host "    Funnel設定エラー（スキップします）" -ForegroundColor Yellow
    $funnelUrl = $null
}
Write-Host ""

# 4. Gateway起動
Write-Host "[4/5] Gatewayを起動中..." -ForegroundColor Yellow
$gatewayProc = Start-Process -FilePath "node.exe" -ArgumentList "openclaw.mjs gateway --port 18789 --tailscale serve" -WindowStyle Minimized -PassThru -ErrorAction SilentlyContinue
Start-Sleep -Seconds 5

# 起動確認
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:18789" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "    Gateway起動完了" -ForegroundColor Green
    }
} catch {
    Write-Host "    Gateway起動確認中..." -ForegroundColor Yellow
}
Write-Host ""

# 5. 完了サマリー
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  完了！" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📡 利用可能なURL:" -ForegroundColor White
Write-Host ""

if ($tsIP) {
    Write-Host "  🏠 Tailscale: https://$tsIP`:18789" -ForegroundColor Green
    Write-Host "  📱 Webhook:   https://$tsIP`:18789/line/webhook" -ForegroundColor Cyan
}

if ($funnelUrl) {
    Write-Host "  🌐 Funnel:    $funnelUrl/line/webhook" -ForegroundColor Magenta
}

Write-Host ""
Write-Host "📋 次のステップ:" -ForegroundColor White
Write-Host ""
Write-Host "  1. https://developers.line.biz/console/ にアクセス" -ForegroundColor White
Write-Host "  2. Webhook URLに上記URLを設定" -ForegroundColor White
Write-Host "  3. Use webhook: ON" -ForegroundColor White
Write-Host "  4. Verifyをクリック" -ForegroundColor White
Write-Host "  5. LINEでボットにメッセージ送信" -ForegroundColor White
Write-Host ""
Write-Host "💡 ペアリング承認:" -ForegroundColor Yellow
Write-Host "  node openclaw.mjs pairing approve line <コード>" -ForegroundColor Gray
Write-Host ""

Start-Sleep -Seconds 2
