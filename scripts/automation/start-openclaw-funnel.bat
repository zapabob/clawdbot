@echo off
chcp 65001 >nul
set ERRORLEVEL=0

set SCRIPT_DIR=%~dp0
set LOG_FILE=%SCRIPT_DIR%openclaw-funnel.log

echo [%DATE% %TIME%] === OpenClaw + LINE Funnel Auto-Start === >> %LOG_FILE%

REM 1. Tailscale起動確認
echo [%DATE% %TIME%] Checking Tailscale... >> %LOG_FILE%
tasklist /FI "IMAGENAME eq tailscale.exe" 2>nul | find /I /N "tailscale.exe" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [%DATE% %TIME%] Starting Tailscale... >> %LOG_FILE%
    start /B tailscale up >nul 2>&1
    timeout /t 5 /nobreak >nul
)

REM 2. Funnel設定
echo [%DATE% %TIME%] Configuring Tailscale Funnel... >> %LOG_FILE%
tailscale funnel reset >nul 2>&1
tailscale funnel http://localhost:3000/webhook >nul 2>&1

REM 3. OpenClaw Gateway起動
echo [%DATE% %TIME%] Starting OpenClaw Gateway... >> %LOG_FILE%
cd /d %SCRIPT_DIR%
start /B pnpm gateway run --bind all --port 18789 >nul 2>&1
timeout /t 10 /nobreak >nul

REM 4. LINE webhookサーバーが無ければ起動
netstat -ano | findstr :3000 >nul
if %ERRORLEVEL% NEQ 0 (
    echo [%DATE% %TIME%] Starting LINE webhook server... >> %LOG_FILE%
    start /B node extensions/line-ai-bridge/dist/webhook-server.js >nul 2>&1
    timeout /t 5 /nobreak >nul
)

REM 5. ステータス表示
echo [%DATE% %TIME%] === Status === >> %LOG_FILE%
for /f "skip=2 tokens=2" %%a in ('netsh interface ip show address "Ethernet" ^| findstr "IP"') do set LOCAL_IP=%%a
echo [%DATE% %TIME%] LAN IP: %LOCAL_IP% >> %LOG_FILE%
echo [%DATE% %TIME%] Ready! >> %LOG_FILE%

echo.
echo ========================================
echo   OpenClaw + LINE Funnel 起動完了
echo ========================================
echo.
echo LINE Developers Consoleで設定:
echo   Webhook URL:
echo   http://%LOCAL_IP%:3000/webhook/line
echo.
echo Tailscale経由（外部アクセス）:
echo   https://<your-tailnet>.ts.net/webhook/line
echo.
echo ゲートウェイ: http://localhost:18789
echo ========================================
pause
