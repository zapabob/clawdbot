@echo off
chcp 65001 >nul
echo ============================================
echo OpenClaw + LINE + Tailscale 全自動化
echo ============================================
echo.

REM PowerShellスクリプト実行
powershell -ExecutionPolicy Bypass -File "%~dp0start-tailscale-automation.ps1"

echo.
pause
