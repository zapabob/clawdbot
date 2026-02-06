@echo off
REM OpenClaw WhatsApp Auto Setup

cd /d "%~dp0"

echo [1/2] Starting OpenClaw Gateway...
start "OpenClaw Gateway" /B node scripts/node/run-node.mjs gateway run --bind 0.0.0.0 --port 3000

echo Waiting for gateway to start...
timeout /t 15 /nobreak >nul

echo [2/2] Starting WhatsApp QR Login...
echo Scan the QR code with WhatsApp!
node scripts/node/run-node.mjs channels login whatsapp

pause
