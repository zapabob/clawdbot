$ErrorActionPreference = "Stop"
$openclawConfigPath = "$env:USERPROFILE\.openclaw\openclaw.json"

Write-Host "[Hakua Init] Killing existing tunnels..." -ForegroundColor Cyan
Stop-Process -Name "ngrok" -Force -ErrorAction SilentlyContinue

Write-Host "[Hakua Init] Starting ngrok on port 18789 (OpenClaw Gateway)..." -ForegroundColor Cyan
Start-Process -FilePath "ngrok" -ArgumentList "http 18789 --log=stdout" -WindowStyle Hidden

$url = $null
$retries = 10
for ($i = 1; $i -le $retries; $i++) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels"
        $tunnel = $response.tunnels | Where-Object { $_.public_url -match "https://" }
        if ($tunnel) {
            $url = $tunnel.public_url
            break
        }
    }
    catch {
        Write-Host "Waiting for ngrok API ($i/$retries)..." -ForegroundColor Yellow
    }
}

if (-not $url) {
    Write-Host "[Error] Failed to get ngrok URL. [ASI_ACCEL]" -ForegroundColor Red
    exit 1
}

Write-Host "[Hakua Init] Acquired dynamic Webhook URL: $url" -ForegroundColor Green

# Update config.json (Since OpenClaw might rewrite via its own config manager, we inject directly)
Write-Host "[Hakua Init] Injecting LINE webhook into openclaw.json..." -ForegroundColor Cyan
$config = Get-Content $openclawConfigPath -Raw | ConvertFrom-Json -Depth 10

if (-not $config.channels.line) {
    $config.channels | Add-Member -MemberType NoteProperty -Name "line" -Value @{ enabled = $true }
}
$config.channels.line.webhookServerUrl = $url

$config | ConvertTo-Json -Depth 10 | Set-Content $openclawConfigPath

Write-Host "[Hakua Init] Complete. Webhook URL dynamically updated. [ASI_ACCEL]" -ForegroundColor Magenta
Write-Host "Please start the gateway now: openclaw gateway"
