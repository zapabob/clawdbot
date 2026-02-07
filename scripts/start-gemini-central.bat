@echo off
REM ============================================================================
REM Gemini CLI as Central Brain - OpenClaw Integration Launcher
REM ============================================================================
REM This script:
REM 1. Starts OpenClaw Gateway (if not running)
REM 2. Adds OpenClaw as MCP server to Gemini CLI
REM 3. Launches Gemini CLI with OpenClaw as the central AI brain
REM ============================================================================

setlocal

cd /d "%~dp0.."

title Gemini CLI - Central Brain Mode

echo ============================================
echo Gemini CLI as Central Brain
echo ============================================
echo.
echo This will:
echo   1. Start OpenClaw Gateway (port 18789)
echo   2. Connect Gemini CLI to OpenClaw channels
echo   3. Use Gemini CLI as the main AI controller
echo.
echo Press Ctrl+C to stop all services.
echo ============================================
echo.

REM Check if OpenClaw is running
netstat -ano | findstr :18789 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] OpenClaw Gateway already running on port 18789
) else (
    echo [START] Starting OpenClaw Gateway...
    start "OpenClaw Gateway" cmd /c "node dist\entry.mjs gateway --port 18789"
    echo [WAIT] Waiting for OpenClaw to start...
    ping -n 5 127.0.0.1 >nul 2>&1
)

REM Add OpenClaw as MCP server to Gemini CLI
echo.
echo [CONFIG] Configuring OpenClaw MCP server...

REM Create MCP server script for OpenClaw
echo {"command":"node","args":["%CD%\\gemini-mcp-server.js"],"env":{"OPENCLAW_PORT":"18789"}} > "%TEMP%\openclaw-mcp.json"
echo [OK] MCP server config created

REM Add OpenClaw MCP server
echo.
echo [MCP] Adding OpenClaw MCP server to Gemini CLI...
gemini mcp add openclaw "node %CD%\gemini-mcp-server.js" 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] OpenClaw MCP server added
) else (
    echo [WARN] MCP server may already exist or failed to add
)

REM Enable the MCP server
gemini mcp enable openclaw 2>nul
echo [OK] MCP server enabled

echo.
echo ============================================
echo [READY] Starting Gemini CLI as Central Brain
echo ============================================
echo.
echo Gemini CLI will now control OpenClaw channels:
echo   - WhatsApp, Telegram, Slack, Discord, etc.
echo   - All messages routed through Gemini CLI
echo.
echo Type your commands to Gemini CLI...
echo ============================================
echo.

REM Start Gemini CLI in interactive mode with OpenClaw integration
gemini --yolo --approval-mode auto_edit

echo.
echo ============================================
echo Gemini CLI stopped.
echo ============================================
pause

endlocal
