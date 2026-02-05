#!/usr/bin/env pwsh
# OpenClaw LINE Bot Power-On Auto-Start
# 電源投入時にLINEボットを自動起動

$ErrorActionPreference = "Continue"
$script:ProgressPreference = "SilentlyContinue"

$Config = @{
    ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    GatewayPort = 3000
    WebhookPath = "/line/webhook"
    LogDir = "$env:USERPROFILE\.openclaw\logs"
    ConfigDir = "$env:USERPROFILE\.openclaw"
    NgrokApiUrl = "http://localhost:4040/api/tunnels"
    RetryCount = 10
    RetryDelay = 3
}

$Global:LogFile = "$($Config.LogDir)\openclaw-poweron-$(Get-Date -Format 'yyyyMMdd').log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logLine = "[$timestamp] [$Level] $Message"
    Write-Host $logLine
    Add-Content -Path $Global:LogFile -Value $logLine -ErrorAction SilentlyContinue
}

function Test-Command {
    param([string]$Name)
    try { Get-Command $Name -ErrorAction Stop | Out-Null; return $true } catch { return $false }
}

function Initialize-Environment {
    Write-Log "Initializing environment..." -Level "INFO"
    
    if (-not (Test-Path $Config.LogDir)) {
        New-Item -ItemType Directory -Path $Config.LogDir -Force | Out-Null
    }
    
    if (-not (Test-Path $Config.ConfigDir)) {
        New-Item -ItemType Directory -Path $Config.ConfigDir -Force | Out-Null
    }
    
    Write-Log "Environment initialized" -Level "OK"
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
        Write-Log "ngrok not found, installing via winget..." -Level "WARN"
        try {
            winget install --id=ngrok.ngrok -e --source winget 2>&1 | Out-Null
            Start-Sleep -Seconds 5
        } catch {
            Write-Log "ngrok installation failed: $_" -Level "ERROR"
            return $false
        }
    }
    
    try {
        Start-Process -FilePath "ngrok" -ArgumentList @("http", $Config.GatewayPort, "--bind-tls", "true") `
            -WindowStyle Hidden -ErrorAction Stop
        Write-Log "ngrok starting..." -Level "INFO"
        Start-Sleep -Seconds 8
        return $true
    } catch {
        Write-Log "ngrok start failed: $_" -Level "ERROR"
        return $false
    }
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
    
    $webhookScript = "$($Config.ScriptDir)\extensions\line-ai-bridge\dist\src\webhook-server.js"
    
    if (-not (Test-Path $webhookScript)) {
        Write-Log "webhook-server.js not found: $webhookScript" -Level "WARN"
        Write-Host "Build extension first: pnpm build" -ForegroundColor Yellow
        return $false
    }
    
    $existingProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match "webhook" -or $_.CommandLine -match "line-ai-bridge" }
    
    if ($existingProcess) {
        Write-Log "Webhook server already running" -Level "OK"
        return $true
    }
    
    try {
        Start-Process -FilePath "node" -ArgumentList $webhookScript -WindowStyle Hidden -ErrorAction Stop
        Start-Sleep -Seconds 3
        Write-Log "Webhook server started" -Level "OK"
        return $true
    } catch {
        Write-Log "Webhook server start failed: $_" -Level "ERROR"
        return $false
    }
}

function Start-OpenClawGateway {
    Write-Log "Starting OpenClaw Gateway..." -Level "INFO"
    
    $logFile = "$($Config.LogDir)\openclaw-gateway.log"
    
    $existingProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match "openclaw" }
    
    if ($existingProcess) {
        Write-Log "OpenClaw Gateway already running" -Level "OK"
        return $true
    }
    
    if (Test-Command "pnpm") {
        Start-Process -FilePath "pnpm" -ArgumentList @("openclaw", "gateway", "--port", $Config.GatewayPort, "--verbose") `
            -WindowStyle Hidden -RedirectStandardOutput $logFile -RedirectStandardError $logFile -ErrorAction Stop
        Write-Log "OpenClaw Gateway starting with pnpm..." -Level "OK"
        Start-Sleep -Seconds 5
        return $true
    }
    
    if (Test-Command "openclaw") {
        Start-Process -FilePath "openclaw" -ArgumentList @("gateway", "--port", $Config.GatewayPort, "--verbose") `
            -WindowStyle Hidden -RedirectStandardOutput $logFile -RedirectStandardError $logFile -ErrorAction Stop
        Write-Log "OpenClaw Gateway starting..." -Level "OK"
        Start-Sleep -Seconds 5
        return $true
    }
    
    Write-Log "openclaw command not found" -Level "ERROR"
    return $false
}

function Check-Services {
    Write-Log "Checking services..." -Level "INFO"
    
    $services = @(
        @{ Name = "node (gateway)"; Pattern = "openclaw" },
        @{ Name = "ngrok"; Pattern = "ngrok" },
        @{ Name = "webhook server"; Pattern = "webhook" }
    )
    
    $allRunning = $true
    foreach ($service in $services) {
        $running = Get-Process -Name "node" -ErrorAction SilentlyContinue |
            Where-Object { $_.CommandLine -match $service.Pattern } |
            Select-Object -First 1
        
        if ($service.Name -eq "ngrok") {
            $running = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
        }
        
        $status = if ($running) { "✓ Running" } else { "✗ Not running" }
        Write-Host "  $($service.Name): $status" -ForegroundColor $(if ($running) { "Green" } else { "Red" })
        
        if (-not $running) { $allRunning = $false }
    }
    
    return $allRunning
}

function Show-WebhookUrl {
    param([string]$WebhookUrl)
    
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "LINE Bot Power-On Auto-Start Complete!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Webhook URL: $WebhookUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Copy the Webhook URL above" -ForegroundColor White
    Write-Host "2. Open LINE Developers Console" -ForegroundColor White
    Write-Host "3. Set Webhook URL in channel settings" -ForegroundColor White
    Write-Host "4. Enable 'Use webhook'" -ForegroundColor White
    Write-Host ""
    Write-Host "Log file: $Global:LogFile" -ForegroundColor Gray
    Write-Host ""
}

# Main
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "OpenClaw LINE Bot Power-On Auto-Start" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Log "=== Power-On Auto-Start Started ===" -Level "INFO"

Initialize-Environment

Write-Host ""
Write-Host "[1/5] Starting ngrok (HTTPS tunnel)..." -ForegroundColor Yellow
Start-Ngrok

Write-Host ""
Write-Host "[2/5] Getting Webhook URL..." -ForegroundColor Yellow
$ngrokUrl = Get-NgrokUrl
if (-not $ngrokUrl) {
    Write-Log "Failed to get ngrok URL" -Level "ERROR"
    exit 1
}
$webhookUrl = "$ngrokUrl$($Config.WebhookPath)"

Write-Host ""
Write-Host "[3/5] Starting LINE webhook server..." -ForegroundColor Yellow
Start-WebhookServer

Write-Host ""
Write-Host "[4/5] Starting OpenClaw Gateway..." -ForegroundColor Yellow
Start-OpenClawGateway

Write-Host ""
Write-Host "[5/5] Checking services..." -ForegroundColor Yellow
Check-Services

Show-WebhookUrl -WebhookUrl $webhookUrl

Write-Log "=== Power-On Auto-Start Complete ===" -Level "INFO"
