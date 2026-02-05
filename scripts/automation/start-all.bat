@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================
echo   OpenClaw + LINE 完全自動化
echo ============================================
echo.

REM ============================================
REM 1. LINE認証情報の確認
REM ============================================
echo [1/4] LINE認証情報を確認中...

if "%LINE_CHANNEL_ACCESS_TOKEN%"=="" (
    echo   ERROR: LINE_CHANNEL_ACCESS_TOKENが設定されていません
    echo.
    echo   設定方法:
    echo   1. https://developers.line.me/console/ にアクセス
    echo   2. Channel access tokenをコピー
    echo   3. 以下のコマンドを実行:
    echo      setx LINE_CHANNEL_ACCESS_TOKEN "あなたのトークン"
    echo.
    pause
    exit /b 1
)

if "%LINE_CHANNEL_SECRET%"=="" (
    echo   WARNING: LINE_CHANNEL_SECRETが設定されていません
    echo.
    echo   設定方法:
    echo   1. https://developers.line.me/console/ にアクセス
    echo   2. Channel secretをコピー
    echo   3. 入力してください:
    set /p LINE_CHANNEL_SECRET="   Channel Secret: "
    if not "%LINE_CHANNEL_SECRET%"=="" (
        setx LINE_CHANNEL_SECRET "%LINE_CHANNEL_SECRET%"
        echo   OK: Channel Secretを設定しました
    ) else (
        echo   ERROR: Channel Secretが空です
    )
)

echo   OK: LINE認証情報確認済み
echo.

REM ============================================
REM 2. 既存のプロセスを停止
REM ============================================
echo [2/4] 既存のプロセスを停止中...

taskkill /F /IM node.exe /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo   OK: 停止完了
echo.

REM ============================================
REM 3. Webhookサーバーを起動
REM ============================================
echo [3/4] Webhookサーバーを起動中...

set WEBHOOK_SCRIPT=%~dp0..\extensions\line-ai-bridge\dist\src\webhook-server.js

if not exist "%WEBHOOK_SCRIPT%" (
    echo   ERROR: Webhookサーバー脚本が見つかりません
    echo   ビルドを実行: cd extensions\line-ai-bridge && npm run build
    pause
    exit /b 1
)

start /B node "%WEBHOOK_SCRIPT%" >nul 2>&1
timeout /t 3 /nobreak >nul

netstat -ano | findstr :3000 >nul
if %ERRORLEVEL% equ 0 (
    echo   OK: Webhookサーバー起動済み (ポート3000)
) else (
    echo   WARNING: Webhookサーバーの確認が取れませんでした
)

echo.

REM ============================================
REM 4. Tailscale Funnelを設定
REM ============================================
echo [4/4] Tailscale Funnelを設定中...

REM Tailscaleが起動しているか確認
tasklist | findstr tailscale.exe >nul
if %ERRORLEVEL% neq 0 (
    echo   Tailscaleを起動中...
    start /B tailscale up >nul 2>&1
    timeout /t 5 /nobreak >nul
)

REM Funnelを設定
tailscale funnel reset >nul 2>&1
timeout /t 2 /nobreak >nul
tailscale funnel http://localhost:3000/webhook >nul 2>&1
timeout /t 2 /nobreak >nul

echo   OK: Funnel設定済み
echo.

REM ============================================
REM 完了表示
REM ============================================
echo ============================================
echo   起動完了！
echo ============================================
echo.
echo 📡 接続情報:
echo.
echo   LAN内アクセス:
echo      http://localhost:3000/webhook/line
echo.
echo   外部アクセス (LINEから):
for /f "skip=2 tokens=2" %%a in ('ipconfig /all ^| findstr "IPv4" ^| findstr /v "Virtual"') do set LOCAL_IP=%%a
if defined LOCAL_IP (
    echo      http://%LOCAL_IP%:3000/webhook/line
)
echo.
echo   Tailscale DNS:
for /f "tokens=2" %%a in ('tailscale status --json ^| findstr "DNSName" ^| findstr /v "iphone" ^| findstr /v "empty" ^| head /1') do set TAILNET=%%a
echo      https://%TAILNET:~1,-1%/webhook/line
echo.
echo 📱 LINE設定:
echo.
echo   1. https://developers.line.me/console/ にアクセス
echo   2. Webhook設定に以下を入力:
echo      https://%TAILNET:~1,-1%/webhook/line
echo   3. 「検証」をクリック
echo.
echo ============================================
echo.

pause
