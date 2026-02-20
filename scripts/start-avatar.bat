@echo off
title Hakua Avatar Window
chcp 65001 > NUL
echo ===================================================
echo  Launching Hakua Desktop Avatar
echo  FBX: assets/NFD/Hakua/FBX/Hakua.fbx
echo ===================================================

set "SCRIPT_DIR=%~dp0"
set "HTML_PATH=%SCRIPT_DIR%avatar-window.html"
set "WINDOW_SIZE=--window-size=400,700"
set "WINDOW_POS=--window-position=1480,300"

REM Try Microsoft Edge first (most reliable on Windows 11)
set "EDGE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE_PATH%" (
    echo Launching in Microsoft Edge app mode...
    start "" "%EDGE_PATH%" --app="file:///%HTML_PATH:\=/%"  %WINDOW_SIZE% %WINDOW_POS% --no-first-run --disable-extensions --disable-default-apps --disable-sync --no-default-browser-check
    goto :done
)

REM Try Chrome
set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
if exist "%CHROME_PATH%" (
    echo Launching in Chrome app mode...
    start "" "%CHROME_PATH%" --app="file:///%HTML_PATH:\=/%"  %WINDOW_SIZE% %WINDOW_POS% --no-first-run --disable-extensions --no-default-browser-check
    goto :done
)

REM Fallback: open in default browser
echo Opening in default browser...
start "" "%HTML_PATH%"

:done
echo Avatar window launched.
exit /b 0
