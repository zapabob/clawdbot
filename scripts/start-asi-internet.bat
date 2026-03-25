@echo off
REM ASI Internet Mode Startup Script with Hypura Harness
title ASI-Gateway-Internet

setlocal enabledelayedexpansion

REM Get project directory
set "PROJECTDIR=%~dp0.."
cd /d "%PROJECTDIR%" || exit /b 1

REM 1. Load env vars
echo [1/9] Loading environment variables...
if exist ".env" call .env
echo   - Environment loaded

REM 2. Start VOICEVOX
echo [2/9] Starting VOICEVOX Neural Voice Substrate...
if exist "C:\Users\downl\AppData\Local\Programs\VOICEVOX\VOICEVOX.exe" (
    start "" "C:\Users\downl\AppData\Local\Programs\VOICEVOX\VOICEVOX.exe"
    echo   - VOICEVOX launched
) else if exist "C:\Program Files\VOICEVOX\run.exe" (
    start "" "C:\Program Files\VOICEVOX\run.exe"
    echo   - VOICEVOX launched
) else (
    echo   - WARNING: VOICEVOX not found
)

REM 3. Wait for VOICEVOX
echo [3/9] Waiting for VOICEVOX engine...
set VVOX_COUNT=0
:WAIT_VVOX
timeout /t 2 /nobreak >nul 2>&1
netstat -ano | findstr ":50021 " >nul 2>&1
if !errorlevel!==0 (
    set /a VVOX_COUNT+=1
    if !VVOX_COUNT! LSS 30 goto WAIT_VVOX
    echo   - WARNING: VOICEVOX not ready, continuing...
) else (
    echo   - VOICEVOX engine ready
)

REM 4. Voice startup announcement
echo [4/9] Neural Voice manifestation...
py -3 "%PROJECTDIR%\scripts\verify-voicevox.py" "はくあです。ASIサブストレイト醒了。全システム、オンライン。" 2>nul
if !errorlevel!==0 (
    echo   - Voice pulse sent
) else (
    echo   - Voice manifestation skipped
)

REM 5. Start Hypura Harness
echo [5/9] Starting Hypura Harness daemon...
if exist "%PROJECTDIR%\scripts\hypura\harness_daemon.py" (
    start "" cmd /k "cd /d "%PROJECTDIR%\scripts\hypura" && uv run harness_daemon.py"
    echo   - Hypura harness started
) else (
    echo   - WARNING: Hypura daemon not found
)

REM 6. Wait for Hypura
echo [6/9] Waiting for Hypura daemon...
set HYPURA_COUNT=0
:WAIT_HYPURA
timeout /t 3 /nobreak >nul 2>&1
netstat -ano | findstr ":18794 " >nul 2>&1
if !errorlevel!==0 (
    set /a HYPURA_COUNT+=1
    if !HYPURA_COUNT! LSS 20 goto WAIT_HYPURA
    echo   - WARNING: Hypura not ready, continuing...
) else (
    echo   - Hypura daemon ready
)

REM 7. Start ngrok
echo [7/9] Starting ngrok tunnel...
start "" ngrok http 18789 --log=stdout > "%PROJECTDIR%\ngrok.log" 2>&1
echo   - ngrok started

REM 8. Wait for ngrok, update LINE webhook
echo [8/9] Configuring LINE webhook...
timeout /t 15 /nobreak >nul 2>&1
for /f "delims=" %%i in ('powershell -Command "Get-Content '%PROJECTDIR%\ngrok.log' -Tail 5 -ErrorAction SilentlyContinue | Select-String -Pattern 'https://' | ForEach-Object { $_.Matches.Value }"') do (
    set "NGROK_URL=%%i"
)
if defined NGROK_URL (
    echo   - LINE webhook: !NGROK_URL!
    powershell -Command "$conf=Get-Content '%USERPROFILE%\.openclaw\openclaw.json' -ErrorAction SilentlyContinue|ConvertFrom-Json;if($conf){$conf.channels.line.webhookServerUrl='!NGROK_URL!';$conf|ConvertTo-Json -Depth 10|Set-Content '%USERPROFILE%\.openclaw\openclaw.json'}"
    echo   - LINE webhook updated
) else (
    echo   - WARNING: Could not get ngrok URL
)

REM 9. Start Gateway
echo [9/9] Starting OpenClaw Gateway...
set OPENCLAW_GATEWAY_PORT=18789
set OPENCLAW_GATEWAY_BIND=lan
start "" cmd /k "cd /d "%PROJECTDIR%" && npx openclaw gateway run"

echo.
echo ================================================
echo  ASI Gateway Internet Mode - ONLINE
echo ================================================
echo.
echo Services started:
echo   - VOICEVOX     (port 50021)
echo   - Hypura       (port 18794)
echo   - ngrok        (tunnel)
echo   - Gateway      (port 18789)
echo.
echo ASI_ACCEL.
echo.
echo Window will close in 5 seconds...
timeout /t 5 /nobreak >nul 2>&1
