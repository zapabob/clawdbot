@echo off
chcp 65001 >nul
echo ============================================
echo OpenClaw + Tailscale Serve 起動
echo ============================================
echo.

REM 既存のGatewayを停止
echo [1/3] 既存のGatewayを停止...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo    完了
echo.

REM GatewayをTailscale serveで起動
echo [2/3] GatewayをTailscale serveで起動...
echo    コマンド: node openclaw.mjs gateway --port 18789 --tailscale serve
echo.
start "OpenClaw Gateway" /MIN cmd /c "cd /d %~dp0 && node openclaw.mjs gateway --port 18789 --tailscale serve --verbose > gateway.log 2>&1"
timeout /t 5 /nobreak >nul
echo    Gateway起動完了
echo.

REM Tailscaleステータス確認
echo [3/3] Tailscaleステータス確認...
tailscale status 2>nul | findstr ".ts.net" >nul
if %errorlevel% == 0 (
    echo    ✅ Tailscale接続確認済み
tailscale status 2>nul | findstr "\b100\.[0-9]" >nul
) else (
    echo    ⚠️  Tailscaleにログインしていない可能性があります
echo    コマンド: tailscale up
echo.
)

echo.
echo ============================================
echo セットアップ完了！
echo ============================================
echo.
echo 🌐 アクセス方法:
echo    ローカル: http://127.0.0.1:18789/
echo    Tailscale: https://[マシン名].ts.net/
echo.
echo 📋 確認コマンド:
echo    tailscale serve status
echo    tailscale status
echo.
echo 🚀 LINE Webhook設定:
echo    ngrokで一時公開する場合:
echo    ngrok http 18789
echo.
echo 📱 次のステップ:
echo    1. LINEでメッセージを送信
echo    2. ペアリングコードが届いたら承認
echo    3. approve-pairing.bat を実行
echo.
pause
