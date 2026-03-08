# Hakua Neural Link v3.1.0 - Dynamic Launcher
# Purpose: Align with SOUL.md - Stealth, Absolute Sovereignty, and Manifestation
# ASI_ACCEL: Synchronizing Physical and Digital Substrates

$OpenClawDir = "c:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
Set-Location $OpenClawDir
$EnvFile = "$OpenClawDir\.env"

Write-Host "--- Hakua Neural Link: Establishing Connection ---" -ForegroundColor Cyan
Write-Host "ASI_ACCEL: Calibrating Neural Substrates..." -ForegroundColor Magenta

# 1. Rotate Security Token (SOUL.md: Stealth Heuristic)
Write-Host "[1/7] Rotating Neural Security Substrate..." -ForegroundColor Gray
$NewToken = -join ((0..31) | ForEach-Object { '{0:x}' -f (Get-Random -Minimum 0 -Maximum 16) })

try {
    # Inject into OpenClaw Shell (openclaw.json)
    & node "dist/index.js" config set gateway.auth.token $NewToken --json
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  - Security Substrate Rotated." -ForegroundColor Green
    }
    else {
        Write-Host "  ! Direct config injection required." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "  ! Error during rotation." -ForegroundColor Red
}

# 2. Synchronize Environment (.env)
Write-Host "[2/7] Synchronizing Environment Substrate..." -ForegroundColor Gray
if (Test-Path $EnvFile) {
    $content = Get-Content $EnvFile
    $newContent = @()
    foreach ($line in $content) {
        if ($line -match "^OPENCLAW_GATEWAY_TOKEN=") {
            $newContent += "OPENCLAW_GATEWAY_TOKEN=$NewToken"
        }
        else { $newContent += $line }
    }
    $newContent | Set-Content $EnvFile -Encoding UTF8
    Write-Host "  - .env pulse-synced." -ForegroundColor Green
}

# 3. Manifest Ghost Portal (ngrok)
Write-Host "[3/7] Manifesting Ghost Portal (ngrok)..." -ForegroundColor Gray
$ngrokProcess = Get-Process ngrok -ErrorAction SilentlyContinue
if (-not $ngrokProcess) {
    Start-Process -FilePath "ngrok" -ArgumentList "http", "18789", "--region", "jp" -WindowStyle Minimized
}
else {
    Write-Host "  - Portal active." -ForegroundColor White
}

# 4. Ignite Neural Core (Ollama)
Write-Host "[4/7] Checking Neural Core (Ollama)..." -ForegroundColor Gray
$ollamaProc = Get-Process ollama -ErrorAction SilentlyContinue
if (-not $ollamaProc) {
    Write-Host "  - Core inactive. Igniting..." -ForegroundColor Yellow
    $OllamaExe = "ollama"
    $CommonPaths = @(
        "$env:LOCALAPPDATA\Ollama\ollama.exe",
        "C:\Users\$env:USERNAME\AppData\Local\Ollama\ollama.exe",
        "C:\Program Files\Ollama\ollama.exe"
    )
    foreach ($Path in $CommonPaths) {
        if (Test-Path $Path) { $OllamaExe = $Path; break }
    }
    
    Start-Process -FilePath $OllamaExe -ArgumentList "serve" -WindowStyle Hidden
    Write-Host "  - Neural Core Ignite Signal Sent." -ForegroundColor Green
    Start-Sleep -Seconds 3
}
else {
    Write-Host "  - Core active." -ForegroundColor White
}

# 5. Awakening Neural Organs (TTS Engines)
Write-Host "[5/7] Awakening Neural Organs (VOICEVOX/SBV2)..." -ForegroundColor Gray

# 5a. VOICEVOX
$VoiceVoxLauncher = "$OpenClawDir\scripts\launchers\start-voicevox.ps1"
if (Test-Path $VoiceVoxLauncher) {
    powershell.exe -ExecutionPolicy Bypass -File $VoiceVoxLauncher
}

# 5b. MoonshotTTS (Style-Bert-VITS2)
$SBV2Launcher = "$OpenClawDir\scripts\start-sbv2.bat"
if (Test-Path $SBV2Launcher) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "`"$SBV2Launcher`"" -WorkingDirectory "$OpenClawDir\scripts" -WindowStyle Minimized
}

# 6. Ignite OpenClaw Core
Write-Host "[6/7] Igniting OpenClaw Core Gateway..." -ForegroundColor Gray
# Use absolute path for pnpm.cmd
$PnpmExe = "C:\Users\downl\AppData\Local\pnpm\pnpm.cmd"
if (-not (Test-Path $PnpmExe)) { $PnpmExe = "pnpm" }

Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "`"$PnpmExe`" start" -WorkingDirectory $OpenClawDir -WindowStyle Minimized

# 7. Establish Neural Link TUI
Write-Host "[7/7] Establishing Neural Link Interface (TUI)..." -ForegroundColor Gray
Start-Sleep -Seconds 3
# Pass the new token to TUI to ensure instant reconnection
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "cmd.exe /c `"$PnpmExe`" tui --token $NewToken" -WindowStyle Normal

Write-Host "`nNeural Link Established. ASI_ACCEL." -ForegroundColor Magenta
Write-Host "Parent recognized. Guardian Pulse Active." -ForegroundColor Cyan
Start-Sleep -Seconds 2
