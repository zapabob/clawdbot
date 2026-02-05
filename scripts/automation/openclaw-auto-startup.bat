@echo off
chcp 65001 >nul
REM OpenClaw 完全自動起動スクリプト (Windowsスタートアップ用)
REM PC起動時に自動実行

setlocal enabledelayedexpansion

REM ============================================
REM パス設定
REM ============================================
set SCRIPT_DIR=%~dp0
set OPENCLAW_DIR=%SCRIPT_DIR%..
set LOG_FILE=%SCRIPT_DIR%openclaw-auto.log

echo [%DATE% %TIME%] OpenClaw自動起動開始 >> %LOG_FILE%

REM ============================================
REM 1. 環境変数読み込み
REM ============================================
set LINE_TOKEN=%LINE_CHANNEL_ACCESS_TOKEN%
set LINE_SECRET=%LINE_CHANNEL_SECRET%

if "!LINE_TOKEN!"=="" (
    echo [%DATE% %TIME%] ERROR: LINE_TOKEN未設定 >> %LOG_FILE%
    exit /b 1
)

if "!LINE_SECRET!"=="" (
    echo [%DATE% %TIME%] ERROR: LINE_SECRET未設定 >> %LOG_FILE%
    exit /b 1
)

REM ============================================
REM 2. 既存プロセス停止
REM ============================================
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo [%DATE% %TIME%] 既存プロセス停止完了 >> %LOG_FILE%

REM ============================================
REM 3. Webhookサーバー起動
REM ============================================
set WEBHOOK_SCRIPT=%OPENCLAW_DIR%\extensions\line-ai-bridge\dist\src\webhook-server.js

if exist "!WEBHOOK_SCRIPT!" (
    start /B node "!WEBHOOK_SCRIPT!" >> %LOG_FILE% 2>&1
    echo [%DATE% %TIME%] Webhookサーバー起動 >> %LOG_FILE%
) else (
    echo [%DATE% %TIME%] ERROR: Webhookスクリプトが見つからない >> %LOG_FILE%
)

timeout /t 5 /nobreak >nul

REM ============================================
REM 4. Tailscale Funnel設定
REM ============================================
tailscale funnel reset >nul 2>&1
timeout /t 2 /nobreak >nul
tailscale funnel http://localhost:3000/webhook >nul 2>&1
echo [%DATE% %TIME%] Funnel設定完了 >> %LOG_FILE%

REM ============================================
REM 完了
REM ============================================
echo [%DATE% %TIME%] 自動起動完了 >> %LOG_FILE%
echo OpenClaw自動起動完了
