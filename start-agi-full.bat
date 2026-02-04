@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM OpenClaw AGI 完全自動化 + Tailscale 起動
REM ワンクリックで全システム起動・監視
REM ============================================

set SCRIPTDIR=%~dp0
set AGIDIR=%SCRIPTDIR%auto-improve
set LOGDIR=%SCRIPTDIR%logs
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=!TIMESTAMP: =0!

mkdir "%LOGDIR%" 2>nul

echo ============================================
echo  OpenClaw AGI + Tailscale 完全自動化
echo ============================================
echo 起動時刻: %date% %time%
echo.

REM ステップ1: Tailscale確認・接続
echo [1/5] Tailscale接続確認...
tailscale status >nul 2>&1
if %errorlevel% neq 0 (
    echo    ⚠️  Tailscale未接続、接続試行中...
    tailscale up
    timeout /t 3 >nul
)
tailscale status 2>nul | findstr ".ts.net" >nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%a in ('tailscale ip 2^nul') do set TAILSCALE_IP=%%a
    echo    ✅ Tailscale接続完了: !TAILSCALE_IP!
) else (
    echo    ⚠️  Tailscale接続確認中...
)
echo.

REM ステップ2: Gateway起動 (Tailscale serve)
echo [2/5] Gateway起動 (Tailscale serve)...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul
start "OpenClaw Gateway" /MIN cmd /c "cd /d %SCRIPTDIR% && node openclaw.mjs gateway --port 18789 --tailscale serve > gateway.log 2>&1"
echo    ⏳ 起動待機中...
timeout /t 5 >nul
curl -s http://127.0.0.1:18789 >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Gateway起動完了 (http://127.0.0.1:18789)
    if defined TAILSCALE_IP (
        echo    🌐 Tailscale: https://!TAILSCALE_IP!:18789
    )
) else (
    echo    ⚠️  Gateway応答なし、再試行中...
)
echo.

REM ステップ3: Codex認証確認
echo [3/5] Codex認証確認...
if exist "%AGIDIR%\codex-token.json" (
    echo    ✅ Codex認証済み
) else (
    echo    ⚠️  Codex未認証、認証を開始します...
    cd /d "%AGIDIR%"
    node auto-login.mjs
)
echo.

REM ステップ4: AGIエンジン起動
echo [4/5] AGIエンジン起動...
cd /d "%AGIDIR%"
start "AGI Auto-Improve" /MIN cmd /c "cd /d %AGIDIR% && node auto-improve.mjs > %LOGDIR%\auto-improve-!TIMESTAMP!.log 2>&1"
timeout /t 3 >nul
echo    ✅ AGIエンジン起動完了
echo.

REM ステップ5: ヘルスモニタ起動
echo [5/5] ヘルスモニタ起動...
start "Health Monitor" /MIN cmd /c "cd /d %AGIDIR% && node monitor.mjs > %LOGDIR%\monitor-!TIMESTAMP!.log 2>&1"
echo    ✅ ヘルスモニタ起動完了
echo.

REM 完了サマリー
echo ============================================
echo  ✅ 完全自動化起動完了！
echo ============================================
echo.
echo 📊 システム状態:
echo    Gateway:   http://127.0.0.1:18789
if defined TAILSCALE_IP (
    echo    Tailscale:  https://!TAILSCALE_IP!:18789
)
echo    TailscaleIP: !TAILSCALE_IP!
echo.
echo 📋 管理コマンド:
echo    ステータス確認: controller.bat status
echo    自己修復:       controller.bat repair
echo    改善PR生成:    controller.bat improve
echo    全停止:         controller.bat stop
echo.
echo 📁 ログ:
echo    Gateway:      gateway.log
echo    AGI:          logs\auto-improve-*.log
echo    モニタ:        logs\monitor-*.log
echo.
echo 💡 次のステップ:
echo    1. LINEでボットにメッセージを送信
echo    2. ペアリングコードが届く
echo    3. approve-pairing.bat で承認
echo.
pause
