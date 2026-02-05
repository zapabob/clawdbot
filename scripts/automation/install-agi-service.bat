@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================
REM OpenClaw AGI バックグラウンドサービス登録
REM Windows起動時に自動実行
REM ============================================

set SCRIPTDIR=%~dp0
set SERVICE_NAME="OpenClawAGI"
set SERVICE_DESC="OpenClaw AGI Automation Service with Tailscale"
set STARTUP_SCRIPT="%SCRIPTDIR%agi-tailscale-auto.bat"

echo ============================================
echo OpenClaw AGI バックグラウンドサービス登録
echo ============================================
echo.

REM 方法1: スタートアップフォルダ (推奨)
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
echo [1/2] スタートアップに登録中...
if not exist "%STARTUP_FOLDER%" mkdir "%STARTUP_FOLDER%"
copy "%STARTUP_SCRIPT%" "%STARTUP_FOLDER%\" >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ %STARTUP_FOLDER%\agi-tailscale-auto.bat
) else (
    echo    ⚠️  スタートアップ登録失敗
)

REM 方法2: レジストリ登録 (代替)
echo [2/2] レジストリにも登録...
reg add "HKLM\Software\Microsoft\Windows\CurrentVersion\Run" /v "OpenClawAGI" /t REG_SZ /d "\"%STARTUP_SCRIPT%\"" /f >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ レジストリ登録完了
) else (
    echo    ⚠️  レジストリ登録失敗 (管理者権限が必要の場合は管理者として実行)
)

echo.
echo ============================================
echo 登録完了！
echo ============================================
echo.
echo 再起動時に自動起動します。
echo 手動で今すぐ起動する場合:
echo    %STARTUP_SCRIPT%
echo.
echo 登録を解除する場合:
echo    reg delete "HKLM\Software\Microsoft\Windows\CurrentVersion\Run" /v "OpenClawAGI" /f
echo    del "%STARTUP_FOLDER%\agi-tailscale-auto.bat"
echo.
pause
