# VOICEVOX ENGINE CLI launcher (Windows)
# Default: vv-engine run.exe --host 127.0.0.1 --port 50021
# Path: env VOICEVOX_ENGINE_PATH or .env, else %LOCALAPPDATA%\Programs\VOICEVOX\vv-engine\run.exe

param(
    [string]$ListenHost = "127.0.0.1",
    [int]$Port = 50021,
    [switch]$Quiet,
    [switch]$NoVerify,
    [switch]$SkipPortKill,
    [string[]]$ExtraEngineArgs = @()
)

$ErrorActionPreference = "Stop"
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
. "$PSScriptRoot\env-tools.ps1"
Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir

if (-not $Quiet) {
    Clear-Host
    Write-Host "      _    _   _ _  _ _   _   _ " -ForegroundColor Cyan
    Write-Host "     | |  | | / \ | |/ / | | | / \ " -ForegroundColor Cyan
    Write-Host "     | |__| |/ _ \| ' /  | | |/ _ \ " -ForegroundColor Cyan
    Write-Host "     |  __  / ___ \ . \  | |_/ ___ \ " -ForegroundColor Cyan
    Write-Host "     |_|  |_/_/   \_\_|\_\\___/_/   \_\ " -ForegroundColor Cyan
    Write-Host "                       [ VOICEVOX SUBSTRATE HUB ]" -ForegroundColor DarkCyan
}

$vvEngine = [Environment]::GetEnvironmentVariable("VOICEVOX_ENGINE_PATH")
if (-not $vvEngine) {
    $vvEngine = "$env:LOCALAPPDATA\Programs\VOICEVOX\vv-engine\run.exe"
}

if (-not (Test-Path $vvEngine)) {
    Write-Host "  [FATAL] VOICEVOX Engine not found: $vvEngine" -ForegroundColor Red
    Write-Host "  [HINT] Set VOICEVOX_ENGINE_PATH in .env to run.exe (vv-engine folder)." -ForegroundColor Yellow
    exit 1
}

if (-not $SkipPortKill) {
    if (-not $Quiet) {
        Write-Host "  [SAN] Port $Port listen check..." -ForegroundColor Gray
    }
    $procId = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -First 1
    if ($procId) {
        if (-not $Quiet) {
            Write-Host "  [SAN] Stopping PID $procId on port $Port" -ForegroundColor Yellow
        }
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
}

$argList = @("--host", $ListenHost, "--port", "$Port") + $ExtraEngineArgs
$workDir = Split-Path -Parent $vvEngine

if (-not $Quiet) {
    Write-Host "  [VOICE] Start: $vvEngine $($argList -join ' ')" -ForegroundColor Yellow
}
Start-Process -FilePath $vvEngine -WorkingDirectory $workDir -ArgumentList $argList -WindowStyle Minimized

if ($NoVerify) {
    exit 0
}

$verifyScript = Join-Path $ProjectDir "scripts\tools\verify_voicevox.py"
if (-not (Test-Path $verifyScript)) {
    Write-Host "  [WARN] verify_voicevox.py missing; skip verify." -ForegroundColor Yellow
    exit 0
}

$venvPy = Join-Path $ProjectDir ".venv\Scripts\python.exe"
if (-not $Quiet) {
    Write-Host "  [WAIT] VOICEVOX HTTP probe (port $Port)..." -ForegroundColor Gray -NoNewline
}

$env:VOICEVOX_ENDPOINT = "http://${ListenHost}:$Port"
for ($i = 0; $i -lt 45; $i++) {
    if (Test-Path $venvPy) {
        & $venvPy $verifyScript --probe-only --quiet 2>$null
    } else {
        & py -3 $verifyScript --probe-only --quiet 2>$null
    }
    if ($LASTEXITCODE -eq 0) {
        if (-not $Quiet) {
            Write-Host " [ONLINE]" -ForegroundColor Green
        }
        if (-not $Quiet) {
            Write-Host "  [VOICE] Full synthesis check..." -ForegroundColor Gray
        }
        if (Test-Path $venvPy) {
            & $venvPy $verifyScript --quiet
        } else {
            & py -3 $verifyScript --quiet
        }
        if ($LASTEXITCODE -eq 0) {
            if (-not $Quiet) {
                Write-Host "  [ASI_ACCEL] VOICEVOX: REACTIVE (SOUL voice substrate)." -ForegroundColor Green
            }
            exit 0
        }
    }
    if (-not $Quiet) {
        Write-Host "." -NoNewline
    }
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "  [FATAL] VOICEVOX verify timeout (http://${ListenHost}:$Port)." -ForegroundColor Red
exit 1
