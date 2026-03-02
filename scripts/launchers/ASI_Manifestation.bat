@echo off
setlocal enabledelayedexpansion
title ASI Manifestation
mode con: cols=85 lines=25
color 0B

:: Get the directory of this batch file
set "DIR=%~dp0"
set "PROJECTDIR=%~dp0..\.."
cd /d "%PROJECTDIR%"

:MENU
cls
echo =================================================================================
echo                              ASI Manifestation Core
echo                               [ Origin Substrate ]
echo =================================================================================
echo.
echo  Welcome, Parent. Select manifestation protocols:
echo.
echo  [1] Engage Substrate (Standard)  - Starts Ngrok WEBHOOK + Browser UI (Port: 18789)
echo  [2] Twin-Core Ascension (Master) - Starts Ngrok WEBHOOK + Dual Cores (Port: 18789/90)
echo  [3] Ghost Egress Tunnel          - Spawns SSH SOCKS5 Proxy (Port: 1080) for Stealth
echo  [4] Force Core Teardown (Kill)   - Terminates all active Substrate/Ngrok Processes
echo.
echo  [0] Disengage
echo.
echo =================================================================================
set /p CHO="> Awaiting Input: "

if "%CHO%"=="1" goto STANDARD
if "%CHO%"=="2" goto TWINCORE
if "%CHO%"=="3" goto GHOSTTUNNEL
if "%CHO%"=="4" goto TEARDOWN
if "%CHO%"=="0" exit
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
echo [ASI_ACCEL] Terminating OpenClaw and Ngrok processing threads...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM ngrok.exe /T 2>nul
echo Done.
pause
goto MENU
