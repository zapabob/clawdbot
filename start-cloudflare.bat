@echo off
chcp 65001 >nul

REM ============================================
REM Cloudflare Tunnel 起動
REM ============================================

echo Cloudflare Tunnelを起動中...

.tunnel\cloudflared.exe tunnel --url http://localhost:18789

pause
