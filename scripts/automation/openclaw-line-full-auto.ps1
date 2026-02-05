#!/usr/bin/env pwsh
# OpenClaw + LINE Full Auto Setup Script

$ErrorActionPreference = "Stop"
$script:ProgressPreference = "SilentlyContinue"

$Config = @{
    GatewayPort = 3000
    WebhookPath = "/line/webhook"
    LogDir = "$env:USERPROFILE\.openclaw\logs"
    ConfigDir = "$env:USERPROFILE\.openclaw"
    RetryCount = 10
    RetryDelay = 3
    NgrokApiUrl = "http://localhost:4040/api/tunnels"
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
        Write-Host "Set environment variables:" -ForegroundColor Yellow
        Write-Host "  `$env:LINE_CHANNEL_ACCESS_TOKEN = 'your-token'" -ForegroundColor Gray
        Write-Host "  `$env:LINE_CHANNEL_SECRET = 'your-secret'" -ForegroundColor Gray
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

    $config | ConvertTo-Json -Depth 10 | Set-Content $configFile -Encoding UTF8

    Write-Log "Config saved: $configFile" -Level "OK"
    return $true
}

function Start-Ngrok {
    Write-Log "Starting ngrok..." -Level "INFO"

    $ngrokProcess = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
    if ($ngrokProcess) {
        Write-Log "ngrok already running" -Level "OK"
        return $true
    }

    if (-not (Test-Command "ngrok")) {
        Write-Log "ngrok not found" -Level "ERROR"
        Write-Host "Install ngrok: https://ngrok.com/download" -ForegroundColor Red
        return $false
    }

    Start-Process -FilePath "ngrok" -ArgumentList @("http", $Config.GatewayPort, "--bind-tls", "true") `
        -WindowStyle Hidden -ErrorAction Stop

    Write-Log "ngrok starting..." -Level "INFO"
    Start-Sleep -Seconds 5

    return $true
}

function Get-NgrokUrl {
    Write-Log "Getting ngrok URL..." -Level "INFO"

    for ($i = 1; $i -le $Config.RetryCount; $i++) {
        try {
            $response = Invoke-RestMethod -Uri $Config.NgrokApiUrl -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response -and $response.tunnels) {
                $httpsTunnel = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
                if ($httpsTunnel) {
                    $url = $httpsTunnel.public_url.TrimEnd('/')
                    Write-Log "ngrok URL: $url" -Level "OK"
                    return $url
                }
            }
        } catch {
            Write-Log "ngrok API error: $_" -Level "WARN"
        }

        Write-Log "Waiting... ($i/$Config.RetryCount)"
        Start-Sleep -Seconds $Config.RetryDelay
    }

    Write-Log "ngrok URL timeout" -Level "ERROR"
    return $null
}

function Start-WebhookServer {
    Write-Log "Starting LINE webhook server..." -Level "INFO"

    $webhookScript = "$PSScriptRoot\..\extensions\line-ai-bridge\dist\src\webhook-server.js"
    if (-not (Test-Path $webhookScript)) {
        $webhookScript = "$PSScriptRoot\extensions\line-ai-bridge\dist\src\webhook-server.js"
    }

    if (-not (Test-Path $webhookScript)) {
        Write-Log "webhook-server.js not found" -Level "WARN"
        Write-Host "Build extension first: pnpm build" -ForegroundColor Yellow
        return $false
    }

    $existingProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match "webhook" -or $_.CommandLine -match "line-ai-bridge" }

    if ($existingProcess) {
        Write-Log "Webhook server already running" -Level "OK"
        return $true
    }

    Start-Process -FilePath "node" -ArgumentList $webhookScript -WindowStyle Hidden -ErrorAction Stop
    Start-Sleep -Seconds 3

    Write-Log "Webhook server started" -Level "OK"
    return $true
}

function Open-LineDevelopersWithWebhook {
    param([string]$WebhookUrl)

    Write-Log "Opening LINE Developers Console..." -Level "INFO"

    $providersUrl = "https://developers.line.me/console/providers/"

    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "Webhook URL Setup" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "URL: $WebhookUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Steps:" -ForegroundColor Yellow
    Write-Host "1. Copy the URL above" -ForegroundColor White
    Write-Host "2. Open https://developers.line.me/console/providers/" -ForegroundColor White
    Write-Host "3. Select your Messaging API channel" -ForegroundColor White
    Write-Host "4. Paste into 'Webhook URL' field" -ForegroundColor White
    Write-Host "5. Click 'Verify'" -ForegroundColor White
    Write-Host "6. Turn ON 'Use webhook'" -ForegroundColor White
    Write-Host ""

    try {
        Start-Process $providersUrl
        Write-Log "Browser opened" -Level "OK"
    } catch {
        Write-Log "Browser error: $_" -Level "WARN"
    }

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

    Write-Log "openclaw/pnpm not found" -Level "ERROR"
    return $false
}

# Main
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "OpenClaw + LINE Full Auto Setup" -ForegroundColor Cyan
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

# Step 2: Save Config
Write-Host ""
Write-Host "[2/5] OpenClaw Config" -ForegroundColor Yellow
if ($tokens) {
    Save-OpenClawConfig -Tokens $tokens
} else {
    Write-Log "Skipping token config" -Level "WARN"
}

# Step 3: ngrok
Write-Host ""
Write-Host "[3/5] ngrok (HTTPS Tunnel)" -ForegroundColor Yellow
if (-not (Start-Ngrok)) {
    Write-Host "Install ngrok: https://ngrok.com/download" -ForegroundColor Red
    exit 1
}

# Step 4: Webhook URL
Write-Host ""
Write-Host "[4/5] Get Webhook URL" -ForegroundColor Yellow
$ngrokUrl = Get-NgrokUrl
if (-not $ngrokUrl) {
    Write-Log "Failed to get webhook URL" -Level "ERROR"
    exit 1
}
$webhookUrl = "$ngrokUrl$($Config.WebhookPath)"

# Step 5: Start Services
Write-Host ""
Write-Host "[5/5] Start Services" -ForegroundColor Yellow
Start-WebhookServer
Start-OpenClawGateway

# Show Result
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Webhook URL: $webhookUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy the URL above" -ForegroundColor White
Write-Host "2. Open LINE Developers Console" -ForegroundColor White
Write-Host "3. Set Webhook URL" -ForegroundColor White
Write-Host ""

Open-LineDevelopersWithWebhook -WebhookUrl $webhookUrl

Write-Host ""
Write-Log "=== Auto Setup Complete ===" -Level "INFO"
