@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM OpenClaw + LINE + Tailscale 完全自動化システム
REM 常時監視・自動復旧・バックグラウンド実行
REM ============================================

set SCRIPTDIR=%~dp0
set LOGDIR=%SCRIPTDIR%logs
set PIDDIR=%SCRIPTDIR%\.pids

mkdir "%LOGDIR%" 2>nul
mkdir "%PIDDIR%" 2>nul

set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=!TIMESTAMP: =0!
set MAINLOG=%LOGDIR%\tailscale-auto-!TIMESTAMP!.log

echo ============================================ >> "%MAINLOG%"
echo OpenClaw+Tailscale完全自動化システム起動 >> "%MAINLOG%"
echo ============================================ >> "%MAINLOG%"

:MAIN_LOOP
call :LOG "[LOOP] 自動化サイクル開始 - %date% %time%"

REM 1. Tailscale接続確認
call :CHECK_TAILSCALE
if !errorlevel! neq 0 (
    call :LOG "[ERROR] Tailscale再接続"
    tailscale up >> "%MAINLOG%" 2>&1
    timeout /t 5 >nul
)

REM 2. Gateway稼働確認
call :CHECK_GATEWAY
if !errorlevel! neq 0 (
    call :LOG "[WARN] Gateway再起動"
    call :RESTART_GATEWAY
)

REM 3. Tailscale Funnel設定
call :CHECK_FUNNEL

REM 4. ペアリング自動承認
call :AUTO_APPROVE_PAIRING

REM 5. ログ出力
call :LOG "[STATUS] Gateway応答: OK"
call :LOG "[STATUS] Tailscale IP: %TS_IP%"

REM 待機（5分）
call :LOG "[LOOP] 次回まで5分待機..."
timeout /t 300 /nobreak >nul
goto :MAIN_LOOP

:CHECK_TAILSCALE
tailscale status >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%a in ('tailscale ip 2^>nul') do set TS_IP=%%a
    exit /b 0
) else (
    exit /b 1
)

:CHECK_GATEWAY
curl -s http://127.0.0.1:18789 >nul 2>&1
exit /b !errorlevel!

:RESTART_GATEWAY
taskkill /F /IM node.exe 2>nul
timeout /t 3 >nul
start "Gateway" /MIN cmd /c "cd /d %SCRIPTDIR% && node openclaw.mjs gateway --port 18789 --tailscale serve >> gateway.log 2>&1"
timeout /t 5 >nul
exit /b 0

:CHECK_FUNNEL
REM Funnel状態確認
tailscale funnel status >nul 2>&1
if !errorlevel! neq 0 (
    call :LOG "[INFO] Funnel設定中..."
    tailscale funnel 18789 >> "%MAINLOG%" 2>&1
    timeout /t 3 >nul
)
exit /b 0

:AUTO_APPROVE_PAIRING
node openclaw.mjs pairing list line --json 2>nul | findstr "code" >nul
if !errorlevel! equ 0 (
    call :LOG "[PAIRING] ペアリング検出"
    
    REM 最新コード取得
    for /f "tokens=*" %%a in ('node openclaw.mjs pairing list line --json 2^>nul ^| powershell -Command "$json = $input | Out-String | ConvertFrom-Json; if ($json.requests.Count -gt 0) { Write-Output $json.requests[0].code } else { Write-Output 'NONE' }"') do set CODE=%%a
    
    if not "!CODE!"=="NONE" (
        call :LOG "[PAIRING] !CODE! を承認"
        node openclaw.mjs pairing approve line !CODE! >> "%MAINLOG%" 2>&1
        if !errorlevel! equ 0 (
            call :LOG "[PAIRING] 承認成功！"
        )
    )
)
exit /b 0

:LOG
set msg=%~1
set timestamp=%date% %time%
echo [!timestamp!] %msg%
echo [!timestamp!] %msg% >> "%MAINLOG%"
goto :eof
