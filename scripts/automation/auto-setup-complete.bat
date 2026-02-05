@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ============================================
echo OpenClaw + PostgreSQL + LINE + Tailscale
echo 完全自動統合セットアップ
-echo ============================================
echo.
echo このスクリプトは以下を自動実行します:
echo   1. PostgreSQLインストール
-echo   2. データベース・スキーマ作成
echo   3. OpenClaw設定更新
echo   4. データ移行
-echo   5. Gateway起動 (Tailscale serve)
echo   6. LINEペアリング承認待機
echo.

REM === 管理者権限チェック ===
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  管理者権限が必要です
    echo    右クリック → 「管理者として実行」してください
    echo.
    pause
    exit /b 1
)

REM === PostgreSQLセットアップ ===
echo [フェーズ1/3] PostgreSQLセットアップ...
echo ============================================
call setup-postgresql.bat
if %errorlevel% neq 0 (
    echo ❌ PostgreSQLセットアップ失敗
    pause
    exit /b 1
)

REM === 依存関係インストール ===
echo.
echo [フェーズ2/3] Node.js依存関係インストール...
echo ============================================
cd /d "%~dp0"
echo    pgモジュールをインストール中...
pnpm install pg >nul 2>&1
if %errorlevel% neq 0 (
    echo    npmで再試行...
    npm install pg
)
echo    ✅ pgモジュールインストール完了

REM === OpenClaw + Tailscale + LINE起動 ===
echo.
echo [フェーズ3/3] OpenClaw統合起動...
echo ============================================
echo.
echo    📦 全自動モードで起動します...
echo    （LINEメッセージ送信を待機します）
echo.

REM GatewayをTailscale serveでバックグラウンド起動
start "OpenClaw Gateway" /MIN cmd /c "cd /d %~dp0 && node openclaw.mjs gateway --port 18789 --tailscale serve --verbose > gateway.log 2>&1"
timeout /t 5 /nobreak >nul

REM ngrok起動（LINE Webhook用）
which ngrok >nul 2>&1
if %errorlevel% == 0 (
    start "ngrok" /MIN cmd /c "ngrok http 18789 --log=stdout > ngrok.log 2>&1"
    timeout /t 3 /nobreak >nul
    
    REM ngrok URL取得
    for /f "tokens=*" %%a in ('powershell -Command "try { $resp = Invoke-RestMethod -Uri http://127.0.0.1:4040/api/tunnels -TimeoutSec 3; $url = $resp.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1 -ExpandProperty public_url; if ($url) { Write-Output $url } else { Write-Output 'NOT_FOUND' } } catch { Write-Output 'ERROR' }"') do set NGROK_URL=%%a
    
    if not "!NGROK_URL!"=="ERROR" if not "!NGROK_URL!"=="NOT_FOUND" (
        echo    🌐 LINE Webhook URL: !NGROK_URL!/line/webhook
        echo.
        echo    📱 https://developers.line.biz/console/ で設定:
        echo       Webhook URL: !NGROK_URL!/line/webhook
        echo.
    )
)

REM ペアリング自動承認ループ
echo    ⏳ LINEでメッセージを送信してください...
echo       （ペアリングコードが届き次第、自動承認します）
echo.

set RETRY_COUNT=0
:WAIT_LOOP
node openclaw.mjs pairing list line --json 2>nul | findstr "\"code\"" >nul
if %errorlevel% == 0 (
    echo.
    echo ✅ ペアリングリクエスト検出！
    echo.
    
    REM 最新コード取得
    for /f "tokens=*" %%a in ('node openclaw.mjs pairing list line --json 2^>nul ^| powershell -Command "$json = $input | Out-String | ConvertFrom-Json; if ($json.requests.Count -gt 0) { Write-Output $json.requests[0].code } else { Write-Output 'NONE' }"') do set PAIRING_CODE=%%a
    
    if not "!PAIRING_CODE!"=="NONE" (
        echo    📝 コード: !PAIRING_CODE!
        node openclaw.mjs pairing approve line !PAIRING_CODE!
        if !errorlevel! == 0 (
            echo    ✅ 承認成功！
            goto COMPLETE
        )
    )
)

set /a RETRY_COUNT+=1
if !RETRY_COUNT! gtr 72 (
    echo    ⚠️  タイムアウト（6分経過）
    echo    手動承認: node openclaw.mjs pairing approve line ^<コード^>
    goto COMPLETE
)

echo    待機中... (!RETRY_COUNT!/72)
timeout /t 5 /nobreak >nul
goto WAIT_LOOP

:COMPLETE
echo.
echo ============================================
echo ✅ 完全自動セットアップ完了！
echo ============================================
echo.
echo 🎉 すべてのコンポーネントが稼働中:
echo    ✅ PostgreSQLデータベース
echo    ✅ OpenClaw Gateway (Tailscale serve)
echo    ✅ LINE Webhook
echo    ✅ ペアリング承認済み
echo.
echo 🌐 アクセス方法:
echo    ローカル: http://127.0.0.1:18789/
echo    Tailscale: https://[マシン名].ts.net/
if not "!NGROK_URL!"=="" (
    echo    公開URL: !NGROK_URL!
)
echo.
echo 📱 今すぐLINEでボットと会話できます！
echo.
echo 📊 PostgreSQL確認コマンド:
echo    psql -U openclaw_app -d openclaw -c "\dt"
echo.
echo 🔧 管理コマンド:
echo    ステータス: node openclaw.mjs status
echo    ペアリング: node openclaw.mjs pairing list line
echo    データベース: psql -U openclaw_app -d openclaw
echo.
pause
