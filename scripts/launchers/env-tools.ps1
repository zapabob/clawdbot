function Get-ProjectEnvFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectDir
    )

    return Join-Path $ProjectDir ".env"
}

function Ensure-ProjectEnvFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectDir
    )

    $envFile = Get-ProjectEnvFile -ProjectDir $ProjectDir
    if (Test-Path $envFile) {
        return $envFile
    }

    $template = Join-Path $ProjectDir ".env.example"
    if (Test-Path $template) {
        Copy-Item $template $envFile
    } else {
        New-Item -ItemType File -Path $envFile -Force | Out-Null
    }

    return $envFile
}

function ConvertFrom-EnvValue {
    param(
        [AllowNull()]
        [string]$Value
    )

    if ($null -eq $Value) {
        return ""
    }

    $trimmed = $Value.Trim()
    if ($trimmed.Length -ge 2) {
        if (($trimmed.StartsWith('"') -and $trimmed.EndsWith('"')) -or
            ($trimmed.StartsWith("'") -and $trimmed.EndsWith("'"))) {
            return $trimmed.Substring(1, $trimmed.Length - 2)
        }
    }

    return $trimmed
}

function ConvertTo-EnvValue {
    param(
        [AllowNull()]
        [object]$Value
    )

    if ($null -eq $Value) {
        return ""
    }

    $stringValue = [string]$Value
    if ($stringValue -match '[\s"#]') {
        return '"' + ($stringValue -replace '"', '\"') + '"'
    }

    return $stringValue
}

function Get-EnvMap {
    param(
        [Parameter(Mandatory = $true)]
        [string]$EnvFile
    )

    $map = @{}
    if (-not (Test-Path $EnvFile)) {
        return $map
    }

    foreach ($line in Get-Content $EnvFile -Encoding UTF8) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
            $map[$Matches[1]] = ConvertFrom-EnvValue -Value $Matches[2]
        }
    }

    return $map
}

<#
  Merge .env then .env.local, then OPENCLAW_STATE_DIR\.env (default: repo\.openclaw-desktop\.env).
  Later files win. Launchers previously skipped the state .env — Telegram/LINE there never reached the Gateway child.
#>
function Get-MergedEnvMap {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectDir
    )

    $merged = @{}
    foreach ($rel in @(".env", ".env.local")) {
        $path = Join-Path $ProjectDir $rel
        if (-not (Test-Path -LiteralPath $path)) {
            continue
        }
        $map = Get-EnvMap -EnvFile $path
        foreach ($key in $map.Keys) {
            $merged[$key] = $map[$key]
        }
    }

    $stateRootRaw = ""
    if ($merged.ContainsKey("OPENCLAW_STATE_DIR")) {
        $stateRootRaw = [string]$merged["OPENCLAW_STATE_DIR"]
        if ($stateRootRaw) { $stateRootRaw = $stateRootRaw.Trim() }
    }
    if ([string]::IsNullOrWhiteSpace($stateRootRaw)) {
        $stateRoot = Join-Path $ProjectDir ".openclaw-desktop"
    } elseif ($stateRootRaw.StartsWith("~")) {
        $stateRoot = $stateRootRaw -replace "^~(?=[\\/]|$)", $env:USERPROFILE
    } else {
        $stateRoot = $stateRootRaw
    }

    $stateEnvPath = Join-Path $stateRoot ".env"
    if (Test-Path -LiteralPath $stateEnvPath) {
        $map = Get-EnvMap -EnvFile $stateEnvPath
        foreach ($key in $map.Keys) {
            $merged[$key] = $map[$key]
        }
    }

    # Parent process may set OPENCLAW_STATE_DIR (e.g. launch-desktop-stack) before this runs — merge that .env last.
    $procState = [string]$env:OPENCLAW_STATE_DIR
    if (-not [string]::IsNullOrWhiteSpace($procState)) {
        $procState = $procState.Trim()
        $procEnvPath = Join-Path $procState ".env"
        if (Test-Path -LiteralPath $procEnvPath) {
            $map = Get-EnvMap -EnvFile $procEnvPath
            foreach ($key in $map.Keys) {
                $merged[$key] = $map[$key]
            }
        }
    }

    return $merged
}

function Set-EnvValues {
    param(
        [Parameter(Mandatory = $true)]
        [string]$EnvFile,
        [Parameter(Mandatory = $true)]
        [hashtable]$Values
    )

    $existingLines = @()
    if (Test-Path $EnvFile) {
        $existingLines = @(Get-Content $EnvFile -Encoding UTF8)
    }

    $pending = @{}
    foreach ($key in $Values.Keys) {
        $pending[$key] = $Values[$key]
    }

    $updatedLines = New-Object System.Collections.Generic.List[string]
    foreach ($line in $existingLines) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=') {
            $key = $Matches[1]
            if ($pending.ContainsKey($key)) {
                $updatedLines.Add("$key=$(ConvertTo-EnvValue -Value $pending[$key])")
                $pending.Remove($key)
                continue
            }
        }

        $updatedLines.Add($line)
    }

    foreach ($key in ($pending.Keys | Sort-Object)) {
        $updatedLines.Add("$key=$(ConvertTo-EnvValue -Value $pending[$key])")
    }

    Set-Content -Path $EnvFile -Value $updatedLines -Encoding UTF8
}

<#
  True when NGROK_UPSTREAM_URL is safe to pass to `ngrok http <addr>` (absolute http(s) with real host/port).
  Rejects empty, JS-style "undefined"/"null" leaks, scheme typos (undefined://...), and port 0.
#>
function Test-OpenClawNgrokUpstreamCandidate {
    param(
        [AllowNull()]
        [string]$Candidate
    )
    if ([string]::IsNullOrWhiteSpace($Candidate)) {
        return $false
    }
    $t = $Candidate.Trim()
    if ($t.Length -lt 8) {
        return $false
    }
    if ($t -notmatch '^\s*https?://') {
        return $false
    }
    if ($t -match '(?i)undefined\s*:\s*//' -or $t -match '(?i)^\s*https?://\s*$') {
        return $false
    }
    if ($t -match '(?i)^\s*null\s*$') {
        return $false
    }
    try {
        $u = [Uri]$t
        if (-not $u.IsAbsoluteUri) {
            return $false
        }
        $scheme = $u.Scheme.ToLowerInvariant()
        if ($scheme -ne "http" -and $scheme -ne "https") {
            return $false
        }
        if ([string]::IsNullOrWhiteSpace($u.Host)) {
            return $false
        }
        if ($u.Host.Equals("undefined", [System.StringComparison]::OrdinalIgnoreCase)) {
            return $false
        }
        if ($u.Port -eq 0) {
            return $false
        }
        return $true
    } catch {
        return $false
    }
}

function Resolve-OpenClawNgrokUpstreamUrl {
    param(
        [AllowNull()]
        [string]$Candidate,
        [int]$GatewayPort = 18789,
        [string]$ProjectDir = ""
    )
    if (-not [string]::IsNullOrWhiteSpace($ProjectDir)) {
        $r = Get-OpenClawNgrokUpstreamResolution -NgrokUpstreamCandidate $Candidate -GatewayPort $GatewayPort -ProjectDir $ProjectDir
        return $r.Url
    }
    if (Test-OpenClawNgrokUpstreamCandidate -Candidate $Candidate) {
        return $Candidate.Trim()
    }
    return "http://127.0.0.1:$GatewayPort"
}

function Repair-OpenClawProcessEnvNgrokUpstreamUrl {
    $c = [string]$env:NGROK_UPSTREAM_URL
    if ([string]::IsNullOrWhiteSpace($c)) {
        return
    }
    if (-not (Test-OpenClawNgrokUpstreamCandidate -Candidate $c)) {
        Write-Host @"
[env] NGROK_UPSTREAM_URL is invalid for ngrok (value was: $c).
      Removed from this process so launchers default to http://127.0.0.1:<gateway port>.
      Fix .env: set e.g. NGROK_UPSTREAM_URL=http://127.0.0.1:18789 (Gateway) or :8787 (Telegram webhook listener),
      or run: scripts\launchers\repair-ngrok-upstream-env.ps1
"@ -ForegroundColor Yellow
        Remove-Item -Path "Env:NGROK_UPSTREAM_URL" -ErrorAction SilentlyContinue
    }
}

function Get-NgrokUpstreamTunnelMatchPort {
    param(
        [int]$GatewayPort = 18789,
        [string]$ProjectDir = ""
    )
    if (-not [string]::IsNullOrWhiteSpace($ProjectDir)) {
        $r = Get-OpenClawNgrokUpstreamResolution -NgrokUpstreamCandidate ([string]$env:NGROK_UPSTREAM_URL) -GatewayPort $GatewayPort -ProjectDir $ProjectDir
        return $r.TunnelPort
    }
    $candidate = [string]$env:NGROK_UPSTREAM_URL
    if (Test-OpenClawNgrokUpstreamCandidate -Candidate $candidate) {
        try {
            $u = [Uri]$candidate.Trim()
            $scheme = $u.Scheme.ToLowerInvariant()
            $port = $u.Port
            if (($scheme -eq "http" -and $port -eq 80) -or ($scheme -eq "https" -and $port -eq 443)) {
                return $GatewayPort
            }
            return $port
        } catch { }
    }
    return $GatewayPort
}

function Get-OpenClawTelegramWebhookListenPort {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectDir
    )
    $candidates = @(
        (Join-Path $ProjectDir ".openclaw-desktop\openclaw.json"),
        (Join-Path $ProjectDir "openclaw.json")
    )
    foreach ($cfgPath in $candidates) {
        if (-not (Test-Path -LiteralPath $cfgPath)) { continue }
        try {
            $raw = Get-Content -LiteralPath $cfgPath -Raw -Encoding UTF8
            $j = $raw | ConvertFrom-Json
            $ch = $j.channels
            if ($null -eq $ch) {
                return 8787
            }
            $tg = $ch.telegram
            if ($null -eq $tg) {
                return 8787
            }
            $wp = $tg.webhookPort
            if ($null -eq $wp) {
                return 8787
            }
            $pi = 0
            if (-not [int]::TryParse([string]$wp, [ref]$pi)) {
                continue
            }
            if ($pi -eq 0) {
                return 0
            }
            if ($pi -gt 0) {
                return $pi
            }
        } catch {
            continue
        }
    }
    return 8787
}

<#
  True when config enables Telegram webhook mode (non-empty webhookUrl on the channel or an account).
  Polling mode omits webhookUrl -> no local listener on webhookPort; ngrok must target the Gateway instead.
#>
function Test-OpenClawTelegramWebhookListenerExpected {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectDir
    )
    $candidates = @(
        (Join-Path $ProjectDir ".openclaw-desktop\openclaw.json"),
        (Join-Path $ProjectDir "openclaw.json")
    )
    foreach ($cfgPath in $candidates) {
        if (-not (Test-Path -LiteralPath $cfgPath)) { continue }
        try {
            $raw = Get-Content -LiteralPath $cfgPath -Raw -Encoding UTF8
            $j = $raw | ConvertFrom-Json
            $tg = $j.channels.telegram
            if ($null -eq $tg) {
                return $false
            }
            if ($tg.enabled -eq $false) {
                return $false
            }
            $wu = [string]$tg.webhookUrl
            if (-not [string]::IsNullOrWhiteSpace($wu)) {
                return $true
            }
            if ($null -ne $tg.accounts) {
                foreach ($prop in $tg.accounts.PSObject.Properties) {
                    $acc = $prop.Value
                    if ($null -eq $acc) { continue }
                    if ($acc.enabled -eq $false) { continue }
                    $awu = [string]$acc.webhookUrl
                    if (-not [string]::IsNullOrWhiteSpace($awu)) {
                        return $true
                    }
                }
            }
            return $false
        } catch {
            continue
        }
    }
    return $false
}

<#
  Resolves the ngrok upstream URL and local tunnel match port from NGROK_UPSTREAM_URL + openclaw.json.
  When .env points at the Telegram webhook bind port but Telegram is in polling mode (no webhookUrl),
  falls back to the Gateway loopback URL so launchers wait on / tunnel to a real listener.
#>
function Get-OpenClawNgrokUpstreamResolution {
    param(
        [AllowNull()]
        [string]$NgrokUpstreamCandidate,
        [int]$GatewayPort = 18789,
        [Parameter(Mandatory = $true)]
        [string]$ProjectDir
    )
    $result = @{
        Url                          = "http://127.0.0.1:$GatewayPort"
        TunnelPort                   = $GatewayPort
        AdjustedFromInvalidCandidate = $false
        AdjustedForTelegramPolling   = $false
    }
    if (-not (Test-OpenClawNgrokUpstreamCandidate -Candidate $NgrokUpstreamCandidate)) {
        $result.AdjustedFromInvalidCandidate = $true
        return $result
    }
    $trim = $NgrokUpstreamCandidate.Trim()
    try {
        $u = [Uri]$trim
        $telegramPort = Get-OpenClawTelegramWebhookListenPort -ProjectDir $ProjectDir
        if ($telegramPort -gt 0 -and $u.Port -eq $telegramPort) {
            if (-not (Test-OpenClawTelegramWebhookListenerExpected -ProjectDir $ProjectDir)) {
                $result.AdjustedForTelegramPolling = $true
                return $result
            }
        }
        $scheme = $u.Scheme.ToLowerInvariant()
        $port = $u.Port
        if (($scheme -eq "http" -and $port -eq 80) -or ($scheme -eq "https" -and $port -eq 443)) {
            $port = $GatewayPort
        }
        $result.Url = $trim
        $result.TunnelPort = $port
        return $result
    } catch {
        $result.AdjustedFromInvalidCandidate = $true
        return $result
    }
}

function Test-NgrokSyncTelegramWebhookOnly {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectDir,
        [int]$GatewayPort = 18789
    )
    $tunnelPort = Get-NgrokUpstreamTunnelMatchPort -GatewayPort $GatewayPort -ProjectDir $ProjectDir
    $telegramPort = Get-OpenClawTelegramWebhookListenPort -ProjectDir $ProjectDir
    if ($telegramPort -le 0) {
        return ($tunnelPort -eq 8787)
    }
    return ($tunnelPort -eq $telegramPort)
}

function Build-NgrokWebhookEnvValues {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PublicUrl,
        [Parameter(Mandatory = $true)]
        [string]$ProjectDir,
        [int]$GatewayPort = 18789
    )
    $telegramOnly = Test-NgrokSyncTelegramWebhookOnly -ProjectDir $ProjectDir -GatewayPort $GatewayPort
    if ($telegramOnly) {
        return @{
            OPENCLAW_PUBLIC_URL  = $PublicUrl
            TELEGRAM_WEBHOOK_URL = "$PublicUrl/telegram-webhook"
        }
    }
    return @{
        OPENCLAW_PUBLIC_URL   = $PublicUrl
        TELEGRAM_WEBHOOK_URL  = "$PublicUrl/telegram-webhook"
        LINE_WEBHOOK_URL      = "$PublicUrl/line/webhook"
    }
}

function Get-OrCreateGatewayToken {
    param(
        [Parameter(Mandatory = $true)]
        [string]$EnvFile
    )

    $envMap = Get-EnvMap -EnvFile $EnvFile
    $existing = [string]$envMap["OPENCLAW_GATEWAY_TOKEN"]
    if ($existing) {
        return $existing
    }

    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $token = [System.BitConverter]::ToString($bytes).Replace("-", "").ToLowerInvariant()

    Set-EnvValues -EnvFile $EnvFile -Values @{
        OPENCLAW_GATEWAY_TOKEN = $token
    }

    return $token
}

function Ensure-GatewayTokenInProcess {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectDir
    )

    if (-not [string]::IsNullOrWhiteSpace([string]$env:OPENCLAW_GATEWAY_TOKEN)) {
        return [string]$env:OPENCLAW_GATEWAY_TOKEN
    }

    $envFile = Ensure-ProjectEnvFile -ProjectDir $ProjectDir
    $token = Get-OrCreateGatewayToken -EnvFile $envFile
    $env:OPENCLAW_GATEWAY_TOKEN = $token
    return $token
}

function Apply-NgrokWebhookEnvToFiles {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectDir,
        [Parameter(Mandatory = $true)]
        [hashtable]$Values
    )
    $repoEnv = Get-ProjectEnvFile -ProjectDir $ProjectDir
    Set-EnvValues -EnvFile $repoEnv -Values $Values
    $stateRoot = [string]$env:OPENCLAW_STATE_DIR
    if ([string]::IsNullOrWhiteSpace($stateRoot)) {
        $stateRoot = Join-Path $ProjectDir ".openclaw-desktop"
    }
    $stateRoot = $stateRoot.Trim()
    $stateEnv = Join-Path $stateRoot ".env"
    $parent = Split-Path -Parent $stateEnv
    if (Test-Path -LiteralPath $parent) {
        if (-not (Test-Path -LiteralPath $stateEnv)) {
            New-Item -ItemType File -Path $stateEnv -Force | Out-Null
        }
        Set-EnvValues -EnvFile $stateEnv -Values $Values
    }
}

function Sync-NgrokPublicUrlToEnv {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectDir,
        [int]$MaxWaitSeconds = 8,
        [int]$PollMs = 1000,
        [int]$GatewayPort = 18789
    )

    $effectivePollMs = [Math]::Max(100, [int]$PollMs)
    $windowMs = [int]($MaxWaitSeconds * 1000)
    $attempts = [Math]::Max(1, [int]([Math]::Ceiling($windowMs / $effectivePollMs)))
    $publicUrl = $null

    for ($i = 0; $i -lt $attempts; $i++) {
        try {
            $resp = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 2
            if ($resp -and $resp.tunnels) {
                $httpTunnel = @($resp.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1)
                if (-not $httpTunnel) {
                    $httpTunnel = @($resp.tunnels | Where-Object { $_.proto -eq "http" } | Select-Object -First 1)
                }
                if ($httpTunnel -and $httpTunnel[0].public_url) {
                    $publicUrl = [string]$httpTunnel[0].public_url
                    break
                }
            }
        } catch {
            # ngrok may not be ready yet; retry quietly.
        }
        Start-Sleep -Milliseconds $PollMs
    }

    if ([string]::IsNullOrWhiteSpace($publicUrl)) {
        return $null
    }

    # Paths: LINE "/line/webhook"; Telegram listener "/telegram-webhook" (extensions/telegram).
    # When NGROK_UPSTREAM_URL targets the Telegram listener port, do not overwrite LINE_WEBHOOK_URL (that URL would hit the wrong service).
    $values = Build-NgrokWebhookEnvValues -PublicUrl $publicUrl -ProjectDir $ProjectDir -GatewayPort $GatewayPort
    Apply-NgrokWebhookEnvToFiles -ProjectDir $ProjectDir -Values $values
    foreach ($key in $values.Keys) {
        Set-Item -Path "Env:$key" -Value $values[$key]
    }
    return $publicUrl
}

<#
  Start-Process で起動した非対話 PowerShell には、対話シェルで PATH に載っている
  node / pnpm が無いことが多い。標準インストール先を PATH 先頭に足す。
#>
function Add-SovereignDevToolsToPath {
    $pf86 = ${env:ProgramFiles(x86)}
    $prefixes = @(
        "$env:ProgramFiles\nodejs",
        $(if ($pf86) { Join-Path $pf86 "nodejs" } else { $null }),
        "$env:APPDATA\npm",
        "$env:LOCALAPPDATA\pnpm",
        "$env:LOCALAPPDATA\Microsoft\WinGet\Links"
    )
    foreach ($p in $prefixes) {
        if (-not $p) { continue }
        if (-not (Test-Path $p)) { continue }
        if ($env:Path -notlike "*$p*") {
            $env:Path = "$p;$env:Path"
        }
    }
}

<#
  pnpm に依存せず Gateway/TUI を起動するための node.exe 絶対パス。
#>
function Resolve-NodeExecutable {
    Add-SovereignDevToolsToPath
    $fromCmd = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($fromCmd -and $fromCmd.Source -and (Test-Path $fromCmd.Source)) {
        return $fromCmd.Source
    }
    $pf86 = ${env:ProgramFiles(x86)}
    foreach ($name in @(
            "$env:ProgramFiles\nodejs\node.exe",
            $(if ($pf86) { Join-Path $pf86 "nodejs\node.exe" } else { $null })
        )) {
        if (-not $name) { continue }
        if (Test-Path $name) {
            return $name
        }
    }
    return $null
}

<#
 Merge .env, .env.local, then .openclaw-desktop\.env, then OPENCLAW_STATE_DIR\.env when different.
 Matches what operators expect: Telegram/LINE tokens in desktop bundle are applied to child processes.
 Node's loadDotEnv also reads OPENCLAW_STATE_DIR\.env but only after cwd\.env — empty keys in root .env can block; later files here override process env before node spawns.
#>
function Merge-OpenClawEnvToProcess {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectDir
    )

    $merged = Get-MergedEnvMap -ProjectDir $ProjectDir

    foreach ($key in $merged.Keys) {
        Set-Item -Path "Env:$key" -Value $merged[$key]
    }

    Repair-OpenClawProcessEnvNgrokUpstreamUrl
}

<#
  Repo-local desktop config: <repo>\.openclaw-desktop\openclaw.json
  Sets OPENCLAW_STATE_DIR to that folder when unset so doctor does not split ~/.openclaw vs repo state.

  Default: do not set OPENCLAW_CONFIG_PATH (repo / OpenClaw defaults). Set OPENCLAW_USE_REPO_LAUNCHER=0 in .env
  to opt into .openclaw-desktop paths (used by legacy Sovereign desktop sync).
#>
function Set-OpenClawDesktopConfigEnv {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectDir
    )
    if ([string]$env:OPENCLAW_USE_REPO_LAUNCHER -ne "0") {
        return
    }
    $cfg = Join-Path $ProjectDir ".openclaw-desktop\openclaw.json"
    if (-not (Test-Path -LiteralPath $cfg)) {
        return
    }
    $env:OPENCLAW_CONFIG_PATH = $cfg
    $stateRoot = Split-Path -Parent $cfg
    $existing = [string]$env:OPENCLAW_STATE_DIR
    if ([string]::IsNullOrWhiteSpace($existing)) {
        $env:OPENCLAW_STATE_DIR = $stateRoot
    }
}

<#
  Full path to the Hypura CLI binary (hypura.exe / hypura).
  Precedence: HAKUA_HYPURA_EXE, HYPURA_EXE (literal path must exist), then Get-Command hypura.exe / hypura.
#>
function Resolve-HypuraExecutablePath {
    foreach ($cand in @([string]$env:HAKUA_HYPURA_EXE, [string]$env:HYPURA_EXE)) {
        $t = $cand.Trim()
        if ($t -and (Test-Path -LiteralPath $t)) {
            return (Resolve-Path -LiteralPath $t).Path
        }
    }
    $cmd = Get-Command "hypura.exe" -ErrorAction SilentlyContinue
    if (-not $cmd) {
        $cmd = Get-Command "hypura" -ErrorAction SilentlyContinue
    }
    if ($cmd) {
        return [string]$cmd.Source
    }
    return $null
}
