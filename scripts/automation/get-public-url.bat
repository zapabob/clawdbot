@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM LINE Webhook 公開URL取得
REM ============================================

set SCRIPTDIR=%~dp0
set TUNNEL_DIR=%SCRIPTDIR%.tunnel

echo ============================================
echo Webhook 公開URL取得
echo ============================================
echo.

REM 方法1: Cloudflare Tunnel
echo [1/2] Cloudflare Tunnelを試み中...
if exist "%TUNNEL_DIR%\cloudflared.exe" (
    echo    起動中...
    start "Cloudflare" /MIN cmd /c "%TUNNEL_DIR%\cloudflared.exe tunnel --url http://localhost:18789 > %TUNNEL_DIR%\cf-url.log 2>&1"
    
    echo    ⏳ URL取得中（10秒待機）...
    timeout /t 10 /nobreak >nul
    
    echo    結果:
    findstr "https://" "%TUNNEL_DIR%\cf-url.log" 2>nul | findstr "trycloudflare" >nul
    if !errorlevel! equ 0 (
        for /f "tokens=*" %%a in ('findstr "https://" "%TUNNEL_DIR%\cf-url.log" 2^>nul ^| findstr "trycloudflare" ^| head -1') do (
            echo.
            echo ═══════════════════════════════════════════
            echo ✅ 公開URL取得完了！
            echo ═══════════════════════════════════════════
            echo.
            echo    %%a/line/webhook
            echo.
            echo このURLをLINE Developer Consoleに設定してください
            echo ═══════════════════════════════════════════
            echo.
        )
    ) else (
        echo    URL未取得、もう一度試行するかログを確認
    )
) else (
    echo    Cloudflare未インストール
)

echo.

REM 方法2: localtunnel
echo [2/2] localtunnelを試み中...
echo    npx localtunnel --port 18789
echo    を別のターミナルで実行してください
echo.

pause
