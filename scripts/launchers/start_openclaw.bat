@echo off
title OpenClaw Server
cd /d "%~dp0"
echo ===================================================
echo Starting OpenClaw on port 3000...
echo ===================================================
set OPENCLAW_GATEWAY_PORT=3000
call pnpm start
pause
