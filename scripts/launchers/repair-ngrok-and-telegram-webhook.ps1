param(
    [int]$Port = 18789,
    [string]$ProjectDir = (Split-Path $PSScriptRoot -Parent | Split-Path -Parent),
    [int]$GatewayWaitSeconds = 45,
    [int]$TunnelWaitSeconds = 30,
    [int]$NgrokUpstreamWaitSeconds = 2,
    [switch]$SkipGatewayStart,
    [switch]$SkipDropPendingUpdates
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\env-tools.ps1"

function Test-ListenPort {
    param([int]$TargetPort)
    $conn = Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction SilentlyContinue
    return ($null -ne $conn)
}

function Wait-ListenPort {
    param(
        [int]$TargetPort,
        [int]$TimeoutSeconds
    )
    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    while ([DateTime]::UtcNow -lt $deadline) {
        if (Test-ListenPort -TargetPort $TargetPort) {
            return $true
        }
        Start-Sleep -Milliseconds 500
    }
    return (Test-ListenPort -TargetPort $TargetPort)
}

function Start-GatewayIfNeeded {
    param(
        [int]$GatewayPort,
        [string]$RootDir,
        [switch]$NoStart
    )
    if (Test-ListenPort -TargetPort $GatewayPort) {
        Write-Host "[repair] Gateway listen already active on :$GatewayPort" -ForegroundColor DarkCyan
        return
    }
    if ($NoStart) {
        throw "[repair] Gateway is not listening on :$GatewayPort and -SkipGatewayStart was set."
    }

    $gatewayScript = Join-Path $RootDir "scripts\launchers\Start-Gateway.ps1"
    if (-not (Test-Path -LiteralPath $gatewayScript)) {
        throw "[repair] Missing gateway launcher: $gatewayScript"
    }

    $pwsh = (Get-Command powershell.exe -ErrorAction Stop).Source
    $procArgs = @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", $gatewayScript,
        "-Port", "$GatewayPort"
    )
    $proc = Start-Process -FilePath $pwsh -ArgumentList $procArgs -WorkingDirectory $RootDir -WindowStyle Minimized -PassThru
    Write-Host "[repair] Started Gateway launcher (PID $($proc.Id)). Waiting for :$GatewayPort..." -ForegroundColor Cyan
}

function Start-NgrokInBackground {
    param(
        [int]$GatewayPort,
        [int]$UpstreamWaitSeconds,
        [string]$RootDir
    )
    $ngrokScript = Join-Path $RootDir "scripts\launchers\start_ngrok.ps1"
    if (-not (Test-Path -LiteralPath $ngrokScript)) {
        throw "[repair] Missing ngrok launcher: $ngrokScript"
    }

    $pwsh = (Get-Command powershell.exe -ErrorAction Stop).Source
    $procArgs = @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", $ngrokScript,
        "-Port", "$GatewayPort",
        "-UpstreamWaitSeconds", "$UpstreamWaitSeconds",
        "-ForceRestart"
    )
    $proc = Start-Process -FilePath $pwsh -ArgumentList $procArgs -WorkingDirectory $RootDir -WindowStyle Minimized -PassThru
    Write-Host "[repair] Started ngrok launcher (PID $($proc.Id))." -ForegroundColor Cyan
}

Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir
Set-OpenClawDesktopConfigEnv -ProjectDir $ProjectDir

$resolution = Get-OpenClawNgrokUpstreamResolution -NgrokUpstreamCandidate ([string]$env:NGROK_UPSTREAM_URL) -GatewayPort $Port -ProjectDir $ProjectDir
$upstreamPort = [int]$resolution.TunnelPort
if ($upstreamPort -le 0) {
    $upstreamPort = $Port
}

Start-GatewayIfNeeded -GatewayPort $Port -RootDir $ProjectDir -NoStart:$SkipGatewayStart
if (-not (Wait-ListenPort -TargetPort $upstreamPort -TimeoutSeconds $GatewayWaitSeconds)) {
    throw "[repair] Upstream port :$upstreamPort did not become ready within ${GatewayWaitSeconds}s."
}

Start-NgrokInBackground -GatewayPort $Port -UpstreamWaitSeconds $NgrokUpstreamWaitSeconds -RootDir $ProjectDir

$publicUrl = Sync-NgrokPublicUrlToEnv -ProjectDir $ProjectDir -MaxWaitSeconds $TunnelWaitSeconds -PollMs 1000 -GatewayPort $Port
if ([string]::IsNullOrWhiteSpace($publicUrl)) {
    throw "[repair] Failed to obtain ngrok public URL from http://127.0.0.1:4040/api/tunnels within ${TunnelWaitSeconds}s."
}

$merged = Get-MergedEnvMap -ProjectDir $ProjectDir
$botToken = [string]$merged["TELEGRAM_BOT_TOKEN"]
if ([string]::IsNullOrWhiteSpace($botToken)) {
    throw "[repair] TELEGRAM_BOT_TOKEN is missing in merged env (.env / .env.local / state .env)."
}
$webhookSecret = [string]$merged["TELEGRAM_WEBHOOK_SECRET"]

$webhookUrl = "$publicUrl/telegram-webhook"
$apiBase = "https://api.telegram.org/bot$botToken"

$setBody = @{
    url = $webhookUrl
}
if (-not [string]::IsNullOrWhiteSpace($webhookSecret)) {
    $setBody.secret_token = $webhookSecret
}
if (-not $SkipDropPendingUpdates) {
    $setBody.drop_pending_updates = "true"
}

$setResp = Invoke-RestMethod -Method Post -Uri "$apiBase/setWebhook" -Body $setBody -ContentType "application/x-www-form-urlencoded"
if (-not $setResp.ok) {
    throw "[repair] Telegram setWebhook failed: $($setResp | ConvertTo-Json -Depth 6 -Compress)"
}

$infoResp = Invoke-RestMethod -Method Get -Uri "$apiBase/getWebhookInfo"
if (-not $infoResp.ok) {
    throw "[repair] Telegram getWebhookInfo failed: $($infoResp | ConvertTo-Json -Depth 6 -Compress)"
}

$resultUrl = [string]$infoResp.result.url
if ($resultUrl -ne $webhookUrl) {
    throw "[repair] webhook mismatch: expected $webhookUrl, got $resultUrl"
}

Write-Host "[repair] SUCCESS" -ForegroundColor Green
Write-Host "[repair] OPENCLAW_PUBLIC_URL   = $publicUrl" -ForegroundColor Green
Write-Host "[repair] TELEGRAM_WEBHOOK_URL = $webhookUrl" -ForegroundColor Green
Write-Host "[repair] Telegram last_error_message = $([string]$infoResp.result.last_error_message)" -ForegroundColor DarkGray
