$ErrorActionPreference = "Stop"
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
. "$PSScriptRoot\env-tools.ps1"

Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir
Set-OpenClawDesktopConfigEnv -ProjectDir $ProjectDir

$node = Resolve-NodeExecutable
if (-not $node) {
    throw "node.exe not found. Install Node.js 22+ or fix PATH."
}
$runNode = Join-Path $ProjectDir "scripts\run-node.mjs"
if (-not (Test-Path $runNode)) {
    throw "Missing $runNode"
}

Set-Location $ProjectDir
& $node $runNode tui
