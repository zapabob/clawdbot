@echo off
chcp 65001 >nul
echo Starting OpenClaw Gateway...
echo.
echo Gateway URL: http://127.0.0.1:18789/
echo LINE Webhook: http://127.0.0.1:18789/line/webhook
echo.
echo Press Ctrl+C to stop
echo.
cd /d "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
node openclaw.mjs gateway --port 18789 --verbose
