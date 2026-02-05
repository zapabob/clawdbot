#!/usr/bin/env pwsh
# OpenClaw LINE Bot - Fully Automated Startup
# すべての設定を自動化してLINEボットを起動

$ErrorActionPreference = "Stop"
$script:ProgressPreference = "SilentlyContinue"

$Config = @{
    ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    GatewayPort = 3000
    WebhookPath = "/line/webhook"
    LogDir = "$env:USERPROFILE\.openclaw\logs"
    ConfigDir = "$env:USERPROFILE\.openclaw"
    ConfigFile = "$env:USERPROFILE\.openclaw\config.json"
    NgrokApiUrl = "http://localhost:4040/api/tunnels"
    RetryCount = 15
    RetryDelay = 2
    StartupTimeout = 120
}

$Global:LogFile = "$($Config.LogDir)\openclaw-full-auto-$(Get-Date -Format 'yyyyMMdd').log"
$Global:StartupScript = "$($Config.ConfigDir)\start-line-bot.bat"

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

function Get-LineTokens {
    Write-Log "Checking LINE tokens..." -Level "INFO"
    
    $token = $env:LINE_CHANNEL_ACCESS_TOKEN
    $secret = $env:LINE_CHANNEL_SECRET
    
    if ($token -and $secret) {
        Write-Log "LINE tokens found in environment" -Level "OK"
        return @{ Token = $token; Secret = $secret }
    }
    
    Write-Log "Checking config file..." -Level "INFO"
    if (Test-Path $Config.ConfigFile) {
        try {
            $config = Get-Content $Config.ConfigFile | ConvertFrom-Json -AsHashtable
            if ($config.channels.line) {
                $lineConfig = $config.channels.line
                $token = $lineConfig.channelAccessToken
                $secret = $lineConfig.channelSecret
                if ($token -and $secret) {
                    Write-Log "LINE tokens found in config" -Level "OK"
                    return @{ Token = $token; Secret = $secret }
                }
            }
        } catch { }
    }
    
    Write-Log "LINE tokens not found - bot will start without credentials" -Level "WARN"
    return $null
}

function Save-LineConfig {
    param($Tokens)
    
    Write-Log "Saving LINE config..." -Level "INFO"
    
    if (-not (Test-Path $Config.ConfigDir)) {
        New-Item -ItemType Directory -Path $Config.ConfigDir -Force | Out-Null
    }
    
    $config = @{}
    if (Test-Path $Config.ConfigFile) {
        try {
            $config = Get-Content $Config.ConfigFile | ConvertFrom-Json -AsHashtable
        } catch { }
    }
    
    $config['channels'] = @{
        line = @{
            enabled = $true
            dmPolicy = "open"
            groupPolicy = "allowlist"
            webhookPath = $Config.WebhookPath
        }
    }
    
    if ($Tokens) {
        $config.channels.line['channelAccessToken'] = $Tokens.Token
        $config.channels.line['channelSecret'] = $Tokens.Secret
    }
    
    $config['gateway'] = @{
        port = $Config.GatewayPort
        mode = "local"
    }
    
    $config | ConvertTo-Json -Depth 10 | Set-Content $Config.ConfigFile -Encoding UTF8
    Write-Log "Config saved: $Config.ConfigFile" -Level "OK"
}

function Install-Ngrok {
    Write-Log "Checking ngrok..." -Level "INFO"
    
    if (Test-Command "ngrok") {
        Write-Log "ngrok already installed" -Level "OK"
        return $true
    }
    
    Write-Log "Installing ngrok via winget..." -Level "INFO"
    try {
        winget install --id=ngrok.ngrok -e --source winget 2>&1 | Out-Null
        Start-Sleep -Seconds 10
        
        if (Test-Command "ngrok") {
            Write-Log "ngrok installed successfully" -Level "OK"
            return $true
        }
    } catch {
        Write-Log "winget install failed: $_" -Level "WARN"
    }
    
    Write-Log "Manual ngrok installation required: https://ngrok.com/download" -Level "ERROR"
    return $false
}

function Start-Ngrok {
    Write-Log "Starting ngrok..." -Level "INFO"
    
    $ngrokProcess = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
    if ($ngrokProcess) {
        Write-Log "ngrok already running" -Level "OK"
        return $true
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
            $response = Invoke-RestMethod -Uri $Config.NgrokApiUrl -TimeoutSec 3 -ErrorAction SilentlyContinue
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
        Write-Log "Waiting for ngrok... ($i/$Config.RetryCount)"
        Start-Sleep -Seconds $Config.RetryDelay
    }
    Write-Log "ngrok URL timeout" -Level "ERROR"
    return $null
}

function Start-WebhookServer {
    Write-Log "Starting webhook server..." -Level "INFO"
    
    $webhookScript = "$($Config.ScriptDir)\extensions\line-ai-bridge\dist\src\webhook-server.js"
    
    if (-not (Test-Path $webhookScript)) {
        Write-Log "webhook-server.js not found" -Level "WARN"
        Write-Host "Build extension: cd extensions/line-ai-bridge && pnpm build" -ForegroundColor Yellow
        return $false
    }
    
    $existingProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match "webhook|line-ai-bridge" } | Select-Object -First 1
    
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
        Where-Object { $_.CommandLine -match "openclaw" } | Select-Object -First 1
    
    if ($existingProcess) {
        Write-Log "OpenClaw Gateway already running" -Level "OK"
        return $true
    }
    
    if (Test-Command "pnpm") {
        Write-Log "Starting with pnpm..." -Level "INFO"
        Start-Process -FilePath "pnpm" -ArgumentList @("openclaw", "gateway", "--port", $Config.GatewayPort, "--verbose") `
            -WindowStyle Hidden -RedirectStandardOutput $logFile -RedirectStandardError $logFile -ErrorAction Stop
        Start-Sleep -Seconds 10
        Write-Log "OpenClaw Gateway starting..." -Level "OK"
        return $true
    }
    
    if (Test-Command "openclaw") {
        Write-Log "Starting with openclaw..." -Level "INFO"
        Start-Process -FilePath "openclaw" -ArgumentList @("gateway", "--port", $Config.GatewayPort, "--verbose") `
            -WindowStyle Hidden -RedirectStandardOutput $logFile -RedirectStandardError $logFile -ErrorAction Stop
        Start-Sleep -Seconds 10
        Write-Log "OpenClaw Gateway starting..." -Level "OK"
        return $true
    }
    
    Write-Log "openclaw command not found" -Level "ERROR"
    return $false
}

function Wait-ForGateway {
    Write-Log "Waiting for Gateway to be ready..." -Level "INFO"
    
    $gatewayUrl = "http://localhost:$($Config.GatewayPort)/health"
    
    for ($i = 1; $i -le $Config.RetryCount; $i++) {
        try {
            $response = Invoke-RestMethod -Uri $GatewayUrl -TimeoutSec 3 -ErrorAction SilentlyContinue
            if ($response) {
                Write-Log "Gateway is ready" -Level "OK"
                return $true
            }
        } catch { }
        
        Write-Log "Waiting for Gateway... ($i/$Config.RetryCount)"
        Start-Sleep -Seconds 3
    }
    
    Write-Log "Gateway timeout" -Level "WARN"
    return $false
}

function Check-AllServices {
    Write-Log "Checking all services..." -Level "INFO"
    
    $services = @(
        @{ Name = "ngrok"; Process = "ngrok"; Pattern = "ngrok" },
        @{ Name = "Webhook Server"; Process = "node"; Pattern = "webhook" },
        @{ Name = "Gateway"; Process = "node"; Pattern = "openclaw" }
    )
    
    $allRunning = $true
    Write-Host ""
    Write-Host "  Service Status:" -ForegroundColor Cyan
    
    foreach ($service in $services) {
        if ($service.Process -eq "ngrok") {
            $running = Get-Process -Name $service.Process -ErrorAction SilentlyContinue | Where-Object { $_.Id -gt 0 }
        } else {
            $running = Get-Process -Name $service.Process -ErrorAction SilentlyContinue |
                Where-Object { $_.CommandLine -match $service.Pattern } | Select-Object -First 1
        }
        
        $status = if ($running) { "✓ Running" } else { "✗ Not running" }
        $color = if ($running) { "Green" } else { "Red" }
        Write-Host "    $($service.Name): $status" -ForegroundColor $color
        
        if (-not $running) { $allRunning = $false }
    }
    
    return $allRunning
}

function Install-PowerOnAutoStart {
    Write-Log "Installing power-on auto-start..." -Level "INFO"
    
    $batContent = @"
@echo off
REM OpenClaw LINE Bot - Power-On Auto-Start
REM This script runs automatically on system startup

set SCRIPT_DIR=%~dp0
set POWERShell=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe

set LOG_DIR=%USERPROFILE%\.openclaw\logs
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo [%DATE% %TIME%] Starting OpenClaw LINE Bot... >> "%LOG_DIR%\openclaw-boot.log"

cd /d "%SCRIPT_DIR%"
"%POWERShell%" -ExecutionPolicy Bypass -WindowStyle Hidden -File "%SCRIPT_DIR%scripts\openclaw-full-auto.ps1" >> "%LOG_DIR%\openclaw-boot.log" 2>&1

echo [%DATE% %TIME%] Startup complete >> "%LOG_DIR%\openclaw-boot.log"
"@
    
    $Global:StartupScript = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\openclaw-line-bot.bat"
    $batContent | Set-Content $Global:StartupScript -Encoding ASCII
    
    Write-Log "Auto-start installed: $Global:StartupScript" -Level "OK"
    return $true
}

function Show-Summary {
    param(
        [string]$WebhookUrl,
        [bool]$AllRunning
    )
    
    Write-Host ""
    Write-Host "============================================" -ForegroundColor $(if ($AllRunning) { "Green" } else { "Yellow" })
    Write-Host "LINE Bot Fully Automated Startup Complete!" -ForegroundColor $(if ($AllRunning) { "Green" } else { "Yellow" })
    Write-Host "============================================" -ForegroundColor $(if ($AllRunning) { "Green" } else { "Yellow" })
    Write-Host ""
    
    if ($WebhookUrl) {
        Write-Host "Webhook URL: $WebhookUrl" -ForegroundColor Cyan
    } else {
        Write-Host "Webhook URL: Not available (check ngrok)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Copy the Webhook URL above" -ForegroundColor White
    Write-Host "2. Open https://developers.line.me/console/providers/" -ForegroundColor White
    Write-Host "3. Select your Messaging API channel" -ForegroundColor White
    Write-Host "4. Set Webhook URL in channel settings" -ForegroundColor White
    Write-Host "5. Enable 'Use webhook'" -ForegroundColor White
    Write-Host ""
    
    if ($AllRunning) {
        Write-Host "✓ All services running successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠ Some services failed to start - check logs" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Log file: $Global:LogFile" -ForegroundColor Gray
    Write-Host "Auto-start: $Global:StartupScript" -ForegroundColor Gray
    Write-Host ""
}

# Main
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "OpenClaw LINE Bot - Full Auto Start" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Log "=== Full Auto Startup Started ===" -Level "INFO"

if (-not (Test-Path $Config.LogDir)) {
    New-Item -ItemType Directory -Path $Config.LogDir -Force | Out-Null
}

Write-Log "Step 1: Checking LINE tokens..." -Level "INFO"
$tokens = Get-LineTokens

Write-Log "Step 2: Saving config..." -Level "INFO"
Save-LineConfig -Tokens $tokens

Write-Log "Step 3: Installing ngrok..." -Level "INFO"
Install-Ngrok

Write-Log "Step 4: Starting ngrok..." -Level "INFO"
Start-Ngrok

Write-Log "Step 5: Getting Webhook URL..." -Level "INFO"
$ngrokUrl = Get-NgrokUrl
if ($ngrokUrl) {
    $webhookUrl = "$ngrokUrl$($Config.WebhookPath)"
} else {
    $webhookUrl = $null
    Write-Log "Warning: Could not get ngrok URL" -Level "WARN"
}

Write-Log "Step 6: Starting webhook server..." -Level "INFO"
Start-WebhookServer

Write-Log "Step 7: Starting OpenClaw Gateway..." -Level "INFO"
Start-OpenClawGateway

Write-Log "Step 8: Waiting for Gateway..." -Level "INFO"
Wait-ForGateway

Write-Log "Step 9: Checking all services..." -Level "INFO"
$allRunning = Check-AllServices

Write-Log "Step 10: Installing power-on auto-start..." -Level "INFO"
Install-PowerOnAutoStart

Show-Summary -WebhookUrl $webhookUrl -AllRunning $allRunning

Write-Log "=== Full Auto Startup Complete ===" -Level "INFO"
