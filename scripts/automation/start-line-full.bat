@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM OpenClaw + LINE 全自動化システム
REM ============================================

set SCRIPTDIR=%~dp0
set LOGDIR=%SCRIPTDIR%logs
set AGIDIR=%SCRIPTDIR%auto-improve

mkdir "%LOGDIR%" 2>nul

echo ============================================
echo  OpenClaw + LINE 全自動化システム
echo ============================================
echo 開始時刻: %date% %time%
echo.

REM ============================================
REM ステップ1: 環境ロード
REM ============================================
echo [1/7] 環境変数ロード中...
if exist "%SCRIPTDIR%.env" (
    for /f "tokens=*" %%a in (%SCRIPTDIR%.env) do (
        set "line=%%a"
        if not "!line:~0,1!"=="#" (
            for /f "tokens=1,2 delims==" %%b in ("!line!") do set "%%b=%%c"
        )
    )
    echo    ✅ .envロード完了
) else (
    echo    ⚠️  .envが見つかりません
)
echo.

REM ============================================
REM ステップ2: Tailscale確認
REM ============================================
echo [2/7] Tailscale接続確認...
tailscale status >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%a in ('tailscale ip 2^>nul') do set TS_IP=%%a
    echo    ✅ Tailscale接続済み: !TS_IP!
) else (
    echo    ⚠️  Tailscale未接続、接続試行中...
    tailscale up
    timeout /t 3 >nul
    for /f "tokens=*" %%a in ('tailscale ip 2^>nul') do set TS_IP=%%a
)
echo.

REM ============================================
REM ステップ3: Gateway起動
REM ============================================
echo [3/7] Gateway起動確認...
tasklist | findstr "node.exe" >nul
if !errorlevel! equ 0 (
    echo    ✅ Gateway既に稼働中
) else (
    echo    ⚠️  Gateway起動中...
    start "Gateway" /MIN cmd /c "cd /d %SCRIPTDIR% && node openclaw.mjs gateway --port 18789 --tailscale serve > gateway.log 2>&1"
    timeout /t 5 >nul
    echo    ✅ Gateway起動完了
)
echo.

REM ============================================
REM ステップ4: ngrok起動（Webhook用）
REM ============================================
echo [4/7] ngrok起動確認...
netstat -an | findstr ":4040" >nul 2>&1
if !errorlevel! equ 0 (
    echo    ✅ ngrok既に稼働中
) else (
    echo    ⚠️  ngrok起動中...
    start "ngrok" /MIN cmd /c "ngrok http 18789 --log=stdout > ngrok.log 2>&1"
    timeout /t 8 >nul
    echo    ✅ ngrok起動完了
)

REM ngrok URL取得
powershell -Command "try { $resp = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 10; $url = $resp.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1 -ExpandProperty public_url; Write-Output $url } catch { Write-Output 'ERROR' }" > ngrok_url.txt
set /p NGROK_URL=<ngrok_url.txt
if not "!NGROK_URL!"=="ERROR" (
    echo    🌐 ngrok URL: !NGROK_URL!
)
echo.

REM ============================================
REM ステップ5: LINEペアリング自動承認
REM ============================================
echo [5/7] LINEペアリング確認...
node openclaw.mjs pairing list line --json 2>nul | findstr "code" >nul
if !errorlevel! equ 0 (
    echo    ⚠️  ペアリングリクエスト検出！
    
    for /f "tokens=*" %%a in ('node openclaw.mjs pairing list line --json 2^>nul ^| powershell -Command "$json = $input | Out-String | ConvertFrom-Json; if ($json.requests.Count -gt 0) { Write-Output $json.requests[0].code } else { Write-Output 'NONE' }"') do set CODE=%%a
    
    if not "!CODE!"=="NONE" (
        echo    📝 コード: !CODE!
        echo    🔄 承認中...
        node openclaw.mjs pairing approve line !CODE!
        if !errorlevel! equ 0 (
            echo    ✅ 承認成功！
        ) else (
            echo    ⚠️  承認失敗（既に承認済みか無効なコード）
        )
    )
) else (
    echo    ⏳ ペアリングリクエストなし
    echo       LINEでボットにメッセージを送信してください
)
echo.

REM ============================================
REM ステップ6: Webhook健全性確認
REM ============================================
echo [6/7] Webhook健全性確認...
curl -s -o nul -w "    HTTP応答コード: %{http_code}\n" http://127.0.0.1:18789/line/webhook 2>nul
echo.

REM ============================================
REM ステップ7: 監視プロセス起動
REM ============================================
echo [7/7] 監視プロセス起動...
start "LINE-Auto-Monitor" /MIN cmd /c "cd /d %SCRIPTDIR% && line-auto-system.bat > logs\line-monitor.log 2>&1"
echo    ✅ 監視プロセス起動
echo.

REM ============================================
REM 完了サマリー
REM ============================================
echo ============================================
echo  ✅ 全自動化完了！
echo ============================================
echo.
echo 📊 システム状態:
echo    Gateway:      http://127.0.0.1:18789
if defined TS_IP (
    echo    Tailscale:     https://!TS_IP!:18789
)
if defined NGROK_URL (
    echo    ngrok:         !NGROK_URL!
)
echo.
echo 📱 Webhook URLs:
echo    Tailscale:  https://!TS_IP!:18789/line/webhook
if defined NGROK_URL (
    echo    ngrok:      !NGROK_URL!/line/webhook
)
echo.
echo 📋 次のステップ:
echo    1. LINEでボットにメッセージを送信
echo    2. ペアリングコードが届く
echo    3. 自動的に承認されます
echo.
echo 📁 ログ:
echo    Gateway:      gateway.log
echo    ngrok:        ngrok.log
echo    監視:          logs\line-monitor.log
echo.
echo 🔧 管理:
echo    停止:          controller.bat stop
echo    再起動:        start-agi-full.bat
echo    健全性確認:    check-agi-health.bat
echo.

pause
