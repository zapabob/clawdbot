$ErrorActionPreference = "Stop"
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
. "$PSScriptRoot\env-tools.ps1"

Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir
Set-OpenClawDesktopConfigEnv -ProjectDir $ProjectDir
Ensure-GatewayTokenInProcess -ProjectDir $ProjectDir | Out-Null
[void](Sync-NgrokPublicUrlToEnv -ProjectDir $ProjectDir -MaxWaitSeconds 2 -PollMs 750)

if ([string]$env:OPENCLAW_USE_REPO_LAUNCHER -eq "0") {
    $logDir = Join-Path $ProjectDir ".openclaw-desktop\logs"
} else {
    $logDir = Join-Path $ProjectDir "logs\launcher"
}

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
