@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM LINE Webhook トラブルシューター
REM ============================================

echo ============================================
echo LINE Webhook トラブルシューティング
echo ============================================
echo.

REM ステップ1: Gateway停止
echo [1/4] Gatewayを停止中...
node openclaw.mjs gateway stop 2>nul
timeout /t 2 >nul
echo    完了
echo.

REM ステップ2: 設定ファイル確認
echo [2/4] 設定ファイル確認...
if exist "C:\Users\downl\.openclaw\openclaw.json" (
    echo    ✅ openclaw.json 存在
    findstr "channelAccessToken" "C:\Users\downl\.openclaw\openclaw.json" >nul
    if !errorlevel! equ 0 (
        echo    ✅ Token設定済み
    ) else (
        echo    ⚠️  Token未設定
    )
    findstr "channelSecret" "C:\Users\downl\.openclaw\openclaw.json" >nul
    if !errorlevel! equ 0 (
        echo    ✅ Secret設定済み
    ) else (
        echo    ⚠️  Secret未設定
    )
) else (
    echo    ⚠️  openclaw.json が見つかりません
)
echo.

REM ステップ3: Gateway再起動
echo [3/4] Gatewayを再起動中...
start "Gateway" /MIN cmd /c "cd /d %~dp0 && node openclaw.mjs gateway --port 18789 --tailscale serve --verbose > gateway.log 2>&1"
timeout /t 8 >nul
echo    完了
echo.

REM ステップ4: Webhookテスト
echo [4/4] Webhook健全性確認...
curl -s -o nul -w "    HTTP応答コード: %{http_code}\n" http://127.0.0.1:18789/line/webhook 2>nul
echo.

echo ============================================
echo  トラブルシューティング結果
echo ============================================
echo.
echo 📋 次のステップ:
echo.
echo 1. LINE Developer Consoleにアクセス:
echo    https://developers.line.biz/console/
echo.
echo 2. Webhook設定を確認:
echo    - Webhook URL: https://100.91.183.75:18789/line/webhook
echo    - "Use webhook": ON
echo    - "Verify"ボタン: クリック
echo.
echo 3. テスト:
echo    LINEでボットにメッセージを送信
echo.
echo 📝 注意:
echo    "Missing X-Line-Signature header"エラーは
echo    手動テスト時に正常に表示されます。
echo    LINEからの実際のWebhookには署名が付きます。
echo.
echo 💡 それでもエラーが出る場合:
echo    - Channel Access Tokenを再発行
echo    - Channel Secretを確認
echo    - Webhook URLを再設定
echo.

pause
