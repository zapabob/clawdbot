@echo off
chcp 65001 >nul
REM ============================================
REM 🦞 OpenClaw 自動起動スクリプト (Windows)
REM ============================================

set "SCRIPT_DIR=%~dp0"
set "OPENCLAW_DIR=%USERPROFILE%\.openclaw"
set "LOG_DIR=%OPENCLAW_DIR%\logs"
set "PORT=18789"

echo ============================================
echo 🦞 OpenClaw 自動起動スクリプト
echo ============================================
echo %date% %time%
echo.

REM ログディレクトリ作成
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM ============================================
REM Step 1: Tailscale Funnel 起動
REM ============================================
echo [1/4] Tailscale Funnel を確認中...
timeout /t 2 /nobreak >nul

tailscale funnel --bg %PORT% 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Tailscale Funnel 起動済み
) else (
    echo [INFO] Tailscale Funnel を開始中...
    tailscale funnel --bg %PORT%
)

REM ============================================
REM Step 2: Tailscale URL 取得
REM ============================================
echo.
echo [2/4] Tailscale URL を取得中...
timeout /t 3 /nobreak >nul

for /f "tokens=*" %%a in ('tailscale funnel status --json 2^>nul ^| powershell -Command "$input = $input -replace '.*https://[^/]+', ''; $input"') do set TAILSCALE_URL=%%a
tailscale funnel status > "%LOG_DIR%\tailscale-status.txt" 2>&1

for /f "usebackq tokens=2 delims=:" %%a in (`type "%LOG_DIR%\tailscale-status.txt" ^| findstr /c:"https://"`) do (
    set "WEBHOOK_BASE=%%a"
    goto :got_url
)
echo [WARN] Tailscale URL取得失敗 - 手動で確認してください
set "WEBHOOK_BASE=unknown"
:got_url

set WEBHOOK_URL=%WEBHOOK_BASE%/line/webhook
echo [OK] Webhook URL: %WEBHOOK_URL%

REM ============================================
REM Step 3: LINE Webhook 設定
REM ============================================
echo.
echo [3/4] LINE Webhook を設定中...

if exist "%OPENCLAW_DIR%\.env" (
    for /f "tokens=1,* delims==" %%a in ('findstr "^LINE_CHANNEL_ACCESS_TOKEN" "%OPENCLAW_DIR%\.env" 2^>nul') do set LINE_TOKEN=%%b
    for /f "tokens=1,* delims==" %%a in ('findstr "^LINE_CHANNEL_SECRET" "%OPENCLAW_DIR%\.env" 2^>nul') do set LINE_SECRET=%%b
)

if defined LINE_TOKEN (
    echo [OK] LINE認証情報読み込み完了
) else (
    echo [WARN] LINE認証情報がありません
)

REM ============================================
REM Step 4: OpenClaw Gateway 起動
REM ============================================
echo.
echo [4/4] OpenClaw Gateway を起動中...

set "LOG_FILE=%LOG_DIR%\openclaw-%date:~-10,4%%date:~-5,2%%date:~-2,2%.log"

echo Starting OpenClaw Gateway on port %PORT%...
echo.

if exist "%USERPROFILE%\AppData\Roaming\npm\openclaw.cmd" (
    start "OpenClaw Gateway" /B cmd /c "openclaw gateway --port %PORT% --verbose >> \"%LOG_FILE%\" 2>&1"
    echo [OK] OpenClaw Gateway 起動完了
) else if exist "%USERPROFILE%\AppData\Roaming\pnpm\global\5\node_modules\openclaw\dist\index.js" (
    start "OpenClaw Gateway" /B cmd /c "node \"%USERPROFILE%\AppData\Roaming\pnpm\global\5\node_modules\openclaw\dist\index.js\" gateway --port %PORT% --verbose >> \"%LOG_FILE%\" 2>&1"
    echo [OK] OpenClaw Gateway 起動完了
) else (
    echo [ERROR] OpenClaw が見つかりません
    echo インストール后再試行: npm install -g openclaw@latest
    pause
    exit /b 1
)

echo.
echo ============================================
echo ✅ 起動完了
echo ============================================
echo.
echo Tailscale URL: %WEBHOOK_BASE%
echo Webhook URL: %WEBhook_URL%
echo.
echo 次のステップ:
echo 1. LINE Developers Console でWebhook URLを設定
echo 2. LINEからボットにメッセージ送信
echo 3. openclaw pairing approve line [コード] で承認
echo.
echo ログ確認: type "%LOG_FILE%"
echo.
pause
