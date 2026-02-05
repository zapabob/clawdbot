@echo off
REM OpenClaw LINE Bot Auto-Start on Boot
REM 電源投入時にLINEボットを自動起動

set SCRIPT_DIR=%~dp0
set POWERShell=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe

REM ログファイル設定
set LOG_DIR=%USERPROFILE%\.openclaw\logs
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo [%DATE% %TIME%] Starting OpenClaw LINE Bot... >> "%LOG_DIR%\openclaw-startup.log"

REM PowerShellスクリプトを実行
cd /d "%SCRIPT_DIR%"
"%POWERShell%" -ExecutionPolicy Bypass -WindowStyle Hidden -File "%SCRIPT_DIR%scripts\openclaw-line-full-auto.ps1" >> "%LOG_DIR%\openclaw-startup.log" 2>&1

echo [%DATE% %TIME%] Startup complete >> "%LOG_DIR%\openclaw-startup.log"
