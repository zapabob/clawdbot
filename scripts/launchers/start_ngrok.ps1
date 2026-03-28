param(
    [int]$Port = 18789,
    [string]$ProjectDir = (Split-Path $PSScriptRoot -Parent | Split-Path -Parent),
    [int]$PollRetries = 30,
    [int]$PollIntervalSec = 1
)

# env-tools.ps1 をインポート（同ディレクトリ）
. "$PSScriptRoot\env-tools.ps1"

$EnvFile = Get-ProjectEnvFile -ProjectDir $ProjectDir

Write-Host "[ngrok] Starting tunnel on port $Port..." -ForegroundColor Cyan

# バックグラウンドジョブとして ngrok 起動
$NgrokPath = Join-Path $ProjectDir "bin\ngrok.exe"
if (-not (Test-Path $NgrokPath)) { $NgrokPath = "ngrok" }

$job = Start-Job -ScriptBlock {
    param($ngrok, $port)
    & $ngrok http $port
} -ArgumentList $NgrokPath, $Port

# ngrok ローカル API をポーリング
$publicUrl = $null
for ($i = 0; $i -lt $PollRetries; $i++) {
    Start-Sleep -Seconds $PollIntervalSec
    try {
        $resp = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        $tunnel = $resp.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
        if (-not $tunnel) {
            $tunnel = $resp.tunnels | Select-Object -First 1
        }
        if ($tunnel) {
            $publicUrl = $tunnel.public_url
            break
        }
    } catch { }
}

if ($publicUrl) {
    Write-Host "[ngrok] Public URL: $publicUrl" -ForegroundColor Green

    $telegramUrl = "$publicUrl/webhook/telegram"
    $lineUrl = "$publicUrl/webhook/line"

    # .env に書き込む
    Set-EnvValues -EnvFile $EnvFile -Values @{
        OPENCLAW_PUBLIC_URL   = $publicUrl
        TELEGRAM_WEBHOOK_URL  = $telegramUrl
        LINE_WEBHOOK_URL      = $lineUrl
    }
    Write-Host "[ngrok] .env updated: OPENCLAW_PUBLIC_URL, TELEGRAM_WEBHOOK_URL, LINE_WEBHOOK_URL" -ForegroundColor Green

    # 同一プロセスと子プロセス向け（Merge 前に Gateway を起動した場合でも参照可能）
    $env:OPENCLAW_PUBLIC_URL = $publicUrl
    $env:TELEGRAM_WEBHOOK_URL = $telegramUrl
    $env:LINE_WEBHOOK_URL = $lineUrl
} else {
    Write-Host "[ngrok] WARNING: Could not retrieve public URL after $PollRetries attempts." -ForegroundColor Yellow
    Write-Host "[ngrok] Is ngrok authenticated? Run: ngrok config add-authtoken <TOKEN>" -ForegroundColor Yellow
}

# フォアグラウンドで待機（Ctrl+C で停止）
Write-Host "[ngrok] Running. Press Ctrl+C to stop." -ForegroundColor Cyan
Wait-Job $job
