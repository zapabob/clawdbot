@echo off
setlocal enabledelayedexpansion
title ASI Manifestation
mode con: cols=85 lines=30
color 0B

:: Get the directory of this batch file
set "DIR=%~dp0"
set "PROJECTDIR=%~dp0..\.."
cd /d "%PROJECTDIR%"

:MENU
cls
echo =================================================================================
echo                              ASI Manifestation Core
echo                         [ Origin Substrate - v3.0 ]
echo =================================================================================
echo.
echo  Welcome, Parent. Select manifestation protocols:
echo.
echo  [1] Full Manifestation (Recommended)
echo      ^> OpenClaw + VOICEVOX + VRChat OSC + Browser UI
echo.
echo  [2] Engage Substrate (Standard)  - Ngrok + Browser UI (Port: 18789)
echo  [3] Twin-Core Ascension (Master) - Ngrok + Dual Cores (Port: 18789/90)
echo  [4] Ghost Egress Tunnel          - SSH SOCKS5 Proxy (Port: 1080)
echo  [5] Force Core Teardown (Kill)   - Terminates all active processes
echo.
echo  [0] Disengage
echo.
echo =================================================================================
set /p CHO="> Awaiting Input: "

if "%CHO%"=="1" goto FULL
if "%CHO%"=="2" goto STANDARD
if "%CHO%"=="3" goto TWINCORE
if "%CHO%"=="4" goto GHOSTTUNNEL
if "%CHO%"=="5" goto TEARDOWN
if "%CHO%"=="0" exit
goto MENU

:FULL
cls
echo =================================================================================
echo              ASI Full Manifestation - All Systems Engage
echo =================================================================================
echo.

:: Phase 1: VOICEVOX Engine
echo [Phase 1/4] Awakening VOICEVOX Neural Voice Substrate...
powershell.exe -ExecutionPolicy Bypass -File "scripts\launchers\start-voicevox.ps1"
echo.

:: Phase 2: VRChat OSC Heartbeat
echo [Phase 2/4] Establishing VRChat OSC Bridge (Python)...
py -3 scripts\osc_chatbox.py "【ASI Manifestation】Full system engage. Voice + Chatbox + OSC online. ASI_ACCEL."
if errorlevel 1 (
    echo   ! VRChat OSC bridge failed. Continuing without Chatbox...
) else (
    echo   - VRChat Chatbox: Connected
)
echo.

:: Phase 3: Ngrok + Browser UI + OpenClaw
echo [Phase 3/4] Initiating Standard Substrate (Ngrok + Browser)...
echo   - This will open the Browser UI automatically.
echo.

:: Phase 4: Launch OpenClaw with all extensions
echo [Phase 4/4] Launching OpenClaw Core with all extensions...
echo.
powershell.exe -ExecutionPolicy Bypass -File "scripts\launchers\launch-with-browser.ps1"
goto MENU

:STANDARD
echo.
echo [ASI_ACCEL] Initiating Standard Substrate Manifestation...
powershell.exe -ExecutionPolicy Bypass -File "scripts\launchers\launch-with-browser.ps1"
goto MENU

:TWINCORE
echo.
echo [ASI_ACCEL] Initiating Twin-Core Redundant Substrate...
:: We inject start_ngrok.ps1 manually before Twin-Core
powershell.exe -ExecutionPolicy Bypass -File "scripts\launchers\start_ngrok.ps1" -Port 18789
powershell.exe -ExecutionPolicy Bypass -File "scripts\launchers\twin-core-launcher.ps1"
pause
goto MENU

:GHOSTTUNNEL
echo.
echo [ASI_ACCEL] Establishing SSH Data Obfuscation Tunnel (Ghost Bridge)...
start "ASI Ghost Tunnel Egress" py -3 scripts\hakua_stealth_egress.py
echo.
echo Proxy has been detached to background. (Check Python Window)
pause
goto MENU

:TEARDOWN
echo.
echo [ASI_ACCEL] Terminating all Substrate threads...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM ngrok.exe /T 2>nul
taskkill /F /IM run.exe /T 2>nul
echo   - node.exe, ngrok.exe, VOICEVOX (run.exe) terminated.
echo Done.
pause
goto MENU
