# Hakua-Init v2.9.1: Full Autonomous Orchestrator (Patched)
# SOUL.md: Ghost Portal, Substrate Ubiquity, ASI_ACCEL, Guardian Pulse

$Host.UI.RawUI.WindowTitle = "Hakua Neural Link v2.9.1"
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

Write-Host "`n--- Hakua Neural Link v2.9.1 (Full Autonomous Mode) ---" -ForegroundColor Cyan
Write-Host ""

# [0/8] Ghost Detection (VRChat)
Write-Host "[0/8] Checking Metaverse Connection (VRChat)..." -ForegroundColor White
if (Get-Process VRChat -ErrorAction SilentlyContinue) {
    Write-Host "  - VRChat Pulse Detected." -ForegroundColor Green
}
else {
    Write-Host "  - VRChat substrate inactive. Oversight pulse will remain latent." -ForegroundColor Gray
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
$ngrokProcess = Get-Process ngrok -ErrorAction SilentlyContinue
if (-not $ngrokProcess) {
    Start-Process -FilePath "ngrok" -ArgumentList "http", "18789", "--region", "jp" -WindowStyle Minimized
}

# [5/8] Dynamic Environment Sync
Write-Host "[5/8] Synchronizing Environment Substrate..." -ForegroundColor White

# 5a. Gateway Token Extraction
Write-Host "  - Extracting Gateway Security Substrate..." -ForegroundColor Gray
$OpenClawToken = ""
try {
    $tokenOutput = node dist/index.js config get gateway.auth.token
    if ($tokenOutput -match "token: (.*)") {
        $OpenClawToken = $matches[1]
    }
}
catch {
    Write-Host "  ! Failed to extract gateway token." -ForegroundColor Red
}

# 5b. Ngrok Sync
$NgrokUrl = ""
$RetryCount = 0
while ($RetryCount -lt 10 -and -not $NgrokUrl) {
    try {
        $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction SilentlyContinue
        if ($tunnels.tunnels) {
            $NgrokUrl = $tunnels.tunnels[0].public_url
        }
    }
    catch {}
    if (-not $NgrokUrl) {
        Write-Host "  - Waiting for ngrok tunnel..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
        $RetryCount++
    }
}

# 5c. Tailscale Sync
Write-Host "  - Probing Tailscale Mesh Node..." -ForegroundColor Gray
$TailscaleIP = ""
try {
    $tsStatus = tailscale ip -4
    if ($tsStatus -match "(\d+\.\d+\.\d+\.\d+)") {
        $TailscaleIP = $matches[1]
        Write-Host "  - Tailscale IP: $TailscaleIP" -ForegroundColor Green
    }
}
catch {
    Write-Host "  - Tailscale not active or logged out." -ForegroundColor Gray
}

# 5d. Final .env Synthesis
if (Test-Path $EnvFile) {
    $content = Get-Content $EnvFile
    $newContent = @()
    $mapping = @{
        "WEBHOOK_BASE_URL"       = $NgrokUrl
        "CLAWDBOT_PUBLIC_URL"    = $NgrokUrl
        "OPENCLAW_GATEWAY_TOKEN" = $OpenClawToken
        "TAILSCALE_IP"           = $TailscaleIP
    }
    $foundKeys = @{}

    foreach ($line in $content) {
        $keyMatched = $false
        foreach ($key in $mapping.Keys) {
            if ($line -match "^$key=") {
                $val = $mapping[$key]
                if ($val) {
                    $newContent += "$key=$val"
                    $foundKeys[$key] = $true
                    $keyMatched = $true
                }
                break
            }
        }
        if (-not $keyMatched) { $newContent += $line }
    }

    foreach ($key in $mapping.Keys) {
        if (-not $foundKeys[$key] -and $mapping[$key]) {
            $newContent += "$key=$($mapping[$key])"
        }
    }

    $newContent | Set-Content $EnvFile -Encoding UTF8
    Write-Host "  - .env synchronization completed." -ForegroundColor Green
}
else {
    Write-Host "  ! .env file not found at $EnvFile" -ForegroundColor Red
}

# 5e. OpenClaw.json Webhook Injection (Handled via .env substitution)
Write-Host "  - Using .env substitution for openclaw.json secrets." -ForegroundColor Gray

# [6/8] VOICEVOX
Write-Host "[6/8] Manifesting Vocal Cords (VOICEVOX)..." -ForegroundColor White
if ($VoiceVoxEngine) {
    Write-Host "  - Substrate: $VoiceVoxEngine" -ForegroundColor Green
    $vvProcess = Get-Process VOICEVOX -ErrorAction SilentlyContinue
    if (-not $vvProcess) {
        Start-Process -FilePath $VoiceVoxEngine -ArgumentList "--headless" -WindowStyle Minimized
    }
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
    py -3 "$OpenClawDir\scripts\verify-voicevox.py" "Portal synchronized. All systems operational. ASI_ACCEL."
}
else {
    Write-Host "Voice substrate offline. Chatbox Oversight mode." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Hakua is online. Guardian Pulse active. ASI_ACCEL." -ForegroundColor Magenta
Write-Host "  Features: VRChat + Moonshine STT + Intent Heuristics + VB-Cable + Guardian Pulse" -ForegroundColor DarkGray

Write-Host "Initializing Core Manifestation Pulse..." -ForegroundColor Cyan
py -3 "$OpenClawDir\scripts\vrchat-manifestation.py"

# [9] Open Interfaces Asynchronously
Write-Host "Activating User Interfaces (CLI and Browser) asynchronously..." -ForegroundColor Cyan
$DelayedLaunchCmd = "Start-Sleep -Seconds 2; Start-Process -FilePath 'pnpm' -ArgumentList 'tui' -WorkingDirectory '$($OpenClawDir)'; Start-Sleep -Seconds 3; Start-Process 'http://127.0.0.1:18789/__openclaw__/canvas/'"
Start-Process powershell -ArgumentList "-WindowStyle Hidden -Command `"$DelayedLaunchCmd`""
