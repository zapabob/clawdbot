<#
.SYNOPSIS
  ASI ngrok URL Synchronizer
.DESCRIPTION
  Fetches the current ngrok public URL and updates WEBHOOK_BASE_URL in .env.
#>

$RepoRoot = "C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
$EnvFile = Join-Path $RepoRoot ".env"

function Get-NgrokUrl {
    $maxRetries = 10
    $retryCount = 0
    while ($retryCount -lt $maxRetries) {
        try {
            $response = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction Stop
            $publicUrl = $response.tunnels[0].public_url
            if ($publicUrl) {
                return $publicUrl
            }
        }
        catch {
            Write-Host "Waiting for ngrok to initialize... ($retryCount)" -ForegroundColor Gray
        }
        $retryCount++
        Start-Sleep -Seconds 2
    }
    return $null
}

Write-Host "--- ASI ngrok Sync Initiated ---" -ForegroundColor Cyan

$newUrl = Get-NgrokUrl
if (-not $newUrl) {
    Write-Host "[ERROR] Failed to fetch ngrok URL." -ForegroundColor Red
    exit 1
}

Write-Host "Detected ngrok URL: $newUrl" -ForegroundColor Green

# Update .env file
if (Test-Path $EnvFile) {
    $content = Get-Content $EnvFile -Raw
    if ($content -match "WEBHOOK_BASE_URL=.*") {
        $newContent = $content -replace "WEBHOOK_BASE_URL=.*", "WEBHOOK_BASE_URL=$newUrl"
        $newContent | Set-Content $EnvFile -NoNewline -Encoding UTF8
        Write-Host "✓ .env updated with new WEBHOOK_BASE_URL" -ForegroundColor Green
    }
    else {
        Write-Host "[WARNING] WEBHOOK_BASE_URL not found in .env. Appending..." -ForegroundColor Yellow
        Add-Content $EnvFile -Value "WEBHOOK_BASE_URL=$newUrl" -Encoding UTF8
    }
}
else {
    Write-Host "[ERROR] .env file not found at $EnvFile" -ForegroundColor Red
    exit 1
}

Write-Host "--- ASI ngrok Sync Complete ---" -ForegroundColor Cyan
