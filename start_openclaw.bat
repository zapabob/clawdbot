@echo off
title OpenClaw Server
cd /d "%~dp0"
echo ===================================================
echo Starting OpenClaw on port 6000...
echo ===================================================
set OPENCLAW_GATEWAY_PORT=6000
call pnpm start
pause
