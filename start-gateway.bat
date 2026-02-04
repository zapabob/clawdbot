@echo off
chcp 65001
cls

echo ============================================
echo OpenClaw + LINE 双方向通信スターター
echo ============================================
echo.

REM 設定ファイルのパス
set CONFIG_DIR=%USERPROFILE%\.openclaw
set CONFIG_FILE=%CONFIG_DIR%\openclaw.json

REM 設定ファイルが存在するか確認
if not exist "%CONFIG_FILE%" (
    echo ⚠️  設定ファイルが見つかりません: %CONFIG_FILE%
    echo.
    echo 📋 セットアップ手順:
    echo.
    echo 1. LINE Developer Console で設定:
    echo    https://developers.line.biz/console/
    echo.
    echo 2. 以下の情報を取得:
    echo    - Channel access token
    echo    - Channel secret
    echo.
    echo 3. 設定ファイルを作成: %CONFIG_FILE%
    echo    openclaw-config-example.json をコピーして編集してください
    echo.
    echo 4. または環境変数を設定:
    echo    set LINE_CHANNEL_ACCESS_TOKEN=your_token
    echo    set LINE_CHANNEL_SECRET=your_secret
    echo.
    pause
    exit /b 1
)

echo ✅ 設定ファイルが見つかりました: %CONFIG_FILE%
echo.

REM ゲートウェイの起動
echo 🚀 ゲートウェイを起動しています...
echo    URL: http://127.0.0.1:18789/
echo    LINE Webhook: http://127.0.0.1:18789/line/webhook
echo.
echo 📱 Web UI を開くには:
echo    1. ブラウザで http://127.0.0.1:18789/ を開く
echo    2. または「openclaw dashboard」コマンドを実行
echo.
echo ⛔ 停止するには Ctrl+C を押してください
echo.

node openclaw.mjs gateway --port 18789 --verbose
