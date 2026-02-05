@echo off
chcp 65001 >nul
echo ============================================
echo OpenClaw Gateway + LINE Auto Setup (Tailscale)
echo ============================================
echo.

REM 既存のGatewayプロセスを停止
echo [0/5] 既存のGatewayを停止しています...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq OpenClaw Gateway" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [1/5] GatewayをTailscale serveで起動しています...
start "OpenClaw Gateway" /MIN cmd /c "cd /d %~dp0 && node openclaw.mjs gateway --port 18789 --tailscale serve --verbose > gateway.log 2>&1"
echo    PID: %errorlevel%
echo.

echo [2/4] Gatewayの起動を待機中 (5秒)...
timeout /t 5 /nobreak >nul
echo    Ready!
echo.

echo [3/4] ブラウザを開きます...
start http://127.0.0.1:18789/
echo    URL: http://127.0.0.1:18789/
echo.

echo [4/4] ペアリングコードを確認中...
echo    コード: 86JJUFJ6
echo.

cd /d %~dp0
node openclaw.mjs pairing approve line 86JJUFJ6
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  承認に失敗しました。Gatewayがまだ準備中か、
    echo    ペアリングコードが無効になっています。
    echo.
    echo 10秒後に再試行します...
    timeout /t 10 /nobreak >nul
    node openclaw.mjs pairing approve line 86JJUFJ6
)

echo.
echo ============================================
echo セットアップ完了！
echo ============================================
echo.
echo 📱 LINEでメッセージを送信してテストしてください
echo 🌐 Web UI: http://127.0.0.1:18789/
echo 📋 Gatewayログ: gateway.log
echo.
echo 停止するには「gateway.log」を確認してPIDを特定し、
echo タスクマネージャーで「node.exe」を終了してください。
echo.
pause
