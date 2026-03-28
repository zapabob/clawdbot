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

# Set-Location だけでは Win32 実際の cwd が更新されない場合がある（PS5.1 既知問題）
# node.exe が正しい node_modules を見つけられるよう .NET レベルでも設定する
[System.IO.Directory]::SetCurrentDirectory($ProjectDir)
Set-Location $ProjectDir

$logDir = Join-Path $ProjectDir ".openclaw-desktop\logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$logFile = Join-Path $logDir ("gateway-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".log")
Start-Transcript -Path $logFile -Append | Out-Null
Write-Host "[GW] node: $node"
Write-Host "[GW] log: $logFile"

# pnpm は非対話子プロセスの PATH に無いことが多い。package.json の openclaw と同じ node 直起動。
& $node $runNode gateway run --port $Port --bind loopback --force --allow-unconfigured
$exitCode = $LASTEXITCODE
Stop-Transcript | Out-Null

if ($exitCode -ne 0) {
    Write-Host "[GW][ERROR] Gateway exited with code $exitCode. Check: $logFile" -ForegroundColor Red
    Start-Sleep -Seconds 15
}
