@echo off
REM ============================================================================
REM Gemini CLI ↔ OpenClaw Gateway Bridge Launcher
REM ============================================================================

setlocal

cd /d "%~dp0.."

title Gemini-OpenClaw Bridge

echo ============================================
echo Gemini CLI ↔ OpenClaw Bridge
echo ============================================
echo.
echo Starting bridge...
echo.
echo Prerequisites:
echo   1. Gemini CLI running: gemini --mcp-server=8080
echo   2. OpenClaw Gateway running: node dist\entry.mjs gateway --port 18789
echo.
echo Press Ctrl+C to stop.
echo ============================================
echo.

REM Run the bridge
python gemini-openclaw-bridge.py

echo.
echo Bridge stopped.
pause

endlocal
