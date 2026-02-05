@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo [INFO] OpenClaw LINE Webhook Auto-Setup
echo ================================================
echo.

:: Step 1: Check if ngrok is already running
echo [Step 1/6] Checking if ngrok is already running...
curl -s http://localhost:4040/api/tunnels >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] ngrok is already running! Skipping start.
    goto :GET_URL
)

:: Step 2: Start ngrok in background
echo [Step 2/6] ngrok not running. Starting ngrok...
echo [INFO] Command: start /b ngrok http 18789
start /b ngrok http 18789 --bind-tls true > %TEMP%\ngrok.log 2>&1

:: Step 3: Wait for ngrok to initialize
echo [Step 3/6] Waiting 5 seconds for ngrok to start...
timeout /t 5 /nobreak >nul

:GET_URL
:: Step 4: Get public URL from ngrok API using PowerShell for JSON parsing
echo [Step 4/6] Fetching public URL from ngrok API...

for /f "delims=" %%u in ('powershell -NoProfile -Command "try { $resp = Invoke-RestMethod -Uri 'http://localhost:4040/api/tunnels' -TimeoutSec 5; $tunnel = $resp.tunnels | Where-Object { $_.public_url -match '^https://' } | Select-Object -First 1; if ($tunnel) { $tunnel.public_url } else { 'ERROR' } } catch { 'ERROR' }"') do (
    set "NGROK_URL=%%u"
)

:: Check if we got a valid URL
if "%NGROK_URL%"=="ERROR" (
    echo [ERROR] Failed to get ngrok URL. Is ngrok running?
    echo [INFO] Check http://localhost:4040/status manually
    pause
    exit /b 1
)

echo [INFO] ngrok HTTPS URL: %NGROK_URL%

:: Step 5: Build LINE webhook URL
echo [Step 5/6] Building LINE webhook URL...
set "WEBHOOK_URL=%NGROK_URL%/line/webhook"
echo [INFO] LINE Webhook URL: %WEBHOOK_URL%

:: Step 6: Display final results
echo.
echo ================================================
echo [SUCCESS] LINE Webhook Auto-Setup Complete!
echo ================================================
echo.
echo [READY] Use this URL in LINE Developers Console:
echo.
echo     %WEBHOOK_URL%
echo.
echo ================================================
echo Setup Instructions:
echo ================================================
echo 1. Open https://developers.line.biz/console/
echo 2. Select your provider ^& channel
echo 3. Go to: Messaging API ^> Webhook settings
echo 4. Paste the URL above into "Webhook URL"
echo 5. Click [Verify] to test connection
echo 6. Enable "Use webhook" switch
echo 7. Send a test message from LINE app
echo 8. Approve pairing: openclaw pairing approve line [CODE]
echo ================================================
echo.

:: Copy URL to clipboard (optional)
echo %WEBHOOK_URL% | clip
echo [INFO] Webhook URL copied to clipboard! ^(Ctrl+V to paste^)
echo.

pause
