@echo off
chcp 65001 >nul
echo ============================================
echo OpenClaw 自動承認ツール
echo ============================================
echo.
echo ステータス確認中...
echo.

REM ペアリングリストを取得
node openclaw.mjs pairing list line

REM コードの入力待機
echo.
echo 上記に表示されたコード（またはLINEに届いた新しいコード）を入力:
set /p PAIRING_CODE="コード: "
echo.
echo 承認中: %PAIRING_CODE%
node openclaw.mjs pairing approve line %PAIRING_CODE%

if %errorlevel% == 0 (
    echo.
    echo ✅ 承認成功！
    echo 📱 LINEでボットと会話できます
    echo 🌐 Web UI: http://127.0.0.1:18789/
) else (
    echo.
    echo ❌ 承認失敗
    echo    コードが正しいか確認してください
)
echo.
pause
