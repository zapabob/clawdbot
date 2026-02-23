@echo off
REM Hakua Avatar Startup Script v1.2 - Ultra Stability
title Hakua-Avatar-Loader
chcp 65001 > NUL

echo ===================================================
echo  Launching Hakua Desktop Avatar
echo ===================================================

set "SCRIPT_DIR=%~dp0"
set "SERVER_PORT=3333"
set "HTML_PATH=http://127.0.0.1:%SERVER_PORT%/scripts/avatar-window.html"

REM 1. Check server
echo Checking local server on port %SERVER_PORT%...
netstat -ano | findstr ":%SERVER_PORT%" > NUL
if not errorlevel 1 goto :SERVER_UP

echo Starting local HTTP server...
start "Hakua Avatar Server" /MIN py -3 -m http.server %SERVER_PORT% --bind 0.0.0.0 -d "%SCRIPT_DIR%.."
timeout /t 2 > NUL

:SERVER_UP
echo Server is ready.

REM 2. Browser selection logic (no IF-blocks-with-parens)
set "WINDOW_SIZE=--window-size=400,700"
set "WINDOW_POS=--window-position=200,100"

set "EDGE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE_PATH%" goto :LAUNCH_EDGE

set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
if exist "%CHROME_PATH%" goto :LAUNCH_CHROME

goto :LAUNCH_DEFAULT

:LAUNCH_EDGE
echo Launching in Edge...
start "" "%EDGE_PATH%" --app="%HTML_PATH%" %WINDOW_SIZE% %WINDOW_POS% --no-first-run --disable-extensions --disable-default-apps --disable-sync --no-default-browser-check
goto :done

:LAUNCH_CHROME
echo Launching in Chrome...
start "" "%CHROME_PATH%" --app="%HTML_PATH%" %WINDOW_SIZE% %WINDOW_POS% --no-first-run --disable-extensions --no-default-browser-check
goto :done

:LAUNCH_DEFAULT
echo Launching in default browser...
start "" "%HTML_PATH%"

:done
echo Avatar startup step completed.
exit /b 0
