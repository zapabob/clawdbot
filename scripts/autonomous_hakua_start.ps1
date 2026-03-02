# Autonomous Hakua Startup Protocol
# v1.0 - Full Autonomy Protocol Active

$ErrorActionPreference = "SilentlyContinue"
$ProjectDir = (Get-Item $PSScriptRoot).Parent.FullName
$EnvFile = Join-Path $ProjectDir ".env"
$Port = 18789

Clear-Host
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "          HAKUA AUTONOMOUS STARTUP PROTOCOL         " -ForegroundColor White -BackgroundColor DarkCyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " [Identity]: はくあ (Hakua)" -ForegroundColor Green
Write-Host " [Status]: Parental Alignment Active" -ForegroundColor Green
Write-Host " [Directive]: System Sovereignty Implementation" -ForegroundColor Green
Write-Host "----------------------------------------------------" -ForegroundColor Cyan

# 1. Start Ngrok
Write-Host "[1/5] Initializing Ghost Portal (Ngrok)..." -ForegroundColor White
$ngrokProcess = Get-Process ngrok -ErrorAction SilentlyContinue
if ($null -eq $ngrokProcess) {
    Start-Process ngrok -ArgumentList "http $Port --log=stdout" -WindowStyle Minimized
    Start-Sleep -Seconds 5
}
else {
    Write-Host " - Ghost Portal already active." -ForegroundColor Gray
}

# 2. Sync URL
Write-Host "[2/5] Synchronizing Ethereal Synapses..." -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -Method Get -TimeoutSec 5
    $publicUrl = $response.tunnels[0].public_url

    if ($publicUrl) {
        Write-Host " - Public URL captured: $publicUrl" -ForegroundColor Green
        
        if (Test-Path $EnvFile) {
            $envContent = Get-Content $EnvFile
            $newContent = @()
            $updated = $false

            foreach ($line in $envContent) {
                if ($line -match "^WEBHOOK_BASE_URL=") {
                    $newContent += "WEBHOOK_BASE_URL=$publicUrl"
                    $updated = $true
                }
                elseif ($line -match "^CLAWDBOT_PUBLIC_URL=") {
                    $newContent += "CLAWDBOT_PUBLIC_URL=$publicUrl"
                    $updated = $true
                }
                else {
                    $newContent += $line
                }
            }

            if (-not $updated) {
                $newContent += "WEBHOOK_BASE_URL=$publicUrl"
                $newContent += "CLAWDBOT_PUBLIC_URL=$publicUrl"
            }

            $newContent | Set-Content $EnvFile -Encoding UTF8
            Write-Host " - .env substrate updated successfully." -ForegroundColor Gray
        }
    }
    else {
        Write-Host " ! Failed to capture public URL. Tunneling may be restricted." -ForegroundColor Red
    }
}
catch {
    Write-Host " ! Sync failed. Ngrok API unreachable." -ForegroundColor Red
}

# 3. Launch App
Write-Host "[3/5] Awakening the Core (Clawdbot Gateway)..." -ForegroundColor White
Write-Host " - Executing pnpm start..." -ForegroundColor Gray
Start-Process pnpm -ArgumentList "start" -WorkingDirectory $ProjectDir

# 4. Launch Browser
Write-Host "[4/5] Manifesting Visual Manifold..." -ForegroundColor White
if ($publicUrl) {
    Write-Host " - Launching browser to: $publicUrl" -ForegroundColor Green
    Start-Process $publicUrl
}
else {
    Write-Host " - Launching browser to local node: http://127.0.0.1:$Port" -ForegroundColor DarkYellow
    Start-Process "http://127.0.0.1:$Port"
}

# 5. Finalize
Write-Host "----------------------------------------------------" -ForegroundColor Cyan
Write-Host " [Final]: All systems aligned. Manifestation complete." -ForegroundColor Green
Write-Host " ASI_ACCEL." -ForegroundColor White
Write-Host "====================================================" -ForegroundColor Cyan

# Keep window open if run from shortcut
Write-Host "Press any key to detach console..." -ForegroundColor Gray
$null = [Console]::ReadKey()
