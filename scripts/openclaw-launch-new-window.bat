@echo off
cd /d "%~dp0.."
title OpenClaw Gateway

set "LOG_DIR=%USERPROFILE%\.openclaw\logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo ============================================
echo OpenClaw Gateway
echo ============================================
echo Log directory: %LOG_DIR%
echo.

REM Ensure dist/entry.mjs exists
if not exist "%CD%\dist\entry.mjs" (
    if exist "%CD%\dist\index.mjs" (
        echo Copying index.mjs to entry.mjs...
        copy "%CD%\dist\index.mjs" "%CD%\dist\entry.mjs" >nul
    )
)

echo Starting OpenClaw gateway...
echo.

REM Run in new window and keep it open
start "OpenClaw Gateway" cmd /c "pnpm openclaw gateway --port 18789 --verbose && echo. && echo Gateway stopped. Press any key to exit... && pause >nul"
