@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM AGI + Tailscale 完全自動化システム
REM バックグラウンド監視・自己修復・常時稼働
REM ============================================

set SCRIPTDIR=%~dp0
set LOGDIR=%SCRIPTDIR%logs
set PIDDIR=%SCRIPTDIR%.pids
set AGIDIR=%SCRIPTDIR%auto-improve

mkdir "%LOGDIR%" 2>nul
mkdir "%PIDDIR%" 2>nul

set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=!TIMESTAMP: =0!
set MAINLOG=%LOGDIR%\agi-tailscale-!TIMESTAMP!.log

echo ============================================ >> "%MAINLOG%"
echo AGI+Tailscale自動化システム起動 !TIMESTAMP! >> "%MAINLOG%"
echo ============================================ >> "%MAINLOG%"

:MAIN_LOOP
call :LOG "=== 自動化サイクル開始 ==="
call :CHECK_ALL
call :START_SERVICES
call :MONITOR_HEALTH 60
goto :MAIN_LOOP

:CHECK_ALL
call :LOG "[CHECK] 全サービス状態確認"
call :CHECK_TAILSCALE
call :CHECK_GATEWAY
call :CHECK_AGI
exit /b 0

:CHECK_TAILSCALE
tailscale status >nul 2>&1
if %errorlevel% neq 0 (
    call :LOG "[WARN] Tailscale再接続中..."
    tailscale up
)
exit /b 0

:CHECK_GATEWAY
curl -s http://127.0.0.1:18789 >nul 2>&1
if %errorlevel% neq 0 (
    call :LOG "[WARN] Gateway再起動中..."
    taskkill /F /IM node.exe 2>nul
    timeout /t 2 >nul
    start "Gateway" /MIN cmd /c "cd /d %SCRIPTDIR% && node openclaw.mjs gateway --port 18789 --tailscale serve > gateway.log 2>&1"
    timeout /t 5 >nul
)
exit /b 0

:CHECK_AGI
if not exist "%AGIDIR%\codex-token.json" (
    call :LOG "[WARN] Codex未認証、認証開始..."
    cd /d "%AGIDIR%"
    node auto-login.mjs
)
exit /b 0

:START_SERVICES
call :LOG "[START] サービス起動確認"

REM Auto-Improve Engine
tasklist | findstr "node.exe" >nul
if %errorlevel% neq 0 (
    call :LOG "[START] Auto-Improve起動"
    start "AGI-Engine" /MIN cmd /c "cd /d %AGIDIR% && node auto-improve.mjs > %LOGDIR%\auto-improve.log 2>&1"
    timeout /t 3 >nul
)

REM Health Monitor
tasklist | findstr "monitor" >nul
if %errorlevel% neq 0 (
    call :LOG "[START] Health Monitor起動"
    start "HealthMonitor" /MIN cmd /c "cd /d %AGIDIR% && node monitor.mjs > %LOGDIR%\monitor.log 2>&1"
)
exit /b 0

:MONITOR_HEALTH
set duration=%~1
set elapsed=0
:HEALTH_LOOP
curl -s http://127.0.0.1:18789 >nul 2>&1
if %errorlevel% neq 0 (
    call :LOG "[ERROR] ヘルスチェック失敗、復旧処理"
    call :SELF_HEAL
)
timeout /t 10 >nul
set /a elapsed+=10
if !elapsed! lss !duration! goto :HEALTH_LOOP
exit /b 0

:SELF_HEAL
call :LOG "[HEAL] 自己修復実行"
taskkill /F /IM node.exe 2>nul
timeout /t 3 >nul
start "Gateway" /MIN cmd /c "cd /d %SCRIPTDIR% && node openclaw.mjs gateway --port 18789 --tailscale serve > gateway.log 2>&1"
timeout /t 5 >nul
exit /b 0

:LOG
set msg=%~1
set timestamp=%date% %time%
echo [!timestamp!] %msg%
echo [!timestamp!] %msg% >> "%MAINLOG%"
goto :eof
