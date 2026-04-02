param(
    [int]$Port = 18789,
    [string]$ProjectDir = (Split-Path $PSScriptRoot -Parent | Split-Path -Parent),
    [int]$PollRetries = 45,
    [int]$PollIntervalSec = 1
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\env-tools.ps1"

Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir
Add-SovereignDevToolsToPath

if ($Port -lt 1 -or $Port -gt 65535) {
    throw "[ngrok] Invalid -Port: $Port (expected 1-65535)"
}

# Explicit loopback URL avoids the agent failing to resolve the upstream (never use a bare / missing target).
# Optional: set NGROK_UPSTREAM_URL in .env / .env.local to e.g. https://localhost:8443 if your app is TLS-local.
$candidate = [string]$env:NGROK_UPSTREAM_URL
$upstream = $null
if ($candidate -match '^\s*https?://' -and $candidate -notmatch '(?i)undefined' -and $candidate -notmatch '(?i)^\s*https?://\s*$') {
    $upstream = $candidate.Trim()
}
if (-not $upstream) {
    $upstream = "http://127.0.0.1:$Port"
}

$EnvFile = Get-ProjectEnvFile -ProjectDir $ProjectDir

<#
  Bundled ngrok only: search under repo root (bin/ is gitignored but standard on disk).
  Override: NGROK_EXE in .env / .env.local (full path to ngrok.exe).
#>
function Resolve-RepoNgrokExecutable {
    param([Parameter(Mandatory = $true)][string]$Root)
    $trim = { param($s) if ($null -eq $s) { "" } else { $s.Trim() } }
    $fromEnv = & $trim $env:NGROK_EXE
    if ($fromEnv -and (Test-Path -LiteralPath $fromEnv)) {
        return (Resolve-Path -LiteralPath $fromEnv).Path
    }
    $names = @("ngrok.exe", "ngrok")
    $dirs = @(
        "bin"
        "tools"
        "scripts\tools"
        "vendor\ngrok"
        "third_party\ngrok"
        "ngrok"
    )
    foreach ($rel in $dirs) {
        $base = Join-Path $Root $rel
        foreach ($n in $names) {
            $p = Join-Path $base $n
            if (Test-Path -LiteralPath $p) {
                return (Resolve-Path -LiteralPath $p).Path
            }
        }
    }
    return $null
}

Write-Host "[ngrok] Starting tunnel -> upstream $upstream (CLI port hint: $Port)..." -ForegroundColor Cyan

# 既存 ngrok プロセスを強制終了してからリスタート
Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

$NgrokPath = Resolve-RepoNgrokExecutable -Root $ProjectDir
if (-not $NgrokPath) {
    $msg = @(
        "[ngrok] No ngrok binary under repo: $ProjectDir"
        "  Expected one of: bin\ngrok.exe, tools\ngrok.exe, scripts\tools\ngrok.exe, ..."
        "  Or set NGROK_EXE in .env to the full path of ngrok.exe"
    ) -join [Environment]::NewLine
    throw $msg
}
Write-Host "[ngrok] Using repo binary: $NgrokPath" -ForegroundColor Gray

$ngrokProc = Start-Process -FilePath $NgrokPath -ArgumentList @("http", $upstream) -WorkingDirectory $ProjectDir `
    -WindowStyle Minimized -PassThru
if (-not $ngrokProc) {
    throw "[ngrok] Start-Process returned no process. Check NGROK_EXE / repo binary path."
}

# Local API poll (404)
$publicUrl = $null
for ($i = 0; $i -lt $PollRetries; $i++) {
    Start-Sleep -Seconds $PollIntervalSec
    $ngrokProc.Refresh()
    if ($ngrokProc.HasExited) {
        Write-Host "[ngrok] ERROR: ngrok exited early (exit $($ngrokProc.ExitCode)). Auth? Run: ngrok config add-authtoken <TOKEN>" -ForegroundColor Red
        break
    }
    try {
        $resp = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        $tunnel = $resp.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
        if (-not $tunnel) {
            $tunnel = $resp.tunnels | Select-Object -First 1
        }
        if ($tunnel) {
            $publicUrl = $tunnel.public_url
            break
        }
    } catch { }
}

if ($publicUrl) {
    Write-Host "[ngrok] Public URL: $publicUrl" -ForegroundColor Green

    $telegramUrl = "$publicUrl/webhook/telegram"
    $lineUrl = "$publicUrl/webhook/line"

    Set-EnvValues -EnvFile $EnvFile -Values @{
        OPENCLAW_PUBLIC_URL   = $publicUrl
        TELEGRAM_WEBHOOK_URL  = $telegramUrl
        LINE_WEBHOOK_URL      = $lineUrl
    }
    Write-Host "[ngrok] .env updated: OPENCLAW_PUBLIC_URL, TELEGRAM_WEBHOOK_URL, LINE_WEBHOOK_URL" -ForegroundColor Green

    $env:OPENCLAW_PUBLIC_URL = $publicUrl
    $env:TELEGRAM_WEBHOOK_URL = $telegramUrl
    $env:LINE_WEBHOOK_URL = $lineUrl
} else {
    Write-Host "[ngrok] WARNING: Could not retrieve public URL after $PollRetries attempts." -ForegroundColor Yellow
    Write-Host "[ngrok] Is ngrok authenticated? Run: ngrok config add-authtoken <TOKEN>" -ForegroundColor Yellow
}

Write-Host "[ngrok] Running (PID $($ngrokProc.Id)). Press Ctrl+C to stop this window (ngrok may keep running)." -ForegroundColor Cyan
try {
    Wait-Process -Id $ngrokProc.Id -ErrorAction Stop
} catch {
    Write-Host "[ngrok] Wait ended: $_" -ForegroundColor Gray
}
