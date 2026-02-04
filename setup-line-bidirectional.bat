@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM LINE 双方向通信 完全セットアップ
REM ============================================

set SCRIPTDIR=%~dp0
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=!TIMESTAMP: =0!

echo ============================================
echo  LINE 双方向通信 セットアップ
echo ============================================
echo 開始時刻: %date% %time%
echo.

REM ============================================
REM ステップ1: Gateway確認
REM ============================================
echo [1/5] Gateway稼働確認...
curl -s http://127.0.0.1:18789 >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Gateway稼働中 (http://127.0.0.1:18789)
) else (
    echo    ⚠️  Gateway未起動、起動します...
    start "Gateway" /MIN cmd /c "cd /d %SCRIPTDIR% && node openclaw.mjs gateway --port 18789 --tailscale serve > gateway.log 2>&1"
    timeout /t 5 >nul
)
echo.

REM ============================================
REM ステップ2: Tailscale確認
REM ============================================
echo [2/5] Tailscale接続確認...
tailscale status >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%a in ('tailscale ip 2^>nul') do set TS_IP=%%a
    echo    ✅ Tailscale接続済み
    echo    IP: !TS_IP!
) else (
    echo    ⚠️  Tailscale未接続
    echo    tailscale up を実行してください
)
echo.

REM ============================================
REM ステップ3: ngrok起動（Webhook用）
REM ============================================
echo [3/5] ngrok起動...
taskkill /F /IM ngrok.exe 2>nul
timeout /t 2 >nul
start "ngrok" /MIN cmd /c "ngrok http 18789 --log=stdout > ngrok.log 2>&1"
timeout /t 8 >nul

REM ngrok URL取得
powershell -Command "try { $resp = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 10; $url = $resp.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1 -ExpandProperty public_url; Write-Output $url } catch { Write-Output 'ERROR' }" > ngrok_url.txt

set /p NGROK_URL=<ngrok_url.txt
if "%NGROK_URL%"=="ERROR" set NGROK_URL=

if defined NGROK_URL (
    echo    ✅ ngrok URL: %NGROK_URL%
) else (
    echo    ⚠️  ngrok URL取得中...（数秒后再試行）
    timeout /t 5 >nul
    for /f "tokens=*" %%a in ('powershell -Command "try { Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 10 | Where-Object { $_.tunnels } | ForEach-Object { $_.tunnels } | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1 -ExpandProperty public_url } catch { Write-Output '' }"') do set NGROK_URL=%%a
)
echo.

REM ============================================
REM ステップ4: LINE設定確認
REM ============================================
echo [4/5] LINE設定確認...
if exist "%SCRIPTDIR%.env" (
    findstr /i "LINE_CHANNEL_ACCESS_TOKEN" "%SCRIPTDIR%.env" >nul
    if %errorlevel% equ 0 (
        echo    ✅ LINE認証情報設定済み
    ) else (
        echo    ⚠️  LINE認証情報が未設定
    )
) else (
    echo    ⚠️  .envファイルが見つかりません
)
echo.

REM ============================================
REM ステップ5: 完了・次のステップ
REM ============================================
echo [5/5] セットアップ完了
echo.

echo ============================================
echo  ✅ セットアップ完了！
echo ============================================
echo.
echo 🌐 アクセスURL:
echo    ローカル:     http://127.0.0.1:18789
if defined TS_IP (
    echo    Tailscale:    https://!TS_IP!:18789
)
if defined NGROK_URL (
    echo    公開(ngrok):  %NGROK_URL%
)
echo.
echo 📱 LINE Webhook URL:
if defined NGROK_URL (
    echo    %NGROK_URL%/line/webhook
) else (
    echo    （ngrok起動後に確認: ngrok.bat実行）
)
echo.
echo 📋 次のステップ:
echo    1. https://developers.line.biz/console/ にアクセス
echo    2. Messaging API設定を開く
echo    3. Webhook URLに上記URLを設定
echo    4. "Use webhook"を有効化
echo    5. "Verify"ボタンで検証
echo    6. LINEでボットにメッセージを送信
echo.
echo 💡 ペアリング承認:
echo    node openclaw.mjs pairing list line
echo    node openclaw.mjs pairing approve line <CODE>
echo.
echo 📁 ログ:
echo    Gateway:   gateway.log
echo    ngrok:     ngrok.log
echo.

set WEBHOOK_URL=
if defined NGROK_URL set WEBHOOK_URL=%NGROK_URL%/line/webhook
if defined TS_IP if not defined NGROK_URL set WEBHOOK_URL=https://!TS_IP!:18789/line/webhook

if defined WEBHOOK_URL (
    echo 🎯 Webhook URL:
    echo    %WEBHOOK_URL%
    echo.
    echo このURLをLINE Developer Consoleに設定してください。
)

pause
