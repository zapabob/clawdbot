@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM LINE 双方向通信 完全自動化システム
REM ============================================

set SCRIPTDIR=%~dp0
set LOGDIR=%SCRIPTDIR%logs
set AGIDIR=%SCRIPTDIR%auto-improve

mkdir "%LOGDIR%" 2>nul

set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=!TIMESTAMP: =0!
set MAINLOG=%LOGDIR%\line-auto-!TIMESTAMP!.log

echo ============================================ >> "%MAINLOG%"
echo LINE完全自動化システム起動 >> "%MAINLOG%"
echo ============================================ >> "%MAINLOG%"

:MAIN_LOOP
call :LOG "[LOOP] 自動化サイクル開始"

REM 1. Gateway稼働確認
call :CHECK_GATEWAY
if !errorlevel! neq 0 (
    call :LOG "[ERROR] Gateway復旧中..."
    call :RESTART_GATEWAY
)

REM 2. Tailscale確認
call :CHECK_TAILSCALE

REM 3. ngrok起動（必要時）
call :CHECK_NGROK

REM 4. LINEペアリング自動承認
call :AUTO_APPROVE_PAIRING

REM 5. Webhook健全性確認
call :CHECK_WEBHOOK_HEALTH

REM 待機
call :LOG "[LOOP] 次回チェックまで60秒待機..."
timeout /t 60 /nobreak >nul
goto :MAIN_LOOP

:CHECK_GATEWAY
curl -s http://127.0.0.1:18789 >nul 2>&1
exit /b !errorlevel!

:RESTART_GATEWAY
taskkill /F /IM node.exe 2>nul
timeout /t 3 >nul
start "Gateway" /MIN cmd /c "cd /d %SCRIPTDIR% && node openclaw.mjs gateway --port 18789 --tailscale serve > gateway.log 2>&1"
timeout /t 5 >nul
exit /b 0

:CHECK_TAILSCALE
tailscale status >nul 2>&1
if !errorlevel! neq 0 (
    call :LOG "[WARN] Tailscale再接続..."
    tailscale up
)
exit /b 0

:CHECK_NGROK
netstat -an | findstr ":4040" >nul 2>&1
if !errorlevel! neq 0 (
    call :LOG "[INFO] ngrok起動..."
    start "ngrok" /MIN cmd /c "ngrok http 18789 --log=stdout > ngrok.log 2>&1"
    timeout /t 8 >nul
)
exit /b 0

:AUTO_APPROVE_PAIRING
call :LOG "[PAIRING] ペアリング確認中..."
node openclaw.mjs pairing list line --json 2>nul | findstr "code" >nul
if !errorlevel! equ 0 (
    call :LOG "[PAIRING] ペアリング検出、承認試行..."
    
    REM 最新コード取得
    for /f "tokens=*" %%a in ('node openclaw.mjs pairing list line --json 2^>nul ^| powershell -Command "$json = $input | Out-String | ConvertFrom-Json; if ($json.requests.Count -gt 0) { Write-Output $json.requests[0].code } else { Write-Output 'NONE' }"') do set CODE=%%a
    
    if not "!CODE!"=="NONE" (
        call :LOG "[PAIRING] コード !CODE! を承認..."
        node openclaw.mjs pairing approve line !CODE!
        if !errorlevel! equ 0 (
            call :LOG "[PAIRING] ✅ 承認成功！"
        ) else (
            call :LOG "[PAIRING] ⚠️ 承認失敗"
        )
    )
)
exit /b 0

:CHECK_WEBHOOK_HEALTH
curl -s -o nul -w "%{http_code}" http://127.0.0.1:18789/line/webhook >nul 2>&1
if !errorlevel! neq 0 (
    call :LOG "[WARN] Webhook応答なし"
)
exit /b 0

:LOG
set msg=%~1
set timestamp=%date% %time%
echo [!timestamp!] %msg%
echo [!timestamp!] %msg% >> "%MAINLOG%"
goto :eof
