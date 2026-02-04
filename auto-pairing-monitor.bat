@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM LINE ペアリング自動監視・承認システム
REM ============================================

set SCRIPTDIR=%~dp0

echo ============================================
echo LINE ペアリング自動監視・承認
echo ============================================
echo.

:PAIRING_LOOP
echo [PAIRING] ペアリングリクエスト確認中...
echo    (LINEでボットにメッセージを送信してください)
echo.

REM ペアリングコード確認
node openclaw.mjs pairing list line --json 2>nul | findstr "code" >nul
if !errorlevel! equ 0 (
    echo 🔔 ペアリングリクエスト検出！
    echo.
    
    REM コード取得
    for /f "tokens=*" %%a in ('node openclaw.mjs pairing list line --json 2^>nul ^| powershell -Command "$json = $input | Out-String | ConvertFrom-Json; if ($json.requests.Count -gt 0) { Write-Output $json.requests[0].code } else { Write-Output 'NONE' }"') do set CODE=%%a
    
    if not "!CODE!"=="NONE" (
        echo 📝 検出されたコード: !CODE!
        echo.
        echo 🔄 自動承認中...
        echo.
        node openclaw.mjs pairing approve line !CODE!
        
        if !errorlevel! equ 0 (
            echo.
            echo ============================================
            echo ✅ 承認成功！LINEボットが使用可能です！
            echo ============================================
            echo.
            echo 💡 テスト:
            echo    LINEでボットに「こんにちは」と送信
            echo    ボットが応答すれば正常動作しています
            echo.
        ) else (
            echo ❌ 承認失敗
        )
    )
    
    echo.
    echo 🔄 10秒後に再確認します...
    timeout /t 10 /nobreak >nul
    goto PAIRING_LOOP
)

REM 60秒ごとに再確認
timeout /t 60 /nobreak >nul
goto PAIRING_LOOP
