@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM OpenClaw + LINE + Tailscale 全自動化システム
REM ============================================

set SCRIPTDIR=%~dp0
set LOGDIR=%SCRIPTDIR%logs
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=!TIMESTAMP: =0!

mkdir "%LOGDIR%" 2>nul

echo ============================================
echo  OpenClaw + LINE + Tailscale 全自動化
echo ============================================
echo 開始時刻: %date% %time%
echo.

REM ============================================
REM ステップ1: 既存プロセス清理
REM ============================================
echo [1/6] クリーン再用準備...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul
echo    ✅ 完了
echo.

REM ============================================
REM ステップ2: Tailscale接続
REM ============================================
echo [2/6] Tailscale接続確認...
tailscale status >nul 2>&1
if !errorlevel! equ 0 (
    echo    ✅ Tailscale接続済み
) else (
    echo    ⚠️  Tailscale未接続、接続試行中...
    tailscale up
    timeout /t 5 >nul
)

REM Tailscale IP取得
set TS_IP=
for /f "tokens=*" %%a in ('tailscale ip 2^>nul') do set TS_IP=%%a
if defined TS_IP (
    echo    IP: !TS_IP!
) else (
    echo    ⚠️  IP取得失敗
)
echo.

REM ============================================
REM ステップ3: Gateway起動
REM ============================================
echo [3/6] Gateway起動...
start "Gateway" /MIN cmd /c "cd /d %SCRIPTDIR% && node openclaw.mjs gateway --port 18789 --tailscale serve > gateway.log 2>&1"
timeout /t 5 >nul

REM 起動確認
curl -s http://127.0.0.1:18789 >nul 2>&1
if !errorlevel! equ 0 (
    echo    ✅ Gateway起動完了
) else (
    echo    ⚠️  Gateway応答なし
)
echo.

REM ============================================
REM ステップ4: Tailscale Funnel設定
REM ============================================
echo [4/6] Tailscale Funnel設定...
echo    (Webhookを外部に公開)
tailscale funnel 18789 >nul 2>&1
timeout /t 3 >nul
echo    ✅ Funnel設定完了
echo.

REM ============================================
REM ステップ5: ペアリング監視起動
REM ============================================
echo [5/6] ペアリング自動承認システムを起動中...
start "PairingAuto" /MIN cmd /c "cd /d %SCRIPTDIR% && (
    echo [PAIRING] ペアリング監視開始
    :PAIRING_LOOP
    node openclaw.mjs pairing list line --json 2^>nul ^| findstr \"code\" >nul
    if !errorlevel! equ 0 (
        echo [PAIRING] ペアリング検出、承認中...
        for /f \"tokens=*\" %%a in ('node openclaw.mjs pairing list line --json 2^>nul ^| powershell -Command \"\$json = \$input ^| Out-String ^| ConvertFrom-Json; if (\$json.requests.Count -gt 0) { Write-Output \$json.requests[0].code } else { Write-Output 'NONE' }\"') do set CODE=%%a
        if not \"!CODE!\"==\"NONE\" (
            node openclaw.mjs pairing approve line !CODE!
        )
    )
    timeout /t 30 /nobreak >nul
    goto PAIRING_LOOP
) > logs\pairing-auto.log 2>&1"
echo    ✅ ペアリング監視起動
echo.

REM ============================================
REM ステップ6: 監視ループ起動
REM ============================================
echo [6/6] 監視システムを起動中...
start "AutoMonitor" /MIN cmd /c "cd /d %SCRIPTDIR% && tailscale-auto-loop.bat > logs\monitor-loop.log 2>&1"
echo    ✅ 監視システム起動
echo.

REM ============================================
REM 完了サマリー
REM ============================================
echo ═══════════════════════════════════════════
echo ✅ 全自動化完了！
echo ═══════════════════════════════════════════
echo.
echo 📡 利用可能なURL:
echo.
if defined TS_IP (
    echo    🏠 Tailscale:  https://!TS_IP!:18789
    echo    📱 Webhook:    https://!TS_IP!:18789/line/webhook
)
echo.
echo 📱 LINE Developer Console設定:
echo    1. https://developers.line.biz/console/ にアクセス
echo    2. Messaging API設定を開く
if defined TS_IP (
    echo    3. Webhook URL: https://!TS_IP!:18789/line/webhook
)
echo    4. Use webhook: ON
echo    5. Verifyをクリック
echo.
echo 💬 テスト:
echo    LINEでボットにメッセージを送信
echo    ペアリングコードが自動承認されます
echo.
echo 📁 ログ:
echo    Gateway:      gateway.log
echo    監視:          logs\*.log
echo.
echo 🔧 管理:
echo    停止:          taskkill /F /IM node.exe
echo    再起動:        start-tailscale-full.bat
echo.
echo ⏳ システムはバックグラウンドで実行中です
echo.
pause
