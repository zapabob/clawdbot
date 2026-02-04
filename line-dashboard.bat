@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM OpenClaw + LINE 自動化ダッシュボード
REM ============================================

set SCRIPTDIR=%~dp0
set AGIDIR=%SCRIPTDIR%auto-improve

cls
echo ═══════════════════════════════════════════
echo      OpenClaw + LINE 自動化ダッシュボード
echo ═══════════════════════════════════════════
echo.

REM 1. Gateway状態
echo [1/6] Gateway状態
curl -s -o nul -w "       HTTP: %{http_code}\n" http://127.0.0.1:18789 2>nul
tasklist | findstr "node.exe" >nul && echo "       Node: ✅ 稼働中" || echo "       Node: ❌ 停止中"
echo.

REM 2. Tailscale状態
echo [2/6] Tailscale状態
tailscale status >nul 2>&1
if !errorlevel! equ 0 (
    echo "       Tailscale: ✅ 接続中"
    for /f "tokens=*" %%a in ('tailscale ip 2^>nul') do echo "       IP: %%a"
) else (
    echo "       Tailscale: ❌ 未接続"
)
echo.

REM 3. ngrok状態
echo [3/6] ngrok状態
netstat -an | findstr ":4040" >nul 2>&1
if !errorlevel! equ 0 (
    echo "       ngrok: ✅ 稼働中"
    powershell -Command "try { $resp = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 5; $url = $resp.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1 -ExpandProperty public_url; Write-Host \"       URL: $url\" } catch { Write-Host '       URL: 取得失敗' }" 2>nul
) else (
    echo "       ngrok: ⏳ 停止中"
)
echo.

REM 4. LINE設定
echo [4/6] LINE設定
if exist "%SCRIPTDIR%.env" (
    findstr /i "LINE_CHANNEL_ACCESS_TOKEN" "%SCRIPTDIR%.env" >nul
    if !errorlevel! equ 0 (
        echo "       Token: ✅ 設定済み"
    ) else (
        echo "       Token: ❌ 未設定"
    )
) else (
    echo "       .env: ❌ ファイルなし"
)
echo.

REM 5. Codex認証
echo [5/6] Codex認証
if exist "%AGIDIR%\codex-token.json" (
    echo "       Codex: ✅ 認証済み"
) else (
    echo "       Codex: ⏳ 未認証"
)
echo.

REM 6. ペアリング状態
echo [6/6] ペアリング状態
node openclaw.mjs pairing list line --json 2>nul | findstr "code" >nul
if !errorlevel! equ 0 (
    echo "       ペアリング: 🔔 リクエストあり！"
) else (
    echo "       ペアリング: ⏳ 待機中"
)
echo.

echo ═══════════════════════════════════════════
echo クイックアクション
echo ═══════════════════════════════════════════
echo.
echo  1) 全自動化起動        start-line-full.bat
echo  2) ペアリング監視      auto-pairing-monitor.bat
echo  3) ngrok URL取得       get-line-webhook.bat
echo  4) 健全性チェック      check-agi-health.bat
echo  5) ゲートウェイ再起動  controller.bat repair
echo  6) 全サービス停止      controller.bat stop
echo.
echo  7) LINEにテスト送信   (手動)
echo  8) ブラウザで開く      http://127.0.0.1:18789
echo.
echo  0) 終了
echo.
echo ═══════════════════════════════════════════

set /p CHOICE="選択 [0-8]: "

if "!CHOICE!"=="1" (
    start "" "%SCRIPTDIR%start-line-full.bat"
) else if "!CHOICE!"=="2" (
    start "" "%SCRIPTDIR%auto-pairing-monitor.bat"
) else if "!CHOICE!"=="3" (
    start "" "%SCRIPTDIR%get-line-webhook.bat"
) else if "!CHOICE!"=="4" (
    start "" "%SCRIPTDIR%check-agi-health.bat"
) else if "!CHOICE!"=="5" (
    cmd /c "%SCRIPTDIR%controller.bat repair"
) else if "!CHOICE!"=="6" (
    cmd /c "%SCRIPTDIR%controller.bat stop"
) else if "!CHOICE!"=="7" (
    echo LINEでボットにメッセージを送信してください
    pause
) else if "!CHOICE!"=="8" (
    start http://127.0.0.1:18789
) else if "!CHOICE!"=="0" (
    exit /b 0
)

echo.
echo 更新するには何かキーを押してください...
pause >nul
"%~f0"
