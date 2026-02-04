@echo off
echo ==========================================
echo OpenClaw Auto-Improve System Starter
echo ==========================================
echo.
echo Configuration:
echo   Primary: GPT-5.2
echo   Fallback: Codex 5.1 Max
echo   Mode: HIGH (Automatic major changes)
echo.
echo This will start 3 components:
echo   1. Auto-Improve Engine (main)
echo   2. Health Monitor (real-time)
echo   3. Gateway (OpenClaw)
echo.
echo Press any key to start...
pause > nul

:: Start Auto-Improve in new window
start "Auto-Improve Engine" cmd /k "cd /d %~dp0\auto-improve && echo Starting Auto-Improve Engine... && node auto-improve.mjs"

:: Wait 3 seconds
timeout /t 3 /nobreak > nul

:: Start Monitor in new window
start "Health Monitor" cmd /k "cd /d %~dp0\auto-improve && echo Starting Health Monitor... && node monitor.mjs"

:: Wait 2 seconds
timeout /t 2 /nobreak > nul

:: Start Gateway in new window
start "OpenClaw Gateway" cmd /k "cd /d %~dp0 && echo Starting OpenClaw Gateway... && pnpm dev gateway"

echo.
echo ==========================================
echo All components started!
echo.
echo Commands:
echo   Rollback: cd auto-improve ^&^& node rollback.mjs list
echo   Status: cd auto-improve ^&^& node rollback.mjs last-stable
echo.
echo Press any key to exit this window...
pause > nul
