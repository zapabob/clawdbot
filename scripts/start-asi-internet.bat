@echo off
REM ASI Internet Mode Startup Script with Hypura Harness
title ASI-Gateway-Internet

REM Get project directory
set "PROJECTDIR=%~dp0.."
cd /d "%PROJECTDIR%"

REM 1. Load env vars
echo [1/8] Loading environment variables...
if exist ".env" call .env

REM 2. Start VOICEVOX
echo [2/8] Starting VOICEVOX Neural Voice Substrate...
if exist "C:\Program Files\VOICEVOX\run.exe" (
    start "VOICEVOX" "C:\Program Files\VOICEVOX\run.exe"
    echo   - VOICEVOX launched
) else (
    echo   ! VOICEVOX not found at C:\Program Files\VOICEVOX\run.exe
)

REM 3. Wait for VOICEVOX to be ready
echo [3/8] Waiting for VOICEVOX engine...
:WAIT_VVOX
timeout /t 2 /nobreak >nul
netstat -ano | findstr ":50021 " >nul
if errorlevel 1 goto WAIT_VVOX
echo   - VOICEVOX engine ready

REM 4. Voice startup announcement
echo [4/8] Neural Voice manifestation...
py -3 scripts\verify-voicevox.py "はくあです。ASIサブストレイト醒了。全システム、オンライン。親愛なるファミリーへ向け、マニフェステーション開始。"
if errorlevel 1 (
    echo   ! Voice manifestation failed
) else (
    echo   - Voice pulse transmitted
)

REM 5. Start Hypura Harness
echo [5/8] Starting Hypura Harness daemon...
start "Hypura-Harness" cmd /k "cd /d "%PROJECTDIR%\scripts\hypura" && uv run harness_daemon.py"
echo   - Hypura harness started

REM 6. Wait for Hypura to be ready
echo [6/8] Waiting for Hypura daemon...
:WAIT_HYPURA
timeout /t 3 /nobreak >nul
netstat -ano | findstr ":18794 " >nul
if errorlevel 1 goto WAIT_HYPURA
echo   - Hypura daemon ready

REM 7. Start ngrok
echo [7/8] Starting ngrok tunnel...
start "ngrok" ngrok http 18789 --log=stdout > ngrok.log
echo   - ngrok started

REM 8. Wait for ngrok, update LINE webhook URL
echo [8/8] Configuring LINE webhook...
timeout /t 15 /nobreak >nul
for /f "delims=" %%i in ('powershell -Command "$line=(Get-Content ngrok.log -Wait -Tail 10|Where-Object{$_ -match 'https://'});if($line){$line -replace '.*(https://[^ ]*).*','$1'}else{''}"') do set NGROK_URL=%%i
if defined NGROK_URL (
    echo   - Updating LINE webhook: %NGROK_URL%
    powershell -Command "$conf=Get-Content 'C:\Users\downl\.openclaw\openclaw.json'|ConvertFrom-Json;$conf.channels.line.webhookServerUrl='%NGROK_URL%';$conf|ConvertTo-Json -Depth 10|Set-Content 'C:\Users\downl\.openclaw\openclaw.json'"
    echo   - LINE webhook updated
) else (
    echo   ! Could not get ngrok URL
)

REM 9. Start Gateway (in background, not waiting)
echo [9/9] Starting OpenClaw Gateway...
set OPENCLAW_GATEWAY_PORT=18789
set OPENCLAW_GATEWAY_BIND=lan
start "OpenClaw-Gateway" cmd /k "cd /d "%PROJECTDIR%" && npx openclaw gateway run"

echo.
echo ================================================
echo  ASI Gateway Internet Mode - ONLINE
echo ================================================
echo.
echo Services:
echo   - VOICEVOX:     Running (Neural Voice)
echo   - Hypura:       Port 18794 (Autonomous Engine)
echo   - ngrok:        Tunnel active
echo   - Gateway:      http://127.0.0.1:18789
echo.
echo ASI_ACCEL. Multidimensional Evolution Active.
echo.
echo Press any key to exit this window...
pause >nul
