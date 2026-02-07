@echo off
cd /d "%~dp0.."
title OpenClaw Gateway

set "LOG_DIR=%USERPROFILE%\.openclaw\logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo ============================================
echo OpenClaw Gateway Starting...
echo ============================================
echo Working directory: %CD%
echo Log directory: %LOG_DIR%
echo.

REM Copy index.mjs to entry.mjs if needed
if not exist "dist\entry.mjs" (
    if exist "dist\index.mjs" (
        echo Copying dist\index.mjs to dist\entry.mjs...
        copy "dist\index.mjs" "dist\entry.mjs" >nul
    )
)

echo Starting gateway on port 18789...
echo.
echo Press Ctrl+C to stop, or close this window.
echo ============================================
echo.

REM Run and capture output
node dist/entry.mjs gateway --port 18789

echo.
echo ============================================
echo Gateway stopped (exit code: %ERRORLEVEL%)
echo ============================================
pause
