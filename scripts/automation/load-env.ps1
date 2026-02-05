# OpenClaw Environment Loader - PowerShell Version
# Loads environment variables from .env file

param(
    [string]$EnvFile = ".env"
)

function Write-ColorOutput($ForegroundColor, $Message) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Magenta "============================================"
Write-ColorOutput Magenta "  🦞 OpenClaw Environment Loader (PowerShell)"
Write-ColorOutput Magenta "============================================"
Write-Output ""

if (-not (Test-Path $EnvFile)) {
    Write-ColorOutput Red "❌ .env file not found at: $((Resolve-Path $EnvFile))"
    exit 1
}

Write-ColorOutput Blue "📂 Loading environment variables from .env file..."
Write-Output ""

$loadedCount = 0

Get-Content $EnvFile | ForEach-Object {
    $line = $_
    
    # Skip comments and empty lines
    if (-not $line.StartsWith("#") -and -not [string]::IsNullOrWhiteSpace($line)) {
        # Check if line contains =
        if ($line -match "^([^=]+)=(.*)$") {
            $varName = $matches[1].Trim()
            $varValue = $matches[2].Trim()
            
            # Remove surrounding quotes if present
            $varValue = $varValue -replace '^["'']' -replace '["'']$'
            
            # Set environment variable
            [Environment]::SetEnvironmentVariable($varName, $varValue, "Process")
            
            Write-ColorOutput Green "  ✓ Set $varName"
            $loadedCount++
        }
    }
}

Write-Output ""
Write-ColorOutput Green "✅ Environment variables loaded successfully!"
Write-Output ""
Write-ColorOutput Cyan "📊 Loaded $loadedCount environment variables"
Write-Output ""
Write-ColorOutput Yellow "🚀 You can now run OpenClaw commands in this PowerShell session."
Write-Output ""
Write-ColorOutput Blue "Example commands:"
Write-Output "  pnpm dev gateway"
Write-Output "  cd auto-improve && node auto-improve.mjs"
Write-Output "  openclaw doctor"
Write-Output ""
