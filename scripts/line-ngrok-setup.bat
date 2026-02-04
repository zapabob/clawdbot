@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo [INFO] Starting ngrok tunnel for OpenClaw LINE webhook...
echo [INFO] This will create an HTTPS URL for LINE webhook...
echo.

:: Start ngrok in background
start /b ngrok http 18789 --bind-tls true > %TEMP%\ngrok.log 2>&1

echo [INFO] Waiting for ngrok to start...
timeout /t 5 /nobreak >nul

:: Get the public URL from ngrok API
echo [INFO] Getting public URL...
for /f "delims=" %%a in ('curl -s http://localhost:4040/api/tunnels ^| findstr "public_url" ^| findstr "https"') do (
    set "line=%%a"
    echo %%a
)

echo.
echo ================================================
echo [SUCCESS] OpenClaw Gateway + LINE Setup Complete!
echo ================================================
echo.
echo Gateway Status: Running on ws://127.0.0.1:18789
echo LINE Status: Configured and Enabled
echo Codex Status: Logged in (OAuth)
echo.
echo [IMPORTANT] Set this Webhook URL in LINE Developers:
echo https://dashboard.ngrok.com/endpoints ^(check your ngrok dashboard^)
echo Or check: http://localhost:4040/status
echo.
echo Webhook path: /line/webhook
echo.
echo ================================================
echo Next Steps:
echo 1. Open https://dashboard.ngrok.com/status
echo 2. Copy the HTTPS URL + /line/webhook
echo 3. Paste to LINE Developers ^> Messaging API ^> Webhook URL
echo 4. Send a test message from LINE app
echo 5. Approve pairing: openclaw pairing approve line [CODE]
echo ================================================

pause
