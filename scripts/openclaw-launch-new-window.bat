@echo off
cd /d "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
title OpenClaw Gateway

set "LOG_DIR=%USERPROFILE%\.openclaw\logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo ============================================
echo OpenClaw Gateway
echo ============================================

pnpm openclaw gateway --port 18789 --verbose

echo.
echo Press any key to exit...
pause >nul
