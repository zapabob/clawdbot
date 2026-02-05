#!/usr/bin/env pwsh
# OpenClaw + LINE Full Auto Setup with Tailscale

$ErrorActionPreference = "Stop"
$script:ProgressPreference = "SilentlyContinue"

$Config = @{
    GatewayPort = 3000
    WebhookPath = "/line/webhook"
    LogDir = "$env:USERPROFILE\.openclaw\logs"
    ConfigDir = "$env:USERPROFILE\.openclaw"
    RetryCount = 15
    RetryDelay = 2
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logLine = "[$timestamp] [$Level] $Message"
    Write-Host $logLine
    Add-Content -Path "$($Config.LogDir)\openclaw-line-auto.log" -Value $logLine -ErrorAction SilentlyContinue
}

function Test-Command {
    param([string]$Name)
    try { Get-Command $Name -ErrorAction Stop | Out-Null; return $true } catch { return $false }
}

function Get-LineTokens {
    Write-Log "Checking LINE tokens..." -Level "INFO"

    $token = $env:LINE_CHANNEL_ACCESS_TOKEN
    $secret = $env:LINE_CHANNEL_SECRET

    if (-not $token -or -not $secret) {
        Write-Log "Environment variables not set" -Level "WARN"
        Write-Host ""
        Write-Host "ERROR: LINE tokens not configured" -ForegroundColor Red
        Write-Host ""
        Write-Host "Set environment variables first:" -ForegroundColor Yellow
        Write-Host "  \$env:LINE_CHANNEL_ACCESS_TOKEN = 'your-channel-access-token'" -ForegroundColor Gray
        Write-Host "  \$env:LINE_CHANNEL_SECRET = 'your-channel-secret'" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Then re-run this script" -ForegroundColor Yellow
        return $null
    }

    Write-Log "LINE tokens found" -Level "OK"
    return @{ Token = $token; Secret = $secret }
}

function Save-OpenClawConfig {
    param($Tokens)

    Write-Log "Saving OpenClaw config..." -Level "INFO"

    $configDir = $Config.ConfigDir
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    }

    $configFile = "$configDir\config.json"
    $config = @{}

    if (Test-Path $configFile) {
        try {
            $config = Get-Content $configFile | ConvertFrom-Json -AsHashtable
        } catch { }
    }

    $config['channels'] = @{
        line = @{
            enabled = $true
            channelAccessToken = $Tokens.Token
            channelSecret = $Tokens.Secret
            dmPolicy = "open"
            groupPolicy = "allowlist"
            webhookPath = $Config.WebhookPath
        }
    }

    $config['gateway'] = @{
        port = $Config.GatewayPort
        mode = "local"
    }

    $config['tailscale'] = @{
        serve = $true
    }

    $config | ConvertTo-Json -Depth 10 | Set-Content $configFile -Encoding UTF8

    Write-Log "Config saved: $configFile" -Level "OK"
    return $true
}

function Start-TailscaleFunnel {
    Write-Log "Starting Tailscale Funnel..." -Level "INFO"

    if (-not (Test-Command "tailscale")) {
        Write-Log "tailscale not found" -Level "ERROR"
        return $false
    }

    $status = tailscale funnel status 2>$null
    if ($status -match $Config.GatewayPort) {
        Write-Log "Tailscale Funnel already running on port $Config.GatewayPort" -Level "OK"
        return $true
    }

    Write-Log "Enabling Tailscale Funnel on port $($Config.GatewayPort)..." -Level "INFO"
    $result = tailscale funnel --bg $Config.GatewayPort 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Log "Tailscale Funnel started" -Level "OK"
        Start-Sleep -Seconds 5
        return $true
    }

    Write-Log "Tailscale Funnel error: $result" -Level "WARN"
    return $false
}

function Get-TailscaleUrl {
    Write-Log "Getting Tailscale HTTPS URL..." -Level "INFO"

    for ($i = 1; $i -le $Config.RetryCount; $i++) {
        try {
            $status = tailscale funnel status --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($status -and $status.https) {
                $httpsUrl = $status.https | Where-Object { $_ -match ":\/\/" } | Select-Object -First 1
                if ($httpsUrl) {
                    $url = $httpsUrl.TrimEnd('/')
                    Write-Log "Tailscale URL: $url" -Level "OK"
                    return $url
                }
            }
        } catch {
            Write-Log "Tailscale status error: $_" -Level "WARN"
        }

        Write-Log "Waiting for Tailscale... ($i/$Config.RetryCount)"
        Start-Sleep -Seconds $Config.RetryDelay
    }

    Write-Log "Tailscale URL timeout" -Level "ERROR"
    return $null
}

function Start-WebhookServer {
    Write-Log "Starting LINE webhook server..." -Level "INFO"

    $webhookScript = "$PSScriptRoot\..\extensions\line-ai-bridge\dist\src\webhook-server.js"
    if (-not (Test-Path $webhookScript)) {
        $webhookScript = "$PSScriptRoot\extensions\line-ai-bridge\dist\src\webhook-server.js"
    }

    if (-not (Test-Path $webhookScript)) {
        Write-Log "webhook-server.js not found - skipping" -Level "WARN"
        return $true
    }

    $existingProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match "webhook" -or $_.CommandLine -match "line-ai-bridge" }

    if ($existingProcess) {
        Write-Log "Webhook server already running" -Level "OK"
        return $true
    }

    Write-Log "Starting webhook-server.js..." -Level "INFO"
    Start-Process -FilePath "node" -ArgumentList $webhookScript -WindowStyle Hidden -ErrorAction Stop
    Start-Sleep -Seconds 3

    Write-Log "Webhook server started" -Level "OK"
    return $true
}

function Start-OpenClawGateway {
    Write-Log "Starting OpenClaw Gateway..." -Level "INFO"

    $logFile = "$($Config.LogDir)\openclaw-$(Get-Date -Format 'yyyyMMdd').log"

    $existingProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match "openclaw" }

    if ($existingProcess) {
        Write-Log "OpenClaw Gateway already running" -Level "OK"
        return $true
    }

    if (Test-Command "pnpm") {
        Start-Process -FilePath "pnpm" -ArgumentList @("openclaw", "gateway", "--port", $Config.GatewayPort, "--verbose") `
            -WindowStyle Hidden -RedirectStandardOutput $logFile -RedirectStandardError $logFile
        Write-Log "OpenClaw Gateway starting..." -Level "OK"
        return $true
    }

    if (Test-Command "openclaw") {
        Start-Process -FilePath "openclaw" -ArgumentList @("gateway", "--port", $Config.GatewayPort, "--verbose") `
            -WindowStyle Hidden -RedirectStandardOutput $logFile -RedirectStandardError $logFile
        Write-Log "OpenClaw Gateway starting..." -Level "OK"
        return $true
    }

    Write-Log "openclaw/pnpm not found - skipping" -Level "WARN"
    return $true
}

function Open-LineDevelopersWithWebhook {
    param([string]$WebhookUrl)

    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "Webhook URL Setup" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Copy this URL:" -ForegroundColor Yellow
    Write-Host "$WebhookUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Steps:" -ForegroundColor Yellow
    Write-Host "1. Open https://developers.line.me/console/providers/" -ForegroundColor White
    Write-Host "2. Select your Messaging API channel" -ForegroundColor White
    Write-Host "3. Paste URL into 'Webhook URL' field" -ForegroundColor White
    Write-Host "4. Click 'Verify' button" -ForegroundColor White
    Write-Host "5. Turn ON 'Use webhook' switch" -ForegroundColor White
    Write-Host ""

    try {
        Start-Process "https://developers.line.me/console/providers/"
        Write-Log "Opened LINE Developers Console" -Level "OK"
    } catch {
        Write-Log "Could not open browser" -Level "WARN"
    }
}

# Main
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "OpenClaw + LINE Full Auto Setup (Tailscale)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $Config.LogDir)) {
    New-Item -ItemType Directory -Path $Config.LogDir -Force | Out-Null
}

Write-Log "=== Auto Setup Started ===" -Level "INFO"

# Step 1: LINE Tokens
Write-Host ""
Write-Host "[1/5] LINE Tokens" -ForegroundColor Yellow
$tokens = Get-LineTokens
if (-not $tokens) {
    exit 1
}

# Step 2: Save Config
Write-Host ""
Write-Host "[2/5] OpenClaw Config" -ForegroundColor Yellow
Save-OpenClawConfig -Tokens $tokens

# Step 3: Tailscale Funnel
Write-Host ""
Write-Host "[3/5] Tailscale Funnel (HTTPS)" -ForegroundColor Yellow
$funnelResult = Start-TailscaleFunnel
if (-not $funnelResult) {
    Write-Host ""
    Write-Host "WARNING: Tailscale Funnel failed" -ForegroundColor Yellow
    Write-Host "Make sure Tailscale is logged in and connected" -ForegroundColor Gray
}

# Step 4: Get HTTPS URL
Write-Host ""
Write-Host "[4/5] Getting HTTPS URL" -ForegroundColor Yellow
$tailscaleUrl = Get-TailscaleUrl

# Step 5: Start Services
Write-Host ""
Write-Host "[5/5] Starting Services" -ForegroundColor Yellow
Start-WebhookServer
Start-OpenClawGateway

# Result
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

if ($tailscaleUrl) {
    $webhookUrl = "$tailscaleUrl$($Config.WebhookPath)"
    Write-Host "Webhook URL: $webhookUrl" -ForegroundColor Cyan
    Write-Host ""
    Open-LineDevelopersWithWebhook -WebhookUrl $webhookUrl
} else {
    Write-Host "Tailscale HTTPS URL not available yet" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To get URL later, run:" -ForegroundColor Gray
    Write-Host "  tailscale funnel status --json" -ForegroundColor Gray
}

Write-Host ""
Write-Log "=== Auto Setup Complete ===" -Level "INFO"
