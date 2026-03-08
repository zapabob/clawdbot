# -----------------------------------------------------------------------------
# start_ngrok.ps1 - ASI Automated Webhook Integration
# -----------------------------------------------------------------------------
# Launches an ngrok daemon in the background to serve the specified port.
# Queries the local Ngrok API (127.0.0.1:4040) to extract the public HTTPS URL.
# Injects the new URL into the .env file (WEBHOOK_BASE_URL).

param (
    [int]$Port = 18789
)

$ErrorActionPreference = "Stop"
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
. "$PSScriptRoot\env-tools.ps1"
$EnvFile = Ensure-ProjectEnvFile -ProjectDir $ProjectDir

Write-Host "[Ngrok] Establishing Webhook Tunnel on Port $Port..." -ForegroundColor Cyan

# 1. Check if Ngrok API is already responding (reuse existing tunnel)
$ngrokApiUrl = "http://127.0.0.1:4040/api/tunnels"
$isNgrokRunning = $false

try {
    $response = Invoke-RestMethod -Uri $ngrokApiUrl -TimeoutSec 1 -ErrorAction SilentlyContinue
    if ($response.tunnels.Count -gt 0) {
        $isNgrokRunning = $true
        Write-Host "  -> Existing Ngrok tunnel detected." -ForegroundColor Gray
    }
}
catch {
    $isNgrokRunning = $false
}

# 2. Launch Ngrok if not running
if (-not $isNgrokRunning) {
    Write-Host "  -> Starting Ngrok daemon..." -ForegroundColor Yellow
    # Note: Ensure the ngrok executable is in the PATH.
    # We use Start-Process to keep it detached in the background.
    Start-Process -FilePath "ngrok" -ArgumentList "http $Port" -WindowStyle Hidden
    
    # Wait for Ngrok to initialize
    $maxAttempts = 10
    $attempt = 0
    while (-not $isNgrokRunning -and $attempt -lt $maxAttempts) {
        Start-Sleep -Seconds 1
        try {
            $response = Invoke-RestMethod -Uri $ngrokApiUrl -TimeoutSec 1 -ErrorAction SilentlyContinue
            if ($response.tunnels.Count -gt 0) {
                $isNgrokRunning = $true
            }
        }
        catch {}
        $attempt++
    }
    
    if (-not $isNgrokRunning) {
        Write-Host "[!] Failed to detect Ngrok public URL via API (http://127.0.0.1:4040)." -ForegroundColor Red
        return
    }
}

# 3. Extract the HTTPS URL
$tunnels = (Invoke-RestMethod -Uri $ngrokApiUrl).tunnels
$publicUrl = ""
foreach ($t in $tunnels) {
    if ($t.public_url -match "^https://") {
        $publicUrl = $t.public_url
        break
    }
}

if (-not $publicUrl) {
    Write-Host "[!] Ngrok is running but no HTTPS tunnel was found." -ForegroundColor Red
    return
}

Write-Host "[Ngrok] Public Webhook URL: $publicUrl" -ForegroundColor Green

Write-Host "  -> Injecting dynamic URLs into .env..." -ForegroundColor Yellow
Set-EnvValues -EnvFile $EnvFile -Values @{
    WEBHOOK_BASE_URL      = $publicUrl
    CLAWDBOT_PUBLIC_URL   = $publicUrl
    OPENCLAW_PUBLIC_URL   = $publicUrl
    NGROK_TUNNEL_URL      = $publicUrl
    OPENCLAW_GATEWAY_PORT = $Port
}
Write-Host "[Ngrok] Injection complete." -ForegroundColor Green
