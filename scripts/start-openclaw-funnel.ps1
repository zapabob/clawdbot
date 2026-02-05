$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$logFile = "$scriptDir\openclaw-funnel.log"

function Write-Log {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp $message" | Tee-Object -FilePath $logFile
}

Write-Log "=== OpenClaw + LINE Funnel Auto-Start Script ==="

# 1. Tailscaleが起動していることを確認
Write-Log "Checking Tailscale status..."
$tailscaleProcess = Get-Process tailscale -ErrorAction SilentlyContinue
if (-not $tailscaleProcess) {
    Write-Log "Starting Tailscale..."
    Start-Process "tailscale" "up" -WindowStyle Hidden -ErrorAction Continue
    Start-Sleep -Seconds 5
}

# 2. Tailscale Funnel設定（LINE Webhook用）
Write-Log "Configuring Tailscale Funnel for LINE webhook..."
try {
    # 既存のFunnel設定をリセット
    & tailscale funnel reset 2>&1 | Out-Null
    
    # Funnel開始（Webhookサーバー）
    & tailscale funnel http://localhost:3000/webhook --bg 2>&1 | Out-Null
    Write-Log "Funnel configured for http://localhost:3000/webhook"
} catch {
    Write-Log "Warning: Funnel configuration issue: $_"
}

# 3. Gatewayサーバーが稼働していることを確認
Write-Log "Checking OpenClaw Gateway..."
$gatewayProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*openclaw*" }
if (-not $gatewayProcess) {
    Write-Log "Starting OpenClaw Gateway..."
    Start-Process "pnpm" "gateway run --bind all --port 18789" -WorkingDirectory $scriptDir -WindowStyle Hidden
    Start-Sleep -Seconds 10
}

# 4. LINE Webhookサーバーが稼働していることを確認
Write-Log "Checking LINE webhook server..."
$webhookPort = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if (-not $webhookPort) {
    Write-Log "Starting LINE webhook server..."
    $webhookScript = Join-Path $scriptDir "extensions\line-ai-bridge\dist\webhook-server.js"
    if (Test-Path $webhookScript) {
        Start-Process "node" $webhookScript -WorkingDirectory $scriptDir -WindowStyle Hidden
    } else {
        Write-Log "Warning: Webhook server not found at $webhookScript"
    }
    Start-Sleep -Seconds 5
}

# 5. ステータス確認
Write-Log "=== Current Status ==="
Write-Log "Tailscale IP: $(tailscale ip -4 2>&1)"
Write-Log "Funnel URL: https://$(tailscale status --json 2>&1 | ConvertFrom-Json | Select-Object -First 1 | ForEach-Object { $_.DNSName } | Select-Object -First 1)"
Write-Log "Gateway: http://localhost:18789"
Write-Log "LINE Webhook: http://localhost:3000/webhook/line"

Write-Log "=== Ready! ==="
Write-Log "LINE Webhook URL for LINE Developers:"
Write-Log "  https://<your-tailnet>.ts.net/webhook/line"
