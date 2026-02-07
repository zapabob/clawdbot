@echo off
REM OpenClaw Gateway + MCP Server Launcher for Windows
REM Usage: start-mcp.bat

setlocal enabledelayedexpansion

echo 🦞 OpenClaw Gateway + MCP Server Launcher
echo ==========================================
echo.

echo 1️⃣  Starting OpenClaw Gateway...
start /B "OpenClaw Gateway" node scripts\run-node.mjs gateway > gateway.log 2>&1

set "gateway_ready=0"
set "count=0"

:wait_gateway
timeout /t 2 /nobreak > nul
set /a count+=1
if %count% gtr 30 (
    echo ❌ Gateway failed to start within 60 seconds
    exit /b 1
)

REM Check if gateway is ready by checking the log or trying to connect
curl -s http://localhost:18789/health > nul 2>&1
if errorlevel 1 goto wait_gateway

echo ✅ Gateway ready on port 18789
echo.

echo 2️⃣  Starting MCP Server...
start /B "MCP Server" node gemini-mcp-server.js

echo ✅ MCP Server starting on port 3000
echo.
echo ==========================================
echo 🚀 Both services are running!
echo    - Gateway: ws://localhost:18789
echo    - MCP Server: http://localhost:3000
echo.
echo    Press Ctrl+C to stop all services
echo ==========================================
echo.

:loop
timeout /t 1 > nul
goto loop

endlocal
