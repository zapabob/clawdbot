@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM OpenClaw 統合コントローラー
REM 全自動・自己修復・自己改善システム
REM ============================================

set SCRIPTDIR=%~dp0
set LOGDIR=%SCRIPTDIR%logs
set ERRORDIR=%SCRIPTDIR%errors
set GHLIDIR=%SCRIPTDIR%.ghcli
set PIDDIR=%SCRIPTDIR%.pids

mkdir "%LOGDIR%" 2>nul
mkdir "%ERRORDIR%" 2>nul
mkdir "%GHLIDIR%" 2>nul
mkdir "%PIDDIR%" 2>nul

set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=!TIMESTAMP: =0!
set MAINLOG=%LOGDIR%\controller_!TIMESTAMP!.log

echo ============================================ >> "%MAINLOG%"
echo 統合コントローラー起動 !TIMESTAMP! >> "%MAINLOG%"
echo ============================================ >> "%MAINLOG%"

REM ============================================
REM 引数解析
REM ============================================
set MODE=%~1
if "!MODE!"=="" set MODE=auto

call :LOG "モード: !MODE!"

REM ============================================
REM メイン実行フロー
REM ============================================
goto :MAIN_!MODE!

:MAIN_auto
call :LOG "=== 全自動実行モード ==="
call :PHASE_PRECHECK
call :PHASE_INIT
call :PHASE_SETUP
call :PHASE_START
call :PHASE_MONITOR
goto :END

:MAIN_repair
call :LOG "=== 修復モード ==="
call :SELF_HEAL_FULL
goto :END

:MAIN_improve
call :LOG "=== 改善モード ==="
call :GENERATE_IMPROVEMENT_PR
goto :END

:MAIN_stop
call :LOG "=== 停止モード ==="
call :STOP_ALL_SERVICES
goto :END

:MAIN_status
call :LOG "=== ステータス確認 ==="
call :SHOW_STATUS
goto :END

REM ============================================
REM フェーズ定義
REM ============================================

:PHASE_PRECHECK
call :LOG "[フェーズ0] 事前チェック"
call :CHECK_ADMIN
if !errorlevel! neq 0 exit /b 1
call :CHECK_DEPENDENCIES
call :CHECK_DISK_SPACE
call :CHECK_NETWORK
call :LOG "✓ 事前チェック完了"
exit /b 0

:PHASE_INIT
call :LOG "[フェーズ1] 初期化"
call :CLEANUP_OLD_PROCESSES
call :INIT_LOGGING
call :INIT_DATABASE_CONNECTION
call :LOG "✓ 初期化完了"
exit /b 0

:PHASE_SETUP
call :LOG "[フェーズ2] セットアップ"
call :EXEC_WITH_MONITORING "postgresql-setup" "setup-postgresql.bat" 300
if !errorlevel! neq 0 (
    call :LOG_ERROR "PostgreSQLセットアップ失敗"
    call :SELF_HEAL_POSTGRESQL
)
call :EXEC_WITH_MONITORING "dependencies" "pnpm install pg" 120
if !errorlevel! neq 0 (
    call :EXEC_WITH_MONITORING "dependencies-npm" "npm install pg" 120
)
call :LOG "✓ セットアップ完了"
exit /b 0

:PHASE_START
call :LOG "[フェーズ3] サービス起動"

REM Gateway起動
call :START_SERVICE "gateway" "node openclaw.mjs gateway --port 18789 --tailscale serve"
timeout /t 5 >nul
call :VERIFY_SERVICE "http://127.0.0.1:18789" 30
if !errorlevel! neq 0 (
    call :LOG_ERROR "Gateway起動失敗"
    call :SELF_HEAL_GATEWAY
)

REM ngrok起動
which ngrok >nul 2>&1
if !errorlevel! == 0 (
    call :START_SERVICE "ngrok" "ngrok http 18789"
    timeout /t 3 >nul
    call :GET_NGROK_URL
    if "!NGROK_URL!"=="NOT_AVAILABLE" (
        call :LOG_WARNING "ngrok URL取得失敗"
    ) else (
        echo !NGROK_URL!/line/webhook > "%GHLIDIR%\webhook_url.txt"
        call :LOG "Webhook URL: !NGROK_URL!/line/webhook"
    )
)

call :LOG "✓ サービス起動完了"
exit /b 0

:PHASE_MONITOR
call :LOG "[フェーズ4] 監視・ペアリング"
call :WAIT_AND_APPROVE_PAIRING 360
call :LOG "✓ 監視完了"
exit /b 0

REM ============================================
REM サブルーチン: チェック機能
REM ============================================

:CHECK_ADMIN
net session >nul 2>&1
if %errorlevel% neq 0 (
    call :LOG_ERROR "管理者権限が必要"
    powershell -Command "Start-Process '%~f0' -ArgumentList '%*' -Verb RunAs"
    exit /b 1
)
exit /b 0

:CHECK_DEPENDENCIES
call :LOG "依存関係チェック"
which node >nul 2>&1 || (call :LOG_ERROR "Node.js未インストール" & exit /b 1)
which pnpm >nul 2>&1 || call :LOG_WARNING "pnpm未検出"
which git >nul 2>&1 || call :LOG_WARNING "Git未検出"
which gh >nul 2>&1 || call :LOG_WARNING "GitHub CLI未検出"
exit /b 0

:CHECK_DISK_SPACE
for /f "tokens=3" %%a in ('dir %SystemDrive% ^| findstr "バイト空き"') do set FREE_SPACE=%%a
set FREE_SPACE=!FREE_SPACE:,=!
if !FREE_SPACE! lss 1073741824 (
    call :LOG_WARNING "ディスク容量不足 (1GB未満)"
)
exit /b 0

:CHECK_NETWORK
ping -n 1 -w 3000 google.com >nul 2>&1
if %errorlevel% neq 0 (
    call :LOG_WARNING "インターネット接続不安定"
)
exit /b 0

REM ============================================
REM サブルーチン: 監視・修復機能
REM ============================================

:EXEC_WITH_MONITORING
set name=%~1
set cmd=%~2
set timeout_sec=%~3
set logfile=%LOGDIR%\!name!_!TIMESTAMP!.log

call :LOG "実行: !name! (timeout: !timeout_sec!s)"
start /B /MIN cmd /c "!cmd! > !logfile! 2>&1"
set PID=!ERRORLEVEL!
echo !PID! > "%PIDDIR%\!name!.pid"

timeout /t !timeout_sec! >nul
if not exist "%PIDDIR%\!name!.success" (
    call :LOG_ERROR "!name! タイムアウトまたは失敗"
    exit /b 1
)
exit /b 0

:VERIFY_SERVICE
set url=%~1
set timeout_sec=%~2
set count=0

:VERIFY_LOOP
curl -s "!url!" >nul 2>&1
if !errorlevel! == 0 (
    echo SUCCESS > "%PIDDIR%\gateway.success"
    exit /b 0
)
set /a count+=1
if !count! geq !timeout_sec! exit /b 1
timeout /t 1 >nul
goto :VERIFY_LOOP

:SELF_HEAL_FULL
call :LOG "自己修復: フル修復モード"
call :STOP_ALL_SERVICES
timeout /t 2 >nul
call :CLEANUP_TEMP_FILES
call :RESET_DATABASE_CONNECTION
call :LOG "再起動を試行"
call :PHASE_START
call :PHASE_MONITOR
exit /b %errorlevel%

:SELF_HEAL_POSTGRESQL
call :LOG "自己修復: PostgreSQL"
net stop postgresql-x64-16 2>nul
timeout /t 2 >nul
net start postgresql-x64-16 2>nul
timeout /t 5 >nul
psql -U postgres -d postgres -c "SELECT 1" >nul 2>&1
if !errorlevel! neq 0 (
    call :LOG_ERROR "PostgreSQL修復失敗 - SQLiteフォールバック"
    call :SETUP_SQLITE_FALLBACK
)
exit /b 0

:SELF_HEAL_GATEWAY
call :LOG "自己修復: Gateway"
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul
start /MIN cmd /c "node openclaw.mjs gateway --port 18789"
timeout /t 5 >nul
call :VERIFY_SERVICE "http://127.0.0.1:18789" 30
exit /b %errorlevel%

REM ============================================
REM サブルーチン: ユーティリティ
REM ============================================

:LOG
set msg=%~1
set timestamp=%date% %time%
echo [!timestamp!] %msg%
echo [!timestamp!] %msg% >> "%MAINLOG%"
goto :eof

:LOG_ERROR
call :LOG "[ERROR] %~1"
echo [ERROR] %~1 >> "%ERRORLOG%"
goto :eof

:LOG_WARNING
call :LOG "[WARN] %~1"
goto :eof

:STOP_ALL_SERVICES
call :LOG "全サービス停止"
taskkill /F /IM node.exe 2>nul
taskkill /F /IM ngrok.exe 2>nul
net stop postgresql-x64-16 2>nul
exit /b 0

:SHOW_STATUS
call :LOG "=== ステータス ==="
echo サービス状態:
sc query postgresql-x64-16 2>nul | findstr "STATE"
tasklist | findstr "node.exe" && echo Gateway: 実行中 || echo Gateway: 停止
tasklist | findstr "ngrok.exe" && echo ngrok: 実行中 || echo ngrok: 停止
curl -s http://127.0.0.1:18789 >nul 2>&1 && echo Gateway応答: OK || echo Gateway応答: NG
exit /b 0

:END
call :LOG "=== 統合コントローラー終了 ==="
exit /b 0
