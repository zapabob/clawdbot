param(
    [int]$Port = 18789
)

$ErrorActionPreference = "Stop"
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
. "$PSScriptRoot\env-tools.ps1"

function Write-DebugNdjson {
    param(
        [string]$HypothesisId,
        [string]$Location,
        [string]$Message,
        [hashtable]$Data = @{}
    )
    try {
        $entry = [ordered]@{
            sessionId    = "2f4832"
            runId        = "gateway-hang"
            hypothesisId = $HypothesisId
            location     = $Location
            message      = $Message
            data         = $Data
            timestamp    = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        } | ConvertTo-Json -Compress -Depth 5
        Add-Content -Path (Join-Path $ProjectDir "debug-2f4832.log") -Value $entry -Encoding UTF8
    } catch {
    }
}

Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir
Set-OpenClawDesktopConfigEnv -ProjectDir $ProjectDir

if ([string]$env:OPENCLAW_USE_REPO_LAUNCHER -eq "0") {
    $logDir = Join-Path $ProjectDir ".openclaw-desktop\logs"
} else {
    $logDir = Join-Path $ProjectDir "logs\launcher"
}

$node = Resolve-NodeExecutable
if (-not $node) {
    throw "node.exe not found. Install Node.js 22+ (e.g. under Program Files\nodejs) or fix PATH."
}
$runNode = Join-Path $ProjectDir "scripts\run-node.mjs"
if (-not (Test-Path $runNode)) {
    throw "Missing $runNode"
}

$distEntry = Join-Path $ProjectDir "dist\entry.js"
if (-not (Test-Path -LiteralPath $distEntry)) {
    Write-Host "[GW][WARN] dist\entry.js not found. From repo root: pnpm install && pnpm build" -ForegroundColor Yellow
}

# Set-Location だけでは Win32 実際の cwd が更新されない場合がある（PS5.1 既知問題）
# node.exe が正しい node_modules を見つけられるよう .NET レベルでも設定する
[System.IO.Directory]::SetCurrentDirectory($ProjectDir)
Set-Location $ProjectDir

if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$logFile = Join-Path $logDir ("gateway-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".log")
# Start-Transcript は子プロセス(node)の stdout/stderr を取りこぼし、かつネストした powershell.exe では失敗することがある。
# cmd 経由で node 出力をログへ追記（二重引用符内の >> は PS がリダイレクトと解釈するため -f で組み立てる）。
$startedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logHeader = @"
OpenClaw Gateway launcher log
Started: ${startedAt}
Project: $ProjectDir
node: $node
log: $logFile

"@
$logHeader | Out-File -FilePath $logFile -Encoding utf8
Write-Host "[GW] node: $node"
Write-Host "[GW] log: $logFile"
Write-Host "[GW] If gateway exits immediately, read that log file for errors." -ForegroundColor DarkGray
Write-Host "[GW] Node stdout/stderr are appended below the header in this file." -ForegroundColor DarkGray

"--- gateway process (stdout/stderr) ---" | Out-File -FilePath $logFile -Append -Encoding utf8

# pnpm は非対話子プロセスの PATH に無いことが多い。package.json の openclaw と同じ node 直起動。
# パイプ経由で起動すると Node (libuv) が line-buffered に切り替わり、ログがリアルタイムで出力される。
# cmd /c >> file 2>&1 だとフルバッファ（64KB）で、ハング時にログが空になる問題があった。
$env:FORCE_COLOR = "0"
$diagTs = Get-Date -Format "HH:mm:ss"
"[GW][DIAG] launching node at $diagTs port=$Port" | Out-File -FilePath $logFile -Append -Encoding utf8
Write-Host "[GW] Starting gateway at $diagTs ..." -ForegroundColor Cyan
Write-DebugNdjson -HypothesisId "H9" -Location "scripts/launchers/Start-Gateway.ps1:before-node" -Message "about to start node gateway command" -Data @{ port = $Port; node = $node; logFile = $logFile }

$nativePref = $false
if ($null -ne (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue)) {
    $nativePref = [bool]$PSNativeCommandUseErrorActionPreference
    $script:PSNativeCommandUseErrorActionPreference = $false
}

try {
    $stdoutTmp = Join-Path $logDir ("gateway-stdout-" + [guid]::NewGuid().ToString("N") + ".tmp")
    $stderrTmp = Join-Path $logDir ("gateway-stderr-" + [guid]::NewGuid().ToString("N") + ".tmp")
    $gatewayArgs = @($runNode, "gateway", "run", "--port", "$Port", "--bind", "loopback", "--force", "--allow-unconfigured")
    $proc = Start-Process -FilePath $node -ArgumentList $gatewayArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput $stdoutTmp -RedirectStandardError $stderrTmp
    if (Test-Path -LiteralPath $stdoutTmp) {
        Get-Content -LiteralPath $stdoutTmp -Raw | Out-File -FilePath $logFile -Append -Encoding utf8
    }
    if (Test-Path -LiteralPath $stderrTmp) {
        Get-Content -LiteralPath $stderrTmp -Raw | Out-File -FilePath $logFile -Append -Encoding utf8
    }
    $exitCode = $proc.ExitCode
} finally {
    if ($stdoutTmp -and (Test-Path -LiteralPath $stdoutTmp)) { Remove-Item -LiteralPath $stdoutTmp -Force -ErrorAction SilentlyContinue }
    if ($stderrTmp -and (Test-Path -LiteralPath $stderrTmp)) { Remove-Item -LiteralPath $stderrTmp -Force -ErrorAction SilentlyContinue }
    if ($null -ne (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue)) {
        $script:PSNativeCommandUseErrorActionPreference = $nativePref
    }
}

$exitCode = if ($null -ne $exitCode) { [int]$exitCode } else { $LASTEXITCODE }
Write-DebugNdjson -HypothesisId "H9" -Location "scripts/launchers/Start-Gateway.ps1:after-node" -Message "node gateway command finished" -Data @{ exitCode = $exitCode }

$diagTs = Get-Date -Format "HH:mm:ss"
"[GW][DIAG] node exited at $diagTs code=$exitCode" | Out-File -FilePath $logFile -Append -Encoding utf8

if ($exitCode -ne 0) {
    Write-Host "[GW][ERROR] Gateway exited with code $exitCode at $diagTs. Check: $logFile" -ForegroundColor Red
    Start-Sleep -Seconds 15
}
