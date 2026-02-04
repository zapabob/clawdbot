@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM LINE Webhook URL 取得スクリプト
REM ============================================

echo ============================================
echo LINE Webhook URL 取得
echo ============================================
echo.

REM ngrok停止（既存）
taskkill /F /IM ngrok.exe 2>nul
timeout /t 2 /nobreak >nul
echo [1/3] ngrokを停止
echo.

REM ngrok起動
echo [2/3] ngrokを起動中...
start "ngrok" /MIN cmd /c "ngrok http 18789 --log=stdout > ngrok.log 2>&1"
timeout /t 8 /nobreak >nul
echo    ngrok起動完了
echo.

REM URL取得
echo [3/3] Webhook URL取得中...
powershell -Command "try { $resp = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 10; $url = $resp.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1 -ExpandProperty public_url; if ($url) { Write-Output $url } else { Write-Output 'NOT_FOUND' } } catch { Write-Output 'ERROR' }" > ngrok_url.txt

set /p NGROK_URL=<ngrok_url.txt

if "%NGROK_URL%"=="NOT_FOUND" (
    echo    ⚠️  ngrokトンネルが見つかりません
    echo    数秒后再試行してください
) else if "%NGROK_URL%"=="ERROR" (
    echo    ⚠️  ngrok APIエラー
    echo    ngrok.log を確認してください
) else (
    echo.
    echo ============================================
    echo ✅ Webhook URL取得完了！
    echo ============================================
    echo.
    echo 📱 LINE Developer Consoleに設定:
    echo    %NGROK_URL%/line/webhook
    echo.
    echo 🌐 テスト用URL:
    echo    http://127.0.0.1:18789/line/webhook
    echo.
    echo 📝 次のステップ:
    echo    1. https://developers.line.biz/console/ にアクセス
    echo    2. Messaging API設定を開く
    echo    3. Webhook URLに上記URLを設定
    echo    4. Use webhookを有効化
    echo    5. Verifyボタンで検証
    echo.
    echo 💬 テスト:
    echo    LINEでボットにメッセージを送信
    echo.
)

pause
