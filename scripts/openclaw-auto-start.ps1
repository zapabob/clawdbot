#!/usr/bin/env pwsh
# OpenClaw auto-start script with Tailscale and LINE auto-pairing

$ErrorActionPreference = "Stop"
$script:ProgressPreference = "SilentlyContinue"

$Config = @{
    Port = 18789
    LogDir = "$env:USERPROFILE\.openclaw\logs"
    ConfigDir = "$env:USERPROFILE\.openclaw"
    RetryCount = 3
    RetryDelay = 5
    PairingTimeout = 60
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logLine = "[$timestamp] [$Level] $Message"
    Write-Host $logLine
    Add-Content -Path "$($Config.LogDir)\openclaw-auto.log" -Value $logLine -ErrorAction SilentlyContinue
}

function Test-Command {
    param([string]$Name)
    try { Get-Command $Name -ErrorAction Stop | Out-Null; return $true } catch { return $false }
}

function Start-TailscaleFunnel {
    Write-Log "Starting Tailscale Funnel..." -Level "INFO"

    $status = tailscale funnel status 2>$null
    if ($status -match "18789") {
        Write-Log "Tailscale Funnel already running" -Level "OK"
        return $true
    }

    $result = tailscale funnel --bg $Config.Port 2>&1
    if ($LASTEXITCODE -eq 0) {
        Start-Sleep -Seconds 3
        Write-Log "Tailscale Funnel started" -Level "OK"
        return $true
    }

    Write-Log "Tailscale Funnel failed: $result" -Level "ERROR"
    return $false
}

function Get-WebhookUrl {
    Write-Log "Getting Webhook URL..." -Level "INFO"

    for ($i = 1; $i -le $Config.RetryCount; $i++) {
        try {
            $status = tailscale funnel status --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($status -and $status.https) {
                $httpsUrl = $status.https | Where-Object { $_ -match ":\/\/" } | Select-Object -First 1
                if ($httpsUrl) {
                    $webhookUrl = $httpsUrl.TrimEnd('/') + "/line/webhook"
                    Write-Log "Webhook URL: $webhookUrl" -Level "OK"
                    return $webhookUrl
                }
            }
        } catch { }

        Write-Log "Attempt $i/$Config.RetryCount: waiting..."
        Start-Sleep -Seconds $Config.RetryDelay
    }

    Write-Log "Webhook URL timeout" -Level "ERROR"
    return $null
}

function Start-OpenClawGateway {
    Write-Log "Starting OpenClaw Gateway..." -Level "INFO"

    $logFile = "$($Config.LogDir)\openclaw-$(Get-Date -Format 'yyyyMMdd').log"

    Get-Process -Name "node" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match "openclaw" } |
        Stop-Process -Force -ErrorAction SilentlyContinue

    if (Test-Command "pnpm") {
        Write-Log "Starting with pnpm..." -Level "INFO"
        Start-Process -FilePath "pnpm" -ArgumentList @("openclaw", "gateway", "--port", $Config.Port, "--verbose") `
            -WindowStyle Hidden -RedirectStandardOutput $logFile -RedirectStandardError $logFile
        Write-Log "OpenClaw Gateway started" -Level "OK"
        return $true
    }

    if (Test-Command "openclaw") {
        Write-Log "Starting with openclaw..." -Level "INFO"
        Start-Process -FilePath "openclaw" -ArgumentList @("gateway", "--port", $Config.Port, "--verbose") `
            -WindowStyle Hidden -RedirectStandardOutput $logFile -RedirectStandardError $logFile
        Write-Log "OpenClaw Gateway started" -Level "OK"
        return $true
    }

    Write-Log "openclaw command not found" -Level "ERROR"
    return $false
}

function Approve-Pairing {
    param([string]$LogFile)

    Write-Log "Searching for pairing code..." -Level "INFO"

    $timeout = $Config.PairingTimeout
    $startTime = Get-Date

    while ((Get-Date) - $startTime -lt [TimeSpan]::FromSeconds($timeout)) {
        try {
            $pairingLine = Get-Content $LogFile -Tail 50 -ErrorAction SilentlyContinue |
                Where-Object { $_ -match "pairing.*line.*code" -or $_ -match "LINE.*pairing" } |
                Select-Object -Last 1

            if ($pairingLine -match "([A-Z0-9]{6,})") {
                $code = $matches[1]
                Write-Log "Found pairing code: $code" -Level "OK"

                $result = openclaw pairing approve line $code 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "Pairing approved" -Level "OK"
                    return $true
                }
            }
        } catch { }

        Write-Log "Waiting for pairing... ($timeout sec remaining)"
        Start-Sleep -Seconds 5
        $timeout -= 5
    }

    Write-Log "Pairing timeout" -Level "WARN"
    return $false
}

# Main
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "OpenClaw Auto-Start Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $Config.LogDir)) {
    New-Item -ItemType Directory -Path $Config.LogDir -Force | Out-Null
}

Write-Log "=== OpenClaw Auto-Start ===" -Level "INFO"

# Step 1: Tailscale
Write-Host ""
Write-Host "[1/4] Tailscale Funnel" -ForegroundColor Yellow
if (-not (Start-TailscaleFunnel)) {
    exit 1
}

# Step 2: Webhook URL
Write-Host ""
Write-Host "[2/4] Webhook URL" -ForegroundColor Yellow
$webhookUrl = Get-WebhookUrl
if (-not $webhookUrl) {
    exit 1
}

# Step 3: Gateway
Write-Host ""
Write-Host "[3/4] OpenClaw Gateway" -ForegroundColor Yellow
if (-not (Start-OpenClawGateway)) {
    exit 1
}

Start-Sleep -Seconds 10

# Step 4: Pairing
Write-Host ""
Write-Host "[4/4] LINE Pairing" -ForegroundColor Yellow
$logFile = "$($Config.LogDir)\openclaw-$(Get-Date -Format 'yyyyMMdd').log"
$pairingResult = Approve-Pairing -LogFile $logFile

# Summary
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Auto-Start Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Webhook URL: $webhookUrl" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Set LINE Webhook URL in LINE Developers Console" -ForegroundColor White
Write-Host "2. Send message from LINE app" -ForegroundColor White
Write-Host "3. AI assistant will respond" -ForegroundColor White
Write-Host ""

Write-Log "=== OpenClaw Auto-Start Complete ===" -Level "INFO"
