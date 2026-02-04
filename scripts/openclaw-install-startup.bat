@echo off
chcp 65001 >nul
REM ============================================
REM OpenClaw スタートアップ登録スクリプト
REM ============================================

set "SCRIPT_PATH=%~dp0openclaw-start.bat"
set "STARTUP_DIR=%USERPROFILE%\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_NAME=OpenClaw.lnk"

echo ============================================
echo OpenClaw スタートアップ登録
echo ============================================
echo.

REM スタートアップフォルダを確認
if not exist "%STARTUP_DIR%" (
    mkdir "%STARTUP_DIR%"
    echo [Created] %STARTUP_DIR%
)

REM 既存のショートカットを削除
if exist "%STARTUP_DIR%\%SHORTCUT_NAME%" (
    del "%STARTUP_DIR%\%SHORTCUT_NAME%"
    echo [Removed] 既存のショートカット
)

REM PowerShellでショートカット作成
powershell -Command ^
    $WshShell = New-Object -ComObject WScript.Shell; ^
    $Shortcut = $WshShell.CreateShortcut('%STARTUP_DIR%\%SHORTCUT_NAME%'); ^
    $Shortcut.TargetPath = '%SystemRoot%\System32\cmd.exe'; ^
    $Shortcut.Arguments = '/c cd /d \"%SCRIPT_PATH:\=\\\"%\" && \"%SCRIPT_PATH%\"'; ^
    $Shortcut.WorkingDirectory = '%~dp0'; ^
    $Shortcut.Description = 'OpenClaw AI Assistant - 自動起動'; ^
    $Shortcut.Save()

echo.
if exist "%STARTUP_DIR%\%SHORTCUT_NAME%" (
    echo [SUCCESS] スタートアップに登録しました
    echo.
    echo 次回Windows起動時に自動実行されます
) else (
    echo [ERROR] ショートカット作成に失敗しました
)

echo.
echo 設定内容:
echo   パス: %SCRIPT_PATH%
echo   スタートアップ: %STARTUP_DIR%\%SHORTCUT_NAME%
echo.
pause
