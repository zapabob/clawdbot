#!/usr/bin/env pwsh
# OpenClaw Gateway + MCP Server Launcher (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "🦞 OpenClaw Gateway + MCP Server Launcher" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Start Gateway
Write-Host "1️⃣  Starting OpenClaw Gateway..." -ForegroundColor Yellow
$gatewayJob = Start-Process -NoNewWindow -PassThru -FilePath "node" -ArgumentList "scripts/run-node.mjs", "gateway"

Write-Host "   Waiting for gateway to be ready..." -ForegroundColor Gray
$timeout = 60
$elapsed = 0
while ($elapsed -lt $timeout) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:18789/health" -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
    $elapsed++
}

if ($elapsed -ge $timeout) {
    Write-Host "❌ Gateway failed to start within 60 seconds" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Gateway ready on port 18789" -ForegroundColor Green
Write-Host ""

# Start MCP Server
Write-Host "2️⃣  Starting MCP Server..." -ForegroundColor Yellow
$mcpJob = Start-Process -NoNewWindow -PassThru -FilePath "node" -ArgumentList "gemini-mcp-server.js"

Write-Host "   ✅ MCP Server starting on port 3000" -ForegroundColor Green
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 Both services are running!" -ForegroundColor Green
Write-Host "   - Gateway: ws://localhost:18789"
Write-Host "   - MCP Server: http://localhost:3000"
Write-Host ""
Write-Host "   Press Ctrl+C to stop all services" -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Cyan

# Wait for processes
try {
    Wait-Process -Id $gatewayJob.Id, $mcpJob.Id -ErrorAction Stop
} catch {
    Write-Host ""
    Write-Host "🧹 Cleaning up..." -ForegroundColor Gray
    Stop-Process -Id $gatewayJob.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $mcpJob.Id -ErrorAction SilentlyContinue
}
