$ErrorActionPreference = "Stop"
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
. "$PSScriptRoot\env-tools.ps1"
Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir

# --- [Model Sync] openclaw.json → harness.config.json ---
$openclawCfgPath  = Join-Path $ProjectDir ".openclaw-desktop\openclaw.json"
$harnessCfgPath   = Join-Path $ProjectDir "extensions\hypura-harness\config\harness.config.json"
if ((Test-Path $openclawCfgPath) -and (Test-Path $harnessCfgPath)) {
    try {
        $oc   = Get-Content $openclawCfgPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $hc   = Get-Content $harnessCfgPath  -Raw -Encoding UTF8 | ConvertFrom-Json

        $primary   = $oc.agents.defaults.model.primary
        $fallbacks = $oc.agents.defaults.model.fallbacks   # array
        $lite      = if ($fallbacks -and $fallbacks.Count -gt 0) { $fallbacks[-1] } else { $null }

        if ($primary) {
            $hc.models.primary = $primary
            Write-Host "  [MODEL] primary  <- $primary" -ForegroundColor DarkCyan
        }
        if ($lite) {
            # sub は provider prefix なしの場合が多いのでそのまま保持
            $hc.models.sub = $lite
            Write-Host "  [MODEL] sub/lite <- $lite" -ForegroundColor DarkCyan
        }
        if ($fallbacks -and $fallbacks.Count -gt 0) {
            # codex_fallbacks: ollama/ 以外のプロバイダーだけ抽出
            $nonOllama = @($fallbacks | Where-Object { $_ -notmatch '^ollama/' })
            if ($nonOllama.Count -gt 0) {
                $hc.models.codex_fallbacks = $nonOllama
                Write-Host "  [MODEL] codex_fallbacks <- $($nonOllama -join ', ')" -ForegroundColor DarkCyan
            }
        }

        $hc | ConvertTo-Json -Depth 10 | Set-Content $harnessCfgPath -Encoding UTF8
        Write-Host "  [MODEL] harness.config.json synced from openclaw.json" -ForegroundColor Green
    } catch {
        Write-Host "  [WARN] Model sync failed: $_" -ForegroundColor Yellow
    }
}

$HarnessDir = Join-Path $ProjectDir "extensions\hypura-harness\scripts"
$VenvPython = Join-Path $ProjectDir ".venv\Scripts\python.exe"
$Script = Join-Path $HarnessDir "harness_daemon.py"

if (-not (Test-Path $Script)) {
    throw "harness_daemon.py not found at $Script"
}

[System.IO.Directory]::SetCurrentDirectory($HarnessDir)
Set-Location $HarnessDir
if (Get-Command uv -ErrorAction SilentlyContinue) {
    uv run --project $ProjectDir harness_daemon.py
} elseif (Test-Path $VenvPython) {
    & $VenvPython $Script
} else {
    py -3 $Script
}
