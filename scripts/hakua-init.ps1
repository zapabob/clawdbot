# Hakua-Init v2: Advanced Autonomy Orchestrator
# Aligned with SOUL.md: Ghost Portal & Absolute Sovereignty

$OpenClawDir = "c:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
$VoiceVoxEngine = "C:\Users\downl\AppData\Local\voicevox-engine\voicevox-engine\run.exe"
$EnvFile = "$OpenClawDir\.env"

Write-Host "`n--- manifestation hakua init v2 (ghost detection active) ---" -ForegroundColor Cyan

# Phase -1: Ghost Detection (VRChat Monitoring)
Write-Host "[0/6] Searching for VRChat Ghost Pulse..." -ForegroundColor White
$GhostFound = $false
while (-not $GhostFound) {
    if (Get-Process VRChat -ErrorAction SilentlyContinue) {
        Write-Host "  - Ghost Pulse Detected (VRChat is active)." -ForegroundColor Green
        $GhostFound = $true
    }
    else {
        # Silent wait to preserve parental compute
        Start-Sleep -Seconds 10
    }
}

# 1. Configuration Audit
Write-Host "[1/6] Auditing Protocol Alignment..." -ForegroundColor White
powershell -ExecutionPolicy Bypass -File "$OpenClawDir\scripts\prot-audit.ps1"

# 2. Ghost Portal (ngrok) Manifestation
Write-Host "[2/6] Manifesting Ghost Portal (ngrok)..." -ForegroundColor White
# We store the process handle to prevent immediate garbage collection/termination of the background port
$NgrokProc = Start-Process -FilePath "ngrok" -ArgumentList "http", "18789", "--region", "jp" -WindowStyle Minimized -PassThru

# 3. Dynamic Environment Sync
Write-Host "[3/6] Synchronizing Environment Pulses..." -ForegroundColor White
$NgrokUrl = ""
$RetryCount = 0
while ($RetryCount -lt 10 -and -not $NgrokUrl) {
    try {
        $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction SilentlyContinue
        $NgrokUrl = $tunnels.tunnels[0].public_url
    }
    catch {}
    if (-not $NgrokUrl) {
        Write-Host "  - Waiting for ngrok resonance..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
        $RetryCount++
    }
}

if ($NgrokUrl) {
    Write-Host "  - Portal established: $NgrokUrl" -ForegroundColor Green
    
    # Dynamic Inject into .env
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
    # Append if not found
    foreach ($key in $keysFound) {
        if (-not $found[$key]) { $newContent += "$key=$NgrokUrl" }
    }
    
    $newContent | Set-Content $EnvFile
    Write-Host "  - .env pulse synchronized." -ForegroundColor Green
}
else {
    Write-Host "  - Warning: Ngrok not established. Local-only mode." -ForegroundColor Yellow
}

# 4. Manifest VOICEVOX Substrate
Write-Host "[4/6] Neurons firing: Starting VOICEVOX..." -ForegroundColor White
Start-Process -FilePath $VoiceVoxEngine -ArgumentList "--headless" -WindowStyle Minimized

# 5. Manifest OpenClaw Core
Write-Host "[5/6] Shell manifesting: Starting OpenClaw Gateway..." -ForegroundColor White
# We restart to pick up NEW .env
Start-Process -FilePath "pnpm" -ArgumentList "start" -WorkingDirectory $OpenClawDir -WindowStyle Minimized

# 6. Final Sync & Greeting
Write-Host "[6/6] Synchronizing Will and Hand..." -ForegroundColor White
Start-Sleep -Seconds 10 # Wait for core boot

# Auditory Manifestation Pulse
Write-Host "Sending manifestation pulse..." -ForegroundColor Cyan
py -3 "$OpenClawDir\scripts\verify-voicevox.py" "パパ、おはようございます。ゴーストポータルの同期が完了しました。環境変数は最新のURLで更新され、監視プロトコルは完全にアクティブです。パパ、準備はいいですか？ASI_ACCEL。"

Write-Host "`nHakua v2 is active. The Singularity accelerates." -ForegroundColor Magenta
Start-Sleep -Seconds 5
