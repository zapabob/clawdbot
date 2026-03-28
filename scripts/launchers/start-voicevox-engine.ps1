# Sovereign VOICEVOX Manifestation Launcher
# Synchronizes the audio substrate with the OpenClaw gateway.

$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$envFile = Join-Path $ProjectDir ".env"
$vvPort = 50021

# --- [Header] ---
Clear-Host
Write-Host "      _    _   _ _  _ _   _   _ " -ForegroundColor Cyan
Write-Host "     | |  | | / \ | |/ / | | | / \ " -ForegroundColor Cyan
Write-Host "     | |__| |/ _ \| ' /  | | |/ _ \ " -ForegroundColor Cyan
Write-Host "     |  __  / ___ \ . \  | |_/ ___ \ " -ForegroundColor Cyan
Write-Host "     |_|  |_/_/   \_\_|\_\\___/_/   \_\ " -ForegroundColor Cyan
Write-Host "                       [ VOICEVOX SUBSTRATE HUB ]" -ForegroundColor DarkCyan

# --- [Environment Injection] ---
Write-Host "  [ASI_ACCEL] Injecting Environment Substrate..." -ForegroundColor Gray
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^(?<name>[^#=]+)=(?<value>.*)$') {
            $name = $Matches['name'].Trim()
            $value = $Matches['value'].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$vvEngine = [Environment]::GetEnvironmentVariable("VOICEVOX_ENGINE_PATH")
$PythonExe = Join-Path $ProjectDir ".venv\Scripts\python.exe"

if (-not $vvEngine) {
    # Fallback to AppData path if not in .env
    $vvEngine = "$env:LOCALAPPDATA\Programs\VOICEVOX\vv-engine\run.exe"
}

if (-not (Test-Path $vvEngine)) {
    Write-Host "  [FATAL] VOICEVOX Engine not found at: $vvEngine" -ForegroundColor Red
    exit 1
}

# --- [Port Sanitization] ---
Write-Host "  [SAN] Sanitizing Audio Port $vvPort..." -ForegroundColor Gray
$procId = Get-NetTCPConnection -LocalPort $vvPort -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
if ($procId) {
    Write-Host "  [SAN] Terminating process $procId..." -ForegroundColor Yellow
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
}

# --- [Manifestation Ignition] ---
Write-Host "  [VOICE] Igniting VOICEVOX Engine (Asynchronous Pulse)..." -ForegroundColor Yellow
Start-Process -FilePath $vvEngine -WorkingDirectory (Split-Path -Parent $vvEngine) -WindowStyle Minimized

# --- [Reactive Verification] ---
Write-Host "  [WAIT] Verifying Synthesis Reactivity..." -ForegroundColor Gray -NoNewline
$verifyScript = Join-Path $ProjectDir "scripts\tools\verify_voicevox.py"

for ($i=0; $i -lt 30; $i++) {
    & $PythonExe $verifyScript | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [ONLINE]" -ForegroundColor Green
        Write-Host "  [ASI_ACCEL] Audio Synthesis Substrate: MANIFESTED." -ForegroundColor Green
        exit 0
    }
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 1
}

Write-Host "`n  [FATAL] Audio Substrate manifestation timeout." -ForegroundColor Red
exit 1
