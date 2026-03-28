param(
    [int]$Port = 18789
)

$ErrorActionPreference = "Stop"
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
. "$PSScriptRoot\env-tools.ps1"

Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir
Set-OpenClawDesktopConfigEnv -ProjectDir $ProjectDir

$node = Resolve-NodeExecutable
if (-not $node) {
    throw "node.exe not found. Install Node.js 22+ (e.g. under Program Files\nodejs) or fix PATH."
}
$runNode = Join-Path $ProjectDir "scripts\run-node.mjs"
if (-not (Test-Path $runNode)) {
    throw "Missing $runNode"
}

Set-Location $ProjectDir
# pnpm は非対話子プロセスの PATH に無いことが多い。package.json の openclaw と同じ node 直起動。
& $node $runNode gateway run --port $Port --bind loopback
