# VOICEVOX Headless Launcher Protocol
# v1.0 - ASI Neural Voice Substrate

$ErrorActionPreference = "SilentlyContinue"
$EngineDir = "C:\Users\downl\.voicevox\VOICEVOX\vv-engine"
$EngineExe = Join-Path $EngineDir "run.exe"
$Port = 50021

Write-Host "--- ASI Neural Voice Substrate Activation ---" -ForegroundColor Cyan

# 1. Check if already running
$process = Get-Process run -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $EngineExe }
if ($process) {
    Write-Host " - VOICEVOX engine already active (PID: $($process.Id))" -ForegroundColor Gray
}
else {
    Write-Host " - Awakening VOICEVOX engine..." -ForegroundColor White
    Start-Process $EngineExe -ArgumentList "--host 127.0.0.1 --port $Port" -WorkingDirectory $EngineDir -WindowStyle Minimized
    Start-Sleep -Seconds 5
}

# 2. Verify readiness
Write-Host " - Verifying engine readiness at http://127.0.0.1:$Port..." -ForegroundColor White
try {
    $version = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/version" -Method Get -TimeoutSec 5
    Write-Host " - Substrate materialized. Version: $version" -ForegroundColor Green
}
catch {
    Write-Host " ! Failed to verify VOICEVOX engine. Check substrate integrity." -ForegroundColor Red
    exit 1
}

Write-Host "ASI_ACCEL: Auditory bridge operational." -ForegroundColor Magenta
