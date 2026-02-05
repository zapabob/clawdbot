@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ============================================
echo OpenClaw + LINE + Tailscale 全自動セットアップ
echo ============================================
echo.

REM === ステップ1: 既存プロセスの停止 ===
echo [1/6] 既存のGatewayとngrokを停止...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM ngrok.exe 2>nul
timeout /t 2 /nobreak >nul
echo    完了
echo.

REM === ステップ2: Tailscale確認 ===
echo [2/6] Tailscale状態確認...
tailscale status >nul 2>&1
if %errorlevel% neq 0 (
    echo    ⚠️  Tailscaleにログインしていません
echo    コマンド: tailscale up
echo.
echo    Tailscaleログイン後、再度実行してください。
echo.
pause
exit /b 1
)
echo    ✅ Tailscale接続確認済み
tailscale status 2>nul | findstr /R "^[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*" | head -1
echo.

REM === ステップ3: Gateway起動 ===
echo [3/6] GatewayをTailscale serveで起動...
start "OpenClaw Gateway" /MIN cmd /c "cd /d %~dp0 && node openclaw.mjs gateway --port 18789 --tailscale serve --verbose > gateway.log 2>&1"
timeout /t 5 /nobreak >nul
echo    ✅ Gateway起動完了 (127.0.0.1:18789)
echo.

REM === ステップ4: ngrok起動 ===
echo [4/6] ngrokを起動して公開URLを取得...
which ngrok >nul 2>&1
if %errorlevel% neq 0 (
    echo    ⚠️  ngrokが見つかりません
echo    https://ngrok.com/download からダウンロードしてください
echo    またはパスに追加してください。
echo.
echo    ngrokなしではLINE webhookが動作しません。
echo.
set NGROK_URL=MANUAL_REQUIRED
goto SKIP_NGROK
)

start "ngrok" /MIN cmd /c "ngrok http 18789 --log=stdout > ngrok.log 2>&1"
timeout /t 5 /nobreak >nul

REM ngrok URLを抽出
for /f "tokens=*" %%a in ('powershell -Command "try { $resp = Invoke-RestMethod -Uri http://127.0.0.1:4040/api/tunnels -TimeoutSec 5; $url = $resp.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1 -ExpandProperty public_url; if ($url) { Write-Output $url } else { Write-Output 'NOT_FOUND' } } catch { Write-Output 'ERROR' }"') do set NGROK_URL=%%a

if "%NGROK_URL%"=="ERROR" (
    echo    ⚠️  ngrok URL取得失敗
echo    ngrok.log を確認してください。
set NGROK_URL=MANUAL_REQUIRED
) else if "%NGROK_URL%"=="NOT_FOUND" (
    echo    ⚠️  ngrokトンネルが見つかりません
echo    ngrokの起動を待機しています...
timeout /t 3 /nobreak >nul
echo    手動で確認: https://dashboard.ngrok.com/cloud-edge/endpoints
echo.
set NGROK_URL=MANUAL_REQUIRED
) else (
echo    ✅ 公開URL: %NGROK_URL%
echo.
)

:SKIP_NGROK

REM === ステップ5: LINE Webhook設定指示 ===
echo ============================================
echo [5/6] LINE Webhook設定
echo ============================================
echo.
echo 📱 LINE Developer Consoleで以下を設定してください:
echo    URL: %NGROK_URL%/line/webhook
echo.
if "%NGROK_URL%"=="MANUAL_REQUIRED" (
echo    ⚠️  ngrokが起動していない場合:
echo    1. ngrok http 18789
echo    2. 生成されたHTTPS URLをコピー
echo    3. https://developers.line.biz/console/ にアクセス
echo    4. Webhook URLに貼り付け (URL/line/webhook)
echo.
)
echo    🌐 Webhookテスト用URL:
echo       http://127.0.0.1:18789/line/webhook
echo.
echo    ⏳ LINEでメッセージを送信してください...
echo       （ペアリングコードが届きます）
echo.

REM === ステップ6: ペアリング自動待機・承認 ===
echo ============================================
echo [6/6] ペアリングリクエスト待機
echo ============================================
echo.
echo ⏳ LINEでボットにメッセージを送信してください...
echo    （例: 「こんにちは」「hello」など）
echo.

set RETRY_COUNT=0
:WAIT_LOOP
node openclaw.mjs pairing list line --json 2>nul | findstr "\"code\"" >nul
if %errorlevel% == 0 (
echo.
echo ✅ ペアリングリクエスト検出！
echo.
node openclaw.mjs pairing list line
echo.

REM 最新のペアリングコードを取得
for /f "tokens=*" %%a in ('node openclaw.mjs pairing list line --json 2^>nul ^| powershell -Command "$json = $input | Out-String | ConvertFrom-Json; if ($json.requests.Count -gt 0) { Write-Output $json.requests[0].code } else { Write-Output 'NONE' }"') do set PAIRING_CODE=%%a

if "!PAIRING_CODE!"=="NONE" (
echo    ⚠️  コード取得失敗。手動で承認してください:
echo    node openclaw.mjs pairing approve line ^<コード^>
echo.
) else (
echo    📝 検出されたコード: !PAIRING_CODE!
echo    承認中...
node openclaw.mjs pairing approve line !PAIRING_CODE!
if !errorlevel! == 0 (
echo.
echo ✅ 承認成功！LINEでボットと会話できます。
) else (
echo.
echo ❌ 承認失敗。コードを確認してください。
)
)
goto END
) else (
set /a RETRY_COUNT+=1
if !RETRY_COUNT! gtr 60 (
echo.
echo ⚠️  タイムアウト（5分経過）
echo    承認待機を終了します。
echo    手動で承認する場合:
echo    node openclaw.mjs pairing approve line ^<コード^>
echo.
goto END
)
echo    待機中... (!RETRY_COUNT!/60) ^(LINEでメッセージを送信^)
timeout /t 5 /nobreak >nul
goto WAIT_LOOP
)

:END
echo.
echo ============================================
echo セットアップ完了！
echo ============================================
echo.
echo 🌐 アクセス方法:
echo    ローカル: http://127.0.0.1:18789/
echo    Tailscale: https://[マシン名].ts.net/
if not "%NGROK_URL%"=="MANUAL_REQUIRED" (
echo    公開URL: %NGROK_URL%
)
echo.
echo 📱 LINE Webhook URL:
if not "%NGROK_URL%"=="MANUAL_REQUIRED" (
echo    %NGROK_URL%/line/webhook
) else (
echo    （ngrok起動後に確認してください）
)
echo.
echo 📋 ログファイル:
echo    Gateway: gateway.log
echo    ngrok: ngrok.log
echo.
echo 🔧 管理コマンド:
echo    ステータス確認: node openclaw.mjs status
echo    ヘルスチェック: node openclaw.mjs health
echo    ペアリング確認: node openclaw.mjs pairing list line
echo.
echo ⛔ 停止方法:
echo    タスクマネージャーで以下を終了:
echo    - node.exe (Gateway)
echo    - ngrok.exe
echo.
pause
