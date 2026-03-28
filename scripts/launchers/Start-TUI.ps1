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

[System.IO.Directory]::SetCurrentDirectory($ProjectDir)
Set-Location $ProjectDir

$logDir = Join-Path $ProjectDir ".openclaw-desktop\logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$logFile = Join-Path $logDir ("tui-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".log")
Start-Transcript -Path $logFile -Append | Out-Null
Write-Host "[TUI] node: $node"
Write-Host "[TUI] log: $logFile"

& $node $runNode tui
$exitCode = $LASTEXITCODE
Stop-Transcript | Out-Null

if ($exitCode -ne 0) {
    Write-Host "[TUI][ERROR] TUI exited with code $exitCode. Check: $logFile" -ForegroundColor Red
    Start-Sleep -Seconds 10
}
