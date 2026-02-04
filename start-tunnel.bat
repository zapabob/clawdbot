@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM Cloudflare Tunnel 起動スクリプト
REM ============================================

set SCRIPTDIR=%~dp0
set TUNNEL_DIR=%SCRIPTDIR%.tunnel

echo ============================================
echo Cloudflare Tunnel 起動
echo ============================================
echo.

REM Cloudflare確認
if not exist "%TUNNEL_DIR%\cloudflared.exe" (
    echo ⚠️  cloudflared.exeが見つかりません
    echo ダウンロード中...
    powershell -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%TUNNEL_DIR%\cloudflared.exe' -TimeoutSec 60"
)

if exist "%TUNNEL_DIR%\cloudflared.exe" (
    echo 起動中...
    start "CloudflareTunnel" /MIN cmd /c "%TUNNEL_DIR%\cloudflared.exe tunnel --url http://localhost:18789 > %TUNNEL_DIR%\cloudflare.log 2>&1"
    echo.
    echo ⏳ 10秒待機中...
    timeout /t 10 /nobreak >nul
    
    echo.
    echo ログ確認中...
    type "%TUNNEL_DIR%\cloudflare.log" 2>nul | findstr "https://"
    echo.
    echo 💡 表示されたURLをLINE Developer Consoleに設定してください
) else (
    echo ❌ cloudflared.exeのダウンロードに失敗しました
)

echo.
pause
