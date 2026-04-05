param(
    [string]$ProjectDir = (Split-Path $PSScriptRoot -Parent | Split-Path -Parent),
    [int]$GatewayPort = 18789,
    [switch]$WhatIf
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\env-tools.ps1"

$replacement = "http://127.0.0.1:$GatewayPort"
$targets = @(
    (Join-Path $ProjectDir ".env"),
    (Join-Path $ProjectDir ".env.local"),
    (Join-Path $ProjectDir ".openclaw-desktop\.env")
)

function Repair-SingleEnvFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$NewUpstream,
        [bool]$DryRun
    )
    if (-not (Test-Path -LiteralPath $Path)) {
        return $false
    }
    $lines = @(Get-Content -LiteralPath $Path -Encoding UTF8)
    $out = New-Object System.Collections.Generic.List[string]
    $changed = $false
    foreach ($line in $lines) {
        if ($line -match '^\s*NGROK_UPSTREAM_URL=') {
            $rawVal = ""
            if ($line -match '^\s*NGROK_UPSTREAM_URL=(.*)$') {
                $rawVal = ConvertFrom-EnvValue -Value $Matches[1]
            }
            if ($rawVal -and -not (Test-OpenClawNgrokUpstreamCandidate -Candidate $rawVal)) {
                $out.Add("# NGROK_UPSTREAM_URL was invalid ($rawVal); repaired $(Get-Date -Format o)")
                $out.Add("NGROK_UPSTREAM_URL=$NewUpstream")
                $changed = $true
                continue
            }
        }
        $out.Add($line)
    }
    if (-not $changed) {
        return $false
    }
    if ($DryRun) {
        Write-Host "[repair-ngrok] WhatIf: would update $Path" -ForegroundColor Cyan
        return $true
    }
    Set-Content -LiteralPath $Path -Value $out -Encoding UTF8
    Write-Host "[repair-ngrok] Updated $Path" -ForegroundColor Green
    return $true
}

$any = $false
foreach ($p in $targets) {
    if (Repair-SingleEnvFile -Path $p -NewUpstream $replacement -DryRun:$WhatIf) {
        $any = $true
    }
}
if (-not $any) {
    Write-Host "[repair-ngrok] No invalid NGROK_UPSTREAM_URL lines found (or files missing)." -ForegroundColor DarkGray
}
