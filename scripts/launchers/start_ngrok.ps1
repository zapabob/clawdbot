param([int]$Port = 18789)
$Host.UI.RawUI.WindowTitle = "OpenClaw Ngrok Tunnel"
Write-Host "Starting Ngrok on port $Port..." -ForegroundColor Cyan
ngrok http $Port
