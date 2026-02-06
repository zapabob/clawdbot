@echo off
chcp 65001 >nul
cd /d "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
title OpenClaw Gateway

echo ============================================
echo 🦞 OpenClaw Gateway
echo ============================================
echo.

set "LOG_DIR=%USERPROFILE%\.openclaw\logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo プロジェクトディレクトリ: %CD%
echo ログディレクトリ: %LOG_DIR%
echo.

echo [1/2] 依存関係を確認中...
call npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm が見つかりません。Node.jsをインストールしてください。
    pause
    exit /b 1
)
echo [OK] npm: OK

call pnpm --version >nul 2>&1
if errorlevel 1 (
    echo [WARN] pnpm が見つかりません。pnpm install を実行します...
    call npm install -g pnpm
)
echo [OK] pnpm: OK

echo.
echo [2/2] OpenClaw Gateway を起動中...
echo -------------------------------------------

call pnpm openclaw gateway --port 18789 --verbose

echo -------------------------------------------
echo.
echo [INFO] 終了するには X を押してウィンドウを閉じてください
pause >nul
