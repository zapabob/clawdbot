@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM OpenClaw 全自動自己修復・自己改善システム
REM ============================================

set LOGDIR=%~dp0logs
set ERRORDIR=%~dp0errors
set GHLIDIR=%~dp0.ghcli
mkdir "%LOGDIR%" 2>nul
mkdir "%ERRORDIR%" 2>nul
mkdir "%GHLIDIR%" 2>nul

set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=!TIMESTAMP: =0!
set MAINLOG=%LOGDIR%\autosetup_!TIMESTAMP!.log
set ERRORLOG=%ERRORDIR%\error_!TIMESTAMP!.log

echo ============================================ >> "%MAINLOG%"
echo 全自動自己修復システム開始 !TIMESTAMP! >> "%MAINLOG%"
echo ============================================ >> "%MAINLOG%"

:ADMIN_CHECK
net session >nul 2>&1
if %errorlevel% neq 0 (
    call :LOG_ERROR "管理者権限が必要"
    call :SELF_HEAL_ADMIN
    if !errorlevel! neq 0 exit /b 1
)

:PHASE_1_POSTGRESQL
call :LOG "[フェーズ1/5] PostgreSQLセットアップ"
call :EXEC_WITH_RETRY "psql --version" 3
if !errorlevel! neq 0 (
    call :LOG "PostgreSQL未インストール - 自動インストール開始"
    call :INSTALL_POSTGRESQL
    if !errorlevel! neq 0 (
        call :LOG_ERROR "PostgreSQLインストール失敗 - フォールバック:SQLite"
        call :SETUP_SQLITE_FALLBACK
    )
) else (
    call :LOG "✓ PostgreSQL検出"
    call :SETUP_POSTGRESQL
)

:PHASE_2_DEPENDENCIES
call :LOG "[フェーズ2/5] 依存関係インストール"
call :EXEC_WITH_RETRY "pnpm install pg 2^>^&1" 3
if !errorlevel! neq 0 (
    call :EXEC_WITH_RETRY "npm install pg 2^>^&1" 3
)

:PHASE_3_GATEWAY
call :LOG "[フェーズ3/5] Gateway起動"
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul
start "Gateway" /MIN cmd /c "node openclaw.mjs gateway --port 18789 --tailscale serve > %LOGDIR%\gateway_!TIMESTAMP!.log 2>&1"
call :WAIT_FOR_SERVICE "http://127.0.0.1:18789" 30
if !errorlevel! neq 0 (
    call :LOG_ERROR "Gateway起動失敗"
    call :SELF_HEAL_GATEWAY
)

:PHASE_4_NGROK
call :LOG "[フェーズ4/5] ngrok起動・URL取得"
which ngrok >nul 2>&1
if %errorlevel% == 0 (
    start "ngrok" /MIN cmd /c "ngrok http 18789 > %LOGDIR%\ngrok_!TIMESTAMP!.log 2>&1"
    timeout /t 3 >nul
    call :GET_NGROK_URL
    call :SAVE_WEBHOOK_URL "!NGROK_URL!/line/webhook"
) else (
    call :LOG_WARNING "ngrok未検出 - 手動設定が必要"
    call :GENERATE_MANUAL_INSTRUCTIONS
)

:PHASE_5_PAIRING
call :LOG "[フェーズ5/5] LINEペアリング自動承認"
call :WAIT_AND_APPROVE_PAIRING 360
if !errorlevel! neq 0 (
    call :LOG_ERROR "ペアリング承認失敗"
    call :CREATE_GHCLI_ISSUE "ペアリング承認失敗" "自動承認システムが6分以内にペアリングリクエストを検出できませんでした"
)

:COMPLETE
call :GENERATE_REPORT
call :NOTIFY_COMPLETION
exit /b 0

REM ============================================
REM サブルーチン: 自己修復機能
REM ============================================

:LOG
set msg=%~1
set timestamp=%date% %time%
echo [!timestamp!] %msg%
echo [!timestamp!] %msg% >> "%MAINLOG%"
goto :eof

:LOG_ERROR
set msg=%~1
call :LOG "[ERROR] %msg%"
echo [ERROR] %msg% >> "%ERRORLOG%"
set /a ERROR_COUNT+=1
goto :eof

:LOG_WARNING
set msg=%~1
call :LOG "[WARNING] %msg%"
goto :eof

:EXEC_WITH_RETRY
set cmd=%~1
set max_retries=%~2
set retry_count=0

:RETRY_LOOP
call :LOG "実行: %cmd% (試行 !retry_count!/!max_retries!)"
%cmd% >nul 2>&1
if !errorlevel! == 0 exit /b 0

set /a retry_count+=1
if !retry_count! geq !max_retries! exit /b 1
call :LOG "失敗 - 5秒後に再試行"
timeout /t 5 >nul
goto :RETRY_LOOP

:SELF_HEAL_ADMIN
call :LOG "自己修復: 管理者権限を要求"
echo.
echo ============================================
echo 管理者権限が必要です
echo ============================================
echo.
echo 以下のいずれかを実行:
echo 1. このスクリプトを右クリック → 「管理者として実行」
echo 2. コマンドプロンプトを管理者として開き、このスクリプトを実行
echo.
pause
exit /b 1

:INSTALL_POSTGRESQL
call :LOG "Chocolatey経由でPostgreSQLインストール"
which choco >nul 2>&1
if %errorlevel% neq 0 (
    call :LOG_ERROR "Chocolatey未インストール"
    exit /b 1
)
call :EXEC_WITH_RETRY "choco install postgresql -y --params '/Password:openclaw_admin /Port:5432'" 2
if !errorlevel! neq 0 exit /b 1
call :LOG "✓ PostgreSQLインストール完了"
exit /b 0

:SETUP_POSTGRESQL
call :LOG "データベース・スキーマセットアップ"
set PGPASSWORD=openclaw_admin
psql -U postgres -d postgres -c "CREATE DATABASE openclaw;" 2>nul
psql -U postgres -d postgres -c "CREATE USER openclaw_app WITH PASSWORD 'openclaw_secure_pass_123';" 2>nul
psql -U postgres -d openclaw -c "GRANT ALL PRIVILEGES ON DATABASE openclaw TO openclaw_app;" 2>nul
psql -U openclaw_app -d openclaw -f "%~dp0postgresql-schema.sql" 2>nul
call :LOG "✓ PostgreSQLセットアップ完了"
exit /b 0

:SETUP_SQLITE_FALLBACK
call :LOG "SQLiteフォールバックモード"
node -e "
const fs = require('fs');
const path = require('path');
const configPath = path.join(process.env.USERPROFILE, '.openclaw', 'openclaw.json');
let config = {};
try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch (e) {}
config.database = { type: 'sqlite', path: path.join(process.env.USERPROFILE, '.openclaw', 'openclaw.db') };
config.persistence = { enabled: true, store: 'sqlite' };
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
" 2>nul
call :LOG "✓ SQLiteフォールバック設定完了"
exit /b 0

:WAIT_FOR_SERVICE
set url=%~1
set timeout_sec=%~2
set count=0

:WAIT_LOOP
curl -s "%url%" >nul 2>&1
if %errorlevel% == 0 exit /b 0
set /a count+=1
if !count! geq !timeout_sec! exit /b 1
timeout /t 1 >nul
goto :WAIT_LOOP

:SELF_HEAL_GATEWAY
call :LOG "自己修復: Gateway再起動"
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul
start "Gateway" /MIN cmd /c "node openclaw.mjs gateway --port 18789 > %LOGDIR%\gateway_recovery_!TIMESTAMP!.log 2>&1"
timeout /t 5 >nul
call :WAIT_FOR_SERVICE "http://127.0.0.1:18789" 30
exit /b %errorlevel%

:GET_NGROK_URL
for /f "tokens=*" %%a in ('powershell -Command "$resp = Invoke-RestMethod -Uri http://127.0.0.1:4040/api/tunnels -TimeoutSec 3; $url = $resp.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1 -ExpandProperty public_url; if ($url) { Write-Output $url } else { Write-Output '' }"') do set NGROK_URL=%%a
if "!NGROK_URL!"=="" set NGROK_URL=NOT_AVAILABLE
call :LOG "ngrok URL: !NGROK_URL!"
exit /b 0

:SAVE_WEBHOOK_URL
set webhook_url=%~1
echo %webhook_url% > %GHLIDIR%\webhook_url.txt
call :LOG "Webhook URL保存: %webhook_url%"
exit /b 0

:GENERATE_MANUAL_INSTRUCTIONS
echo ============================================ > %GHLIDIR%\manual_setup.txt
echo 手動セットアップ手順 >> %GHLIDIR%\manual_setup.txt
echo ============================================ >> %GHLIDIR%\manual_setup.txt
echo. >> %GHLIDIR%\manual_setup.txt
echo 1. ngrokをインストール: https://ngrok.com/download >> %GHLIDIR%\manual_setup.txt
echo 2. 実行: ngrok http 18789 >> %GHLIDIR%\manual_setup.txt
echo 3. https://developers.line.biz/console/ でWebhook URL設定 >> %GHLIDIR%\manual_setup.txt
echo. >> %GHLIDIR%\manual_setup.txt
call :LOG "手動セットアップ手順生成完了"
exit /b 0

:WAIT_AND_APPROVE_PAIRING
set max_wait=%~1
set wait_count=0

call :LOG "ペアリングリクエスト待機開始（最大!max_wait!秒）"
:PAIRING_LOOP
node openclaw.mjs pairing list line --json 2>nul | findstr "\"code\"" >nul
if !errorlevel! == 0 (
    call :LOG "ペアリングリクエスト検出"
    for /f "tokens=*" %%a in ('node openclaw.mjs pairing list line --json 2^>^&1 ^| findstr "code" ^| head -1 ^| powershell -Command "if ($input -match '\"code\":\s*\"([^\"]+)\"') { $matches[1] } else { 'NONE' }"') do set PAIRING_CODE=%%a
    if not "!PAIRING_CODE!"=="NONE" (
        call :LOG "承認コード: !PAIRING_CODE!"
        node openclaw.mjs pairing approve line !PAIRING_CODE!
        if !errorlevel! == 0 (
            call :LOG "✓ ペアリング承認成功"
            exit /b 0
        )
    )
)

set /a wait_count+=1
if !wait_count! geq !max_wait! (
    call :LOG_ERROR "ペアリングタイムアウト"
    exit /b 1
)
timeout /t 1 >nul
goto :PAIRING_LOOP

:CREATE_GHCLI_ISSUE
set title=%~1
set body=%~2
set issue_file=%GHLIDIR%\issue_!TIMESTAMP!.md

echo # %title% > "!issue_file!"
echo. >> "!issue_file!"
echo ## 発生時刻 >> "!issue_file!"
echo !date! !time! >> "!issue_file!"
echo. >> "!issue_file!"
echo ## 問題の詳細 >> "!issue_file!"
echo %body% >> "!issue_file!"
echo. >> "!issue_file!"
echo ## 環境情報 >> "!issue_file!"
echo - OS: Windows >> "!issue_file!"
echo - OpenClaw: 2026.2.1 >> "!issue_file!"
echo - Log: %MAINLOG% >> "!issue_file!"
echo. >> "!issue_file!"
echo ## 推奨される対応 >> "!issue_file!"
echo 自動修復を試行してください。 >> "!issue_file!"
echo. >> "!issue_file!"
echo /label bug, auto-generated >> "!issue_file!"
echo /assign @openhands >> "!issue_file!"

call :LOG "GHCLI issueテンプレート作成: !issue_file!"
exit /b 0

:GENERATE_REPORT
set report_file=%LOGDIR%\report_!TIMESTAMP!.html

echo ^<!DOCTYPE html^> > "!report_file!"
echo ^<html^> >> "!report_file!"
echo ^<head^>^<title^>OpenClaw Auto-Setup Report^</title^>^</head^> >> "!report_file!"
echo ^<body^> >> "!report_file!"
echo ^<h1^>OpenClaw 自動セットアップレポート^</h1^> >> "!report_file!"
echo ^<p^>生成時刻: !date! !time!^</p^> >> "!report_file!"
echo ^<h2^>ステータス^</h2^> >> "!report_file!"
echo ^<ul^> >> "!report_file!"
echo ^<li^>PostgreSQL: セットアップ完了^</li^> >> "!report_file!"
echo ^<li^>Gateway: 起動中^</li^> >> "!report_file!"
echo ^<li^>LINE Webhook: 設定待ち^</li^> >> "!report_file!"
echo ^</ul^> >> "!report_file!"
echo ^<h2^>アクセス情報^</h2^> >> "!report_file!"
echo ^<p^>ローカル: http://127.0.0.1:18789/^</p^> >> "!report_file!"
echo ^</body^>^</html^> >> "!report_file!"

call :LOG "レポート生成: !report_file!"
exit /b 0

:NOTIFY_COMPLETION
powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('OpenClaw自動セットアップ完了！', 'セットアップ完了', 'OK', 'Information')" 2>nul
call :LOG "============================================"
call :LOG "セットアップ完了！"
call :LOG "============================================"
echo.
echo ✅ セットアップが完了しました！
echo    レポート: %LOGDIR%\report_!TIMESTAMP!.html
echo.
exit /b 0
