@echo off
chcp 65001 >nul
REM ============================================
REM OpenClaw 自動ペアリング承認スクリプト
REM ============================================

set "LOG_DIR=%USERPROFILE%\.openclaw\logs"
set "PAIRING_FILE=%LOG_DIR%\pairing-codes.txt"

echo ============================================
echo OpenClaw LINE 自動ペアリング承認
echo ============================================
echo %date% %time%
echo.

REM ログディレクトリ確認
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo [1/3] ゲートウェイログを確認中...
echo.

REM 最新のログファイルを検索
set "LATEST_LOG="
for /f "delims=" %%f in ('dir /b /o-d "%LOG_DIR%\openclaw-*.log" 2^>nul') do (
    if not defined LATEST_LOG set "LATEST_LOG=%%f"
)

if defined LATEST_LOG (
    echo [Found] %LATEST_LOG%
    echo.
) else (
    echo [ERROR] ログファイルが見つかりません
    echo ゲートウェイが起動していることを確認してください
    pause
    exit /b 1
)

REM ペアリングコードを検索
echo [2/3] ペアリングコードを検索中...
set "PAIRING_CODE="
for /f "tokens=*" %%a in ('type "%LOG_DIR%\%LATEST_LOG%" ^| findstr /i "pairing.*line.*code" ^| tail /n 1') do (
    for %%b in (%%a) do (
        if not defined PAIRING_CODE (
            for %%c in (%%b) do (
                if not "%%c"=="pairing" if not "%%c"=="line" (
                    set "PAIRING_CODE=%%c"
                )
            )
        )
    )
)

REM より直接的な検索
for /f "tokens=3" %%a in ('type "%LOG_DIR%\%LATEST_LOG%" ^| findstr /i "LINE.*pairing" ^| findstr /i "code"') do (
    set "PAIRING_CODE=%%a"
)

if defined PAIRING_CODE (
    echo [Found] ペアリングコード: %PAIRING_CODE%
    echo.
) else (
    echo [Waiting] ペアリングコードを待機中...
    echo.
    echo LINEからボットにメッセージを送信してください
    echo.
    echo 10秒後に再確認します...
    timeout /t 10 /nobreak >nul
    
    for /f "tokens=3" %%a in ('type "%LOG_DIR%\%LATEST_LOG%" ^| findstr /i "LINE.*pairing" ^| findstr /i "code"') do (
        set "PAIRING_CODE=%%a"
    )
    
    if not defined PAIRING_CODE (
        echo [Timeout] ペアリングコードが見つかりませんでした
        echo ゲートウェイログを確認してください
        pause
        exit /b 1
    )
)

REM ============================================
REM Step 3: ペアリング承認
REM ============================================
echo [3/3] ペアリングを承認中...

echo y | openclaw pairing approve line %PAIRING_CODE% >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo ✅ ペアリング承認完了
    echo ============================================
    echo.
    echo LINE botとの通信が有効になりました
    echo.
    echo 次のステップ:
    echo 1. LINEアプリからメッセージを送信
    echo 2. AIアシスタントが応答するはずです
    echo.
) else (
    echo [ERROR] 承認に失敗しました
    echo 手動で実行してください:
    echo   openclaw pairing approve line %PAIRING_CODE%
    pause
    exit /b 1
)

pause
