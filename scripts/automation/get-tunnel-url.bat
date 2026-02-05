@echo off
chcp 65001 >nul

REM ============================================
REM LINE Webhook 用 公開URL自動取得
REM ============================================

echo ============================================
echo LINE Webhook 公開URL取得
echo ============================================
echo.
echo ⚠️  Tailscale IPはLINEサーバーからアクセスできません
echo    公開URLが必要です
echo.
echo [方法1] localtunnel（推奨・無料）
echo    実行中...
echo.

REM localtunnel起動
start "LocalTunnel" /MIN cmd /c "npx --yes localtunnel --port 18789 > tunnel-url.txt 2>&1"

echo ⏳ 60秒待機中（URLが表示されるまでお待ちください）...
echo.
echo ※ 別ウィンドウで「Your url is: https://xxxxx.loca.lt」が表示されます
echo.

timeout /t 60 /nobreak >nul

echo.
echo 📋 結果確認...
echo.

type tunnel-url.txt 2>nul | findstr "loca.lt" >nul
if !errorlevel! equ 0 (
    echo.
    echo ═══════════════════════════════════════════
    echo ✅ URL取得完了！
    echo ═══════════════════════════════════════════
    echo.
    type tunnel-url.txt 2>nul | findstr "loca.lt"
    echo.
    echo ═══════════════════════════════════════════
    echo.
    echo 📱 LINE Developer Consoleに設定:
    echo    1. https://developers.line.biz/console/ にアクセス
    echo    2. Messaging API設定 → Webhook URL
    echo    3. 上記URL+/line/webhook を設定
    echo    4. Use webhook: ON
    echo    5. Verifyをクリック
    echo.
) else (
    echo ⚠️  URLが表示されない場合:
    echo    - 別のターミナルで実行: npx localtunnel --port 18789
    echo    - 表示されたURLをコピー
    echo.
)

pause
