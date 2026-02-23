@echo off
REM v1.8 - Simplified stable version
title Clawdbot-Loader
chcp 65001 > NUL

set REPO_ROOT=%~dp0..
cd /d "%REPO_ROOT%"

echo ---------------------------------------------------
echo  Clawdbot Unified Startup v1.8
echo ---------------------------------------------------

REM 1. SBV2
echo [1/3] Checking SBV2 TTS Server
netstat -ano | findstr :5000 > NUL
if not errorlevel 1 goto :SBV2_OK
echo Starting SBV2...
start "SBV2" /MIN cmd /c "scripts\start-sbv2.bat"
:WAIT_SBV2
timeout /t 2 > NUL
netstat -ano | findstr :5000 > NUL
if errorlevel 1 goto :WAIT_SBV2
:SBV2_OK
echo SBV2 Online.

REM 2. Gateway
echo [2/3] Starting OpenClaw Gateway on port 4545...
set OPENCLAW_GATEWAY_PORT=4545

REM Check if already running
netstat -ano | findstr :4545 > NUL
if not errorlevel 1 goto :GW_ALREADY_RUNNING

echo Launching Gateway in new window...
start "OpenClaw-Gateway" cmd /k "cd /d %REPO_ROOT% && set OPENCLAW_GATEWAY_PORT=4545 && pnpm start"

echo Waiting for Gateway to start (max 60 seconds)...
set GW_COUNT=0
:WAIT_GW
timeout /t 2 > NUL
set /a GW_COUNT+=2
echo   Waiting... %GW_COUNT% seconds
netstat -ano | findstr :4545 > NUL
if errorlevel 1 (
    if %GW_COUNT% GEQ 60 goto :GW_TIMEOUT
    goto :WAIT_GW
)
:GW_OK
echo Gateway Online.
goto :GW_DONE

:GW_ALREADY_RUNNING
echo Gateway already running on port 4545.
goto :GW_DONE

:GW_TIMEOUT
echo WARNING: Gateway did not start within 60 seconds
echo Check the Gateway window for errors
pause

:GW_DONE

REM 3. Avatar
echo [3/3] Launching Avatar Window
if exist "scripts\start-avatar.bat" call "scripts\start-avatar.bat"

echo.
echo ---------------------------------------------------
echo  Startup Complete
echo ---------------------------------------------------
echo Opening browser at http://localhost:4545 ...
timeout /t 3 > NUL
start "" "http://localhost:4545"
echo.
echo Press any key to close this window...
pause > NUL
