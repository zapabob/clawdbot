param(
    [int]$Port = 18789,
    [string]$ProjectDir = (Split-Path $PSScriptRoot -Parent | Split-Path -Parent),
    [int]$PollRetries = 60,
    [int]$PollIntervalSec = 1,
    # Kill existing ngrok.exe and start a new tunnel (default: try to reuse a healthy tunnel first).
    [switch]$ForceRestart,
    # Max seconds to wait for upstream TCP (Gateway) before starting ngrok (reduces ERR_NGROK_8012).
    [int]$UpstreamWaitSeconds = 90
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\env-tools.ps1"

Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir
Add-SovereignDevToolsToPath

if ($Port -lt 1 -or $Port -gt 65535) {
    throw "[ngrok] Invalid -Port: $Port (expected 1-65535)"
}

$candidate = [string]$env:NGROK_UPSTREAM_URL
$upstream = $null
if ($candidate -match '^\s*https?://' -and $candidate -notmatch '(?i)undefined' -and $candidate -notmatch '(?i)^\s*https?://\s*$') {
    $upstream = $candidate.Trim()
}
if (-not $upstream) {
    $upstream = "http://127.0.0.1:$Port"
}

$tunnelMatchPort = Get-NgrokUpstreamTunnelMatchPort -GatewayPort $Port

try {
    $upUri = [Uri]$upstream
    if ($upUri.Port -eq 8080 -and $Port -ne 8080) {
        Write-Host @"
[ngrok] WARNING: Upstream is port 8080 (typical Hypura / Ollama-compatible inference), but this run targets Gateway port $Port.
  OpenClaw LINE/Telegram webhooks are served by the Gateway, not Hypura.
  Fix: in .env remove NGROK_UPSTREAM_URL or set NGROK_UPSTREAM_URL=http://127.0.0.1:$Port
  Then restart ngrok (desktop stack uses -ForceRestart by default on fresh tunnels).
"@ -ForegroundColor Yellow
    }
} catch { }

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

function Test-NgrokTunnelMatchesLocalPort {
    param(
        [Parameter(Mandatory = $true)] $Tunnel,
        [Parameter(Mandatory = $true)] [int]$LocalPort
    )
    $addr = $null
    if ($Tunnel.config -and $Tunnel.config.addr) {
        $addr = [string]$Tunnel.config.addr
    }
    if (-not $addr -and $Tunnel.public_url) {
        return $false
    }
    # e.g. http://127.0.0.1:18789 or https://127.0.0.1:18789
    if ($addr -match "127\.0\.0\.1:$LocalPort\b" -or $addr -match "localhost:$LocalPort\b") {
        return $true
    }
    return $false
}

function Get-ExistingNgrokPublicUrl {
    param([int]$LocalPort)
    try {
        $resp = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 2 -ErrorAction Stop
        if (-not $resp.tunnels) { return $null }
        foreach ($t in $resp.tunnels) {
            if (Test-NgrokTunnelMatchesLocalPort -Tunnel $t -LocalPort $LocalPort) {
                $u = [string]$t.public_url
                if ($u) { return $u }
            }
        }
    } catch { }
    return $null
}

function Wait-UpstreamReady {
    param(
        [string]$UpstreamUrl,
        [int]$MaxSeconds
    )
    $deadline = [DateTime]::UtcNow.AddSeconds($MaxSeconds)
    $uri = $null
    try { $uri = [Uri]$UpstreamUrl } catch { return $false }
    while ([DateTime]::UtcNow -lt $deadline) {
        try {
            $c = Invoke-WebRequest -Uri $UpstreamUrl -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($c.StatusCode -ge 200 -and $c.StatusCode -lt 500) {
                return $true
            }
        } catch {
            # Connection refused / reset until Gateway listens
        }
        Start-Sleep -Milliseconds 400
    }
    return $false
}

# --- Optional: reuse existing ngrok that already tunnels to this upstream (avoids killing unrelated sessions) ---
if (-not $ForceRestart) {
    $reuseUrl = Get-ExistingNgrokPublicUrl -LocalPort $tunnelMatchPort
    if ($reuseUrl) {
        Write-Host "[ngrok] Reusing existing tunnel -> $reuseUrl (matches local port $tunnelMatchPort). Use -ForceRestart to replace." -ForegroundColor DarkCyan
        $values = Build-NgrokWebhookEnvValues -PublicUrl $reuseUrl -ProjectDir $ProjectDir -GatewayPort $Port
        Apply-NgrokWebhookEnvToFiles -ProjectDir $ProjectDir -Values $values
        foreach ($key in $values.Keys) {
            Set-Item -Path "Env:$key" -Value $values[$key]
        }
        if ($values.ContainsKey("LINE_WEBHOOK_URL")) {
            Write-Host "[ngrok] .env synced (Telegram /telegram-webhook, LINE /line/webhook — see scripts/launchers/README.md)." -ForegroundColor Green
        } else {
            Write-Host "[ngrok] .env synced (Telegram-first: OPENCLAW_PUBLIC_URL + TELEGRAM_WEBHOOK_URL only; LINE_WEBHOOK_URL unchanged — use a second tunnel or polling for LINE)." -ForegroundColor Green
        }
        exit 0
    }
}

Write-Host "[ngrok] Starting tunnel -> upstream $upstream (CLI port hint: $Port)..." -ForegroundColor Cyan

# Wait until Gateway answers HTTP (reduces ERR_NGROK_8012 when ngrok starts too early).
Write-Host "[ngrok] Waiting for upstream HTTP ($upstream) up to ${UpstreamWaitSeconds}s..." -ForegroundColor Gray
$ready = Wait-UpstreamReady -UpstreamUrl $upstream -MaxSeconds $UpstreamWaitSeconds
if (-not $ready) {
    Write-Host "[ngrok] WARNING: upstream did not respond in time; ngrok may show 8012 until Gateway is up." -ForegroundColor Yellow
}

# Fresh tunnel: free :4040 (reuse path exited above).
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

# Local API poll (404) — must match env-tools Sync-NgrokPublicUrlToEnv (/hooks/* not /webhook/*).
$publicUrl = $null
for ($i = 0; $i -lt $PollRetries; $i++) {
    Start-Sleep -Seconds $PollIntervalSec
    $ngrokProc.Refresh()
    if ($ngrokProc.HasExited) {
        Write-Host "[ngrok] ERROR: ngrok exited early (exit $($ngrokProc.ExitCode)). Auth? Run: ngrok config add-authtoken <TOKEN>" -ForegroundColor Red
        break
    }
    try {
        $resp = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction Stop
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

    $values = Build-NgrokWebhookEnvValues -PublicUrl $publicUrl -ProjectDir $ProjectDir -GatewayPort $Port
    Apply-NgrokWebhookEnvToFiles -ProjectDir $ProjectDir -Values $values
    if ($values.ContainsKey("LINE_WEBHOOK_URL")) {
        Write-Host "[ngrok] .env updated: OPENCLAW_PUBLIC_URL, TELEGRAM_WEBHOOK_URL, LINE_WEBHOOK_URL" -ForegroundColor Green
    } else {
        Write-Host "[ngrok] .env updated: OPENCLAW_PUBLIC_URL, TELEGRAM_WEBHOOK_URL (Telegram-first; LINE_WEBHOOK_URL not set)" -ForegroundColor Green
    }

    foreach ($key in $values.Keys) {
        Set-Item -Path "Env:$key" -Value $values[$key]
    }
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
