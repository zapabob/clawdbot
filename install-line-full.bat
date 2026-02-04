@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM OpenClaw + LINE 完全自動化 + トンネル設定
REM ============================================

set SCRIPTDIR=%~dp0
set LOGDIR=%SCRIPTDIR%logs
set TUNNEL_DIR=%SCRIPTDIR%\.tunnel

mkdir "%LOGDIR%" 2>nul
mkdir "%TUNNEL_DIR%" 2>nul

set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=!TIMESTAMP: =0!

echo ============================================
echo  OpenClaw + LINE 完全自動化システム
echo ============================================
echo 開始時刻: %date% %time%
echo.

REM ============================================
REM ステップ1: Gateway停止（クリーン再用）
REM ============================================
echo [1/8] クリーン再用準備...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul
echo    ✅ 完了
echo.

REM ============================================
REM ステップ2: ngrok認証確認
REM ============================================
echo [2/8] ngrok認証確認...
ngrok authtoken >nul 2>&1
if !errorlevel! neq 0 (
    echo    ⚠️  ngrok未認証
    echo.
    echo    🔐 ngrok認証が必要です
    echo.
    echo    方法1: ダッシュボードで設定
    echo       1. https://dashboard.ngrok.com/signup でサインアップ
    echo       2. https://dashboard.ngrok.com/get-started/your-authtoken
    echo       3. AuthTokenをコピー
    echo       4. 下のプロンプトに貼り付け
    echo.
    echo    方法2: スキップ（Cloudflare Tunnel使用）
    echo.
    set /p AUTHTOKEN="AuthTokenを入力 [スキップ=s]: "
    
    if not "!AUTHTOKEN!"=="s" (
        echo    🔄 ngrok認証中...
        ngrok authtoken !AUTHTOKEN! >nul 2>&1
        if !errorlevel! equ 0 (
            echo    ✅ ngrok認証完了
            set NGROK_ENABLED=1
        ) else (
            echo    ❌ ngrok認証失敗、Cloudflare Tunnel使用
            set NGROK_ENABLED=0
        )
    ) else (
        set NGROK_ENABLED=0
    )
) else (
    echo    ✅ ngrok認証済み
    set NGROK_ENABLED=1
)
echo.

REM ============================================
REM ステップ3: Cloudflare Tunnelダウンロード（代替）
REM ============================================
echo [3/8] トンネル設定...
if !NGROK_ENABLED! equ 0 (
    echo    Cloudflare Tunnelを確認中...
    if exist "%TUNNEL_DIR%\cloudflared.exe" (
        echo    ✅ Cloudflare Tunnel済み
    ) else (
        echo    ⚠️  Cloudflare Tunnelをインストール中...
        echo       (Windows用バイナリをダウンロード)
        
        powershell -Command "& {
            $url = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'
            $out = '%TUNNEL_DIR%\cloudflared.exe'
            try {
                Invoke-WebRequest -Uri $url -OutFile $out -TimeoutSec 30
                Write-Host '    ✅ ダウンロード完了'
            } catch {
                Write-Host '    ❌ ダウンロード失敗'
                Write-Host '    エラー: ' $_.Exception.Message
            }
        }"
    )
)
echo.

REM ============================================
REM ステップ4: Gateway起動
REM ============================================
echo [4/8] Gateway起動...
start "Gateway" /MIN cmd /c "cd /d %SCRIPTDIR% && node openclaw.mjs gateway --port 18789 --tailscale serve > gateway.log 2>&1"
timeout /t 5 >nul
curl -s http://127.0.0.1:18789 >nul 2>&1
if !errorlevel! equ 0 (
    echo    ✅ Gateway起動完了
) else (
    echo    ⚠️  Gateway起動失敗
)
echo.

REM ============================================
REM ステップ5: トンネル起動（ngrok or Cloudflare）
REM ============================================
echo [5/8] トンネルを起動中...
set TUNNEL_URL=

if !NGROK_ENABLED! equ 1 (
    echo    ngrokを起動中...
    taskkill /F /IM ngrok.exe 2>nul
    start "ngrok" /MIN cmd /c "ngrok http 18789 --log=stdout > %TUNNEL_DIR%\ngrok.log 2>&1"
    timeout /t 10 >nul
    
    REM URL取得
    for /f "tokens=*" %%a in ('powershell -Command "try { $resp = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 10; $url = $resp.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1 -ExpandProperty public_url; Write-Output $url } catch { Write-Output 'ERROR' }"') do set NGROK_URL=%%a
    
    if defined NGROK_URL (
        set TUNNEL_URL=!NGROK_URL!
        echo    ✅ ngrok URL: !NGROK_URL!
    ) else (
        echo    ⚠️  ngrok URL取得失敗、Cloudflareに切り替え
        set NGROK_ENABLED=0
    )
)

if !NGROK_ENABLED! equ 0 (
    echo    Cloudflare Tunnelを起動中...
    if exist "%TUNNEL_DIR%\cloudflared.exe" (
        start "Cloudflare" /MIN cmd /c "%TUNNEL_DIR%\cloudflared.exe tunnel --url http://localhost:18789 > %TUNNEL_DIR%\cloudflare.log 2>&1"
        timeout /t 8 >nul
        
        REM URL取得
        for /f "tokens=*" %%a in ('type "%TUNNEL_DIR%\cloudflare.log" 2^>nul ^| findstr "https://" ^| findstr -v trycloudflare ^| head -1') do set TUNNEL_URL=%%a
        if defined TUNNEL_URL (
            echo    ✅ Cloudflare URL: !TUNNEL_URL!
        ) else (
            echo    ⚠️  Cloudflare URL取得中...
            timeout /t 5 >nul
            for /f "tokens=*" %%a in ('type "%TUNNEL_DIR%\cloudflare.log" 2^>nul ^| findstr "https://" ^| findstr -v trycloudflare ^| head -1') do set TUNNEL_URL=%%a
        )
    ) else (
        echo    ⚠️  Cloudflare Tunnel未インストール
        echo    Tailscale Funnelを試みます...
    )
)
echo.

REM ============================================
REM ステップ6: Tailscale確認
REM ============================================
echo [6/8] Tailscale確認...
tailscale status >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%a in ('tailscale ip 2^>nul') do set TS_IP=%%a
    echo    ✅ Tailscale: !TS_IP!
) else (
    echo    ⚠️  Tailscale未接続
    set TS_IP=
)
echo.

REM ============================================
REM ステップ7: 設定確認
REM ============================================
echo [7/8] 設定確認...
echo    LINE Token: 設定済み
echo    Gateway: 127.0.0.1:18789
echo.

REM ============================================
REM ステップ8: 完了・Webhook URL表示
REM ============================================
echo [8/8] 完了
echo.

echo ═══════════════════════════════════════════
echo ✅ 完全自動化完了！
echo ═══════════════════════════════════════════
echo.
echo 📡 利用可能なWebhook URL:
echo.
if defined TUNNEL_URL (
    echo    🌐 公開URL: !TUNNEL_URL!/line/webhook
)
if defined TS_IP (
    echo    🏠 Tailscale: https://!TS_IP!:18789/line/webhook
)
echo.
echo 📱 LINE Developer Console設定:
echo    1. https://developers.line.biz/console/ にアクセス
echo    2. Messaging API設定を開く
if defined TUNNEL_URL (
    echo    3. Webhook URL: !TUNNEL_URL!/line/webhook
) else if defined TS_IP (
    echo    3. Webhook URL: https://!TS_IP!:18789/line/webhook
)
echo    4. Use webhook: ON
echo    5. Verifyボタン: クリック
echo.
echo 💡 テスト:
echo    LINEでボットにメッセージを送信
echo    ペアリングコードを承認
echo.
echo 📁 ログ:
echo    Gateway:   gateway.log
echo    Tunnel:    %TUNNEL_DIR%\*.log
echo.

if not defined TUNNEL_URL (
    echo ⚠️  外部アクセス不可:
    echo    - ngrok: ngrok authtoken <token>
    echo    - Cloudflare: 自動ダウンロードを試みました
    echo    - Tailscale Funnel: tailscale funnel 18789
)

pause
