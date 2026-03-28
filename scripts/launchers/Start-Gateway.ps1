param(
    [int]$Port = 18789
)

$ErrorActionPreference = "Stop"
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
. "$PSScriptRoot\env-tools.ps1"

Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir
$cfg = Join-Path $ProjectDir ".openclaw-desktop\openclaw.json"
if (Test-Path $cfg) {
    $env:OPENCLAW_CONFIG_PATH = $cfg
}

Set-Location $ProjectDir
pnpm openclaw gateway --port $Port
