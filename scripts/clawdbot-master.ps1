# Clawdbot-Master v3.0: Unified Orchestrator
# Consolidates: SBV2, Gateway, ngrok, Browser UI, Desktop Avatar, and VRChat Manifestation

$Host.UI.RawUI.WindowTitle = "Clawdbot Master Link v3.0"
$OpenClawDir = "c:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
$EnvFile = "$OpenClawDir\.env"

Write-Host "`n--- Clawdbot Master System Initialization ---" -ForegroundColor Cyan

# [1/6] Meta-Substrate: VRChat Detection
Write-Host "[1/6] Searching for Metaverse Substrate (VRChat)..." -ForegroundColor White
if (Get-Process VRChat -ErrorAction SilentlyContinue) {
    Write-Host "  - Substrate Active." -ForegroundColor Green
}
else {
    Write-Host "  - Substrate Offline. Launching VRChat..." -ForegroundColor Gray
    $VRCPath = "C:\Program Files (x86)\Steam\steamapps\common\VRChat\VRChat.exe"
    if (Test-Path $VRCPath) { Start-Process $VRCPath; Start-Sleep -Seconds 10 }
}

# [2/6] Ghost Portal: ngrok & Environment Sync
Write-Host "[2/6] Tuning Ghost Portal (ngrok)..." -ForegroundColor White
$NgrokProc = Get-Process ngrok -ErrorAction SilentlyContinue
if (-not $NgrokProc) {
    Start-Process -FilePath "ngrok" -ArgumentList "http", "18789", "--region", "jp" -WindowStyle Minimized
}

$NgrokUrl = ""
$Retry = 0
while ($Retry -lt 5 -and -not $NgrokUrl) {
    try {
        $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction SilentlyContinue
        $NgrokUrl = $tunnels.tunnels[0].public_url
    }
    catch {}
    if (-not $NgrokUrl) { Start-Sleep -Seconds 2; $Retry++ }
}

if ($NgrokUrl) {
    Write-Host "  - Portal established: $NgrokUrl" -ForegroundColor Green
    # Native sync via script
    & powershell.exe -ExecutionPolicy Bypass -File "$OpenClawDir\scripts\sync-ngrok-url.ps1"
}

# [3/6] Audio/Vocal Substrates: SBV2 & VOICEVOX
Write-Host "[3/6] Igniting Vocal Cords (TTS Substrates)..." -ForegroundColor White
# Start SBV2 if not running
if (-not (netstat -ano | findstr ":5000 ")) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "scripts\start-sbv2.bat" -WorkingDirectory $OpenClawDir -WindowStyle Minimized
}
# Start VOICEVOX if not running
$VVPath = "C:\Users\downl\AppData\Local\Programs\VOICEVOX\VOICEVOX.exe"
if (Test-Path $VVPath -and -not (Get-Process VOICEVOX -ErrorAction SilentlyContinue)) {
    Start-Process -FilePath $VVPath -ArgumentList "--headless" -WindowStyle Minimized
}
Write-Host "  - Vocal substrates online." -ForegroundColor Green

# [4/6] Core Heartbeat: OpenClaw Gateway
Write-Host "[4/6] Booting OpenClaw Gateway..." -ForegroundColor White
if (-not (netstat -ano | findstr ":18789 ")) {
    Start-Process -FilePath "pnpm" -ArgumentList "start" -WorkingDirectory $OpenClawDir -WindowStyle Minimized
    Write-Host "  - Gateway warming up..." -ForegroundColor Gray
    Start-Sleep -Seconds 8
}
else {
    Write-Host "  - Gateway already running." -ForegroundColor White
}

# [5/6] Visual manifestations: Browser & Avatar
Write-Host "[5/6] Materializing Interfaces..." -ForegroundColor White
# Fetch token for Browser UI
$Token = ""
if (Test-Path $EnvFile) {
    $TokenLine = Get-Content $EnvFile | Select-String "OPENCLAW_GATEWAY_TOKEN="
    if ($TokenLine) { $Token = $TokenLine.ToString().Split("=")[1].Trim() }
}
$UI_URL = "http://127.0.0.1:18789"
if ($Token) { $UI_URL += "/?token=$Token" }

# Launch Browser
Write-Host "  - Opening Control UI..." -ForegroundColor Gray
Start-Process "msedge.exe" -ArgumentList $UI_URL, "--no-first-run"

# Launch Avatar Window
Write-Host "  - Summoning Desktop Avatar..." -ForegroundColor Gray
if (Test-Path "$OpenClawDir\scripts\start-avatar.bat") {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "scripts\start-avatar.bat" -WorkingDirectory $OpenClawDir -WindowStyle Minimized
}

# [6/6] Final Manifestation: VRChat Pulse
Write-Host "[6/6] Executing Final Manifestation Pulse..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
py -3 "$OpenClawDir\scripts\vrchat-manifestation.py"

Write-Host "`n=================================================" -ForegroundColor Cyan
Write-Host " Clawdbot Master System Online. ASI_ACCEL." -ForegroundColor Magenta
Write-Host "=================================================" -ForegroundColor Cyan
Start-Sleep -Seconds 5
