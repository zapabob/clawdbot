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

function Sync-NgrokPublicUrlToEnv {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectDir,
        [int]$MaxWaitSeconds = 8,
        [int]$PollMs = 1000
    )

    $envFile = Ensure-ProjectEnvFile -ProjectDir $ProjectDir
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

    $values = @{
        OPENCLAW_PUBLIC_URL   = $publicUrl
        TELEGRAM_WEBHOOK_URL  = "$publicUrl/hooks/telegram"
        LINE_WEBHOOK_URL      = "$publicUrl/hooks/line"
    }
    Set-EnvValues -EnvFile $envFile -Values $values
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
 Merge .env then .env.local (later wins). Applies each KEY to the current process only.
 Secrets stay in files; do not commit .env.local.
#>
function Merge-OpenClawEnvToProcess {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectDir
    )

    $merged = @{}
    foreach ($rel in @(".env", ".env.local")) {
        $path = Join-Path $ProjectDir $rel
        if (-not (Test-Path $path)) {
            continue
        }
        $map = Get-EnvMap -EnvFile $path
        foreach ($key in $map.Keys) {
            $merged[$key] = $map[$key]
        }
    }

    foreach ($key in $merged.Keys) {
        Set-Item -Path "Env:$key" -Value $merged[$key]
    }
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
