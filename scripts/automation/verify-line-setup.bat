@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM LINE Webhook 最終確認スクリプト
REM ============================================

set SCRIPTDIR=%~dp0

echo ============================================
echo LINE Webhook 設定最終確認
echo ============================================
echo.

REM Gateway確認
echo [1/4] Gateway稼働確認...
curl -s -o nul -w "    HTTP: %{http_code}\n" http://127.0.0.1:18789/line/webhook 2>nul
echo.

REM Webhookテスト
echo [2/4] Webhook応答テスト...
curl -s -X POST -H "Content-Type: application/json" -H "X-Line-Signature: dGVzdA==" -d "{\"events\":[{\"type\":\"ping\"}]}" http://127.0.0.1:18789/line/webhook 2>&1
echo.

REM 設定確認
echo [3/4] LINE設定確認...
grep -A 5 '"line"' "C:\Users\downl\.openclaw\openclaw.json" 2>nul | findstr "enabled channelAccessToken channelSecret"
echo.

REM Tailscale IP
echo [4/4] 接続URL...
for /f "tokens=*" %%a in ('tailscale ip 2^>nul') do set TS_IP=%%a
if defined TS_IP (
    echo    Tailscale: https://!TS_IP!:18789/line/webhook
)
echo.

echo ============================================
echo 設定完了！LINE Developer Consoleで設定してください
echo ============================================
echo.
echo 🌐 Webhook URL:
if defined TS_IP (
    echo    https://!TS_IP!:18789/line/webhook
)
echo.
echo 📱 LINE Developer Console:
echo    1. https://developers.line.biz/console/ にアクセス
echo    2. Messaging API設定を開く
echo    3. Webhook URLに上記URLを設定
echo    4. "Use webhook" = ON
echo    5. "Verify"ボタンをクリック
echo    6. "Reply message"と"Join group"をON
echo.
echo 💡 テスト:
echo    LINEでボットにメッセージ送信
echo    ペアリングコード了承後、双方向通信開始
echo.

pause
