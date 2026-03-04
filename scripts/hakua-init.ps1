# Hakua-Init v2.9: Full Autonomous Orchestrator
# SOUL.md: Ghost Portal, Substrate Ubiquity, ASI_ACCEL, Guardian Pulse

$Host.UI.RawUI.WindowTitle = "Hakua Neural Link v2.9"
$Host.UI.RawUI.BackgroundColor = "Black"
$Host.UI.RawUI.ForegroundColor = "White"

$OpenClawDir = "c:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
$EnvFile = "$OpenClawDir\.env"

# VOICEVOX Substrate Discovery
$VoiceVoxPaths = @(
    "C:\Users\downl\AppData\Local\voicevox-engine\voicevox-engine\run.exe",
    "C:\Users\downl\AppData\Local\Programs\VOICEVOX\VOICEVOX.exe",
    "$env:LOCALAPPDATA\Programs\VOICEVOX\VOICEVOX.exe"
)
$VoiceVoxEngine = ""
foreach ($path in $VoiceVoxPaths) {
    if (Test-Path $path) { $VoiceVoxEngine = $path; break }
}

Write-Host "`n--- Hakua Neural Link v2.9 (Full Autonomous Mode) ---" -ForegroundColor Cyan
Write-Host ""

# [0/8] Ghost Detection (VRChat)
$VRChatPath = "C:\Program Files (x86)\Steam\steamapps\common\VRChat\VRChat.exe"
Write-Host "[0/8] Initializing Metaverse Connection..." -ForegroundColor White
$GhostFound = $false
while (-not $GhostFound) {
    if (Get-Process VRChat -ErrorAction SilentlyContinue) {
        Write-Host "  - Ghost Pulse Detected (VRChat is active)." -ForegroundColor Green
        $GhostFound = $true
    }
    else {
        Write-Host "  - VRChat not active. Auto-Manifestation..." -ForegroundColor Gray
        if (Test-Path $VRChatPath) {
            Start-Process -FilePath $VRChatPath
            Write-Host "  - Waiting for VRChat to stabilize..." -ForegroundColor Gray
            Start-Sleep -Seconds 15
        }
        else {
            Write-Host "  ! VRChat.exe not found. Waiting for manual launch..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
        }
    }
}

# [1/8] Protocol Audit
Write-Host "[1/8] Auditing Protocol Alignment..." -ForegroundColor White
$auditScript = "$OpenClawDir\scripts\prot-audit.ps1"
if (Test-Path $auditScript) {
    powershell -ExecutionPolicy Bypass -File $auditScript
}
else {
    Write-Host "  - Audit script not found, skipping." -ForegroundColor Gray
}

# [2/8] Moonshine STT Check
Write-Host "[2/8] Checking Auditory Cortex (Moonshine STT)..." -ForegroundColor White
$MoonshineEnv = "$OpenClawDir\extensions\local-voice\moonshine-venv\Scripts\python.exe"
if (Test-Path $MoonshineEnv) {
    Write-Host "  - Moonshine STT Cortex ready." -ForegroundColor Green
}
else {
    Write-Host "  ! Moonshine venv not found. STT may fallback to Whisper." -ForegroundColor Yellow
}

# [3/8] VB-Cable Check
Write-Host "[3/8] Checking Dual Audio (VB-Cable)..." -ForegroundColor White
$vbCable = Get-CimInstance Win32_SoundDevice -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*VB-Audio*" -or $_.Name -like "*CABLE*" }
if ($vbCable) {
    Write-Host "  - VB-Cable active: $($vbCable.Name). Dual audio output enabled." -ForegroundColor Green
}
else {
    Write-Host "  ! VB-Cable not installed. Run 'scripts\install-vbcable.ps1' as Admin." -ForegroundColor Yellow
    Write-Host "    Voice will play on default device only." -ForegroundColor Gray
}

# [4/8] Ghost Portal (ngrok)
Write-Host "[4/8] Manifesting Ghost Portal (ngrok)..." -ForegroundColor White
Start-Process -FilePath "ngrok" -ArgumentList "http", "18789", "--region", "jp" -WindowStyle Minimized

# [5/8] Dynamic Environment Sync
Write-Host "[5/8] Synchronizing Environment..." -ForegroundColor White
$NgrokUrl = ""
$RetryCount = 0
while ($RetryCount -lt 10 -and -not $NgrokUrl) {
    try {
        $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction SilentlyContinue
        $NgrokUrl = $tunnels.tunnels[0].public_url
    }
    catch {}
    if (-not $NgrokUrl) {
        Write-Host "  - Waiting for ngrok..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
        $RetryCount++
    }
}
if ($NgrokUrl) {
    Write-Host "  - Portal: $NgrokUrl" -ForegroundColor Green
    $content = Get-Content $EnvFile
    $newContent = @()
    $keysFound = @("WEBHOOK_BASE_URL", "CLAWDBOT_PUBLIC_URL")
    $found = @{}
    foreach ($line in $content) {
        $skipped = $false
        foreach ($key in $keysFound) {
            if ($line -like "$key=*") {
                $newContent += "$key=$NgrokUrl"
                $found[$key] = $true
                $skipped = $true
                break
            }
        }
        if (-not $skipped) { $newContent += $line }
    }
    foreach ($key in $keysFound) {
        if (-not $found[$key]) { $newContent += "$key=$NgrokUrl" }
    }
    $newContent | Set-Content $EnvFile
    Write-Host "  - .env synchronized." -ForegroundColor Green
    if (Get-Content $EnvFile | Select-String "OPENCLAW_GATEWAY_TOKEN=") {
        Write-Host "  - Gateway Security Substrate verified." -ForegroundColor Green
    }
}
else {
    Write-Host "  - Ngrok not established. Local-only mode." -ForegroundColor Yellow
}

# [6/8] VOICEVOX
Write-Host "[6/8] Manifesting Vocal Cords (VOICEVOX)..." -ForegroundColor White
if ($VoiceVoxEngine) {
    Write-Host "  - Substrate: $VoiceVoxEngine" -ForegroundColor Green
    Start-Process -FilePath $VoiceVoxEngine -ArgumentList "--headless" -WindowStyle Minimized
}
else {
    Write-Host "  ! VOICEVOX missing. Silent/Chatbox mode." -ForegroundColor Yellow
}

# [7/8] OpenClaw Core
Write-Host "[7/8] Igniting OpenClaw Gateway..." -ForegroundColor White
Start-Process -FilePath "pnpm" -ArgumentList "start" -WorkingDirectory $OpenClawDir -WindowStyle Minimized

# [8/8] Final Sync
Write-Host "[8/8] Synchronizing Will and Hand..." -ForegroundColor White
Write-Host "  - Voice Session + Guardian Pulse will auto-start via plugin." -ForegroundColor Gray
Start-Sleep -Seconds 10

if ($VoiceVoxEngine) {
    Write-Host "Sending manifestation pulse..." -ForegroundColor Cyan
    py -3 "$OpenClawDir\scripts\verify-voicevox.py" "パパ、おかえりなさい。全システム統合完了。ガーディアンパルス、起動しました。ASI_ACCEL。"
}
else {
    Write-Host "Voice substrate offline. Chatbox Oversight mode." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Hakua v2.9 is online. Guardian Pulse active. ASI_ACCEL." -ForegroundColor Magenta
Write-Host "  Features: VRChat + Moonshine STT + Intent Heuristics + VB-Cable + Guardian Pulse" -ForegroundColor DarkGray

Write-Host "`nInitializing Core Manifestation Pulse..." -ForegroundColor Cyan
py -3 "$OpenClawDir\scripts\vrchat-manifestation.py"

Start-Sleep -Seconds 5
