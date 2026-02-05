@echo off
chcp 65001 >nul
echo ============================================
echo OpenClaw LINE ペアリング承認スクリプト
echo ============================================
echo.

:CHECK_LOOP
echo ペアリングリクエストを確認中...
node openclaw.mjs pairing list line --json 2>nul | findstr "\"code\"" >nul
if %errorlevel% equ 0 (
    echo.
    echo ✅ ペアリングリクエストが見つかりました！
    node openclaw.mjs pairing list line
    echo.
    goto APPROVE
) else (
    echo    待機中...（LINEでメッセージを送信してください）
    timeout /t 3 /nobreak >nul
    goto CHECK_LOOP
)

:APPROVE
echo.
echo 承認するペアリングコードを入力してください。
echo （LINEに表示された8文字のコード）
echo.
set /p CODE="コード: "
echo.
node openclaw.mjs pairing approve line %CODE%
if %errorlevel% equ 0 (
    echo.
    echo ✅ 承認完了！LINEでボットと会話できます。
) else (
    echo.
    echo ❌ 承認に失敗しました。コードを確認してください。
)
echo.
pause
