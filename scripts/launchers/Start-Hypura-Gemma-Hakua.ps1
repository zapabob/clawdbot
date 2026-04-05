# Start Hypura 0.4.x inference (Ollama-compatible API on :8080) with the HauhauCS Gemma GGUF.
# Repo convention: binary is `hypura` / `hypura.exe` (product name Hypura; sometimes misread as "Hypna").
#
# Set one of:
#   HAKUA_HYPURA_GGUF=C:\path\to\Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-Q4_K_M.gguf
#   HYPURA_GGUF=... (alias)
# Optional:
#   HYPURA_CONTEXT=32768
#   HYPURA_PORT=8080
#   HAKUA_HYPURA_EXE=C:\path\to\hypura.exe   (or HYPURA_EXE; used when hypura is not on PATH)
#
param(
    [string]$ProjectDir = (Get-Item (Join-Path $PSScriptRoot "..\..")).FullName
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "env-tools.ps1")
Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir

$gguf = $null
foreach ($candidate in @([string]$env:HAKUA_HYPURA_GGUF, [string]$env:HYPURA_GGUF)) {
    $t = $candidate.Trim()
    if ($t -and (Test-Path -LiteralPath $t)) {
        $gguf = $t
        break
    }
}
if (-not $gguf) {
    throw @"
No GGUF path found. Set in .env (merged by env-tools):

  HAKUA_HYPURA_GGUF=C:\full\path\to\your-model.gguf

Then re-run: powershell -File scripts\launchers\Start-Hypura-Gemma-Hakua.ps1
"@
}

$hypuraExe = Resolve-HypuraExecutablePath
if (-not $hypuraExe) {
    throw @"
hypura executable not found. Set in .env:

  HAKUA_HYPURA_EXE=C:\full\path\to\hypura.exe

(or add hypura to PATH), then re-run this script.
"@
}

$port = [string]$env:HYPURA_PORT
if ([string]::IsNullOrWhiteSpace($port)) { $port = "8080" }
$ctx = [string]$env:HYPURA_CONTEXT
if ([string]::IsNullOrWhiteSpace($ctx)) { $ctx = "32768" }

Write-Host "[Hypura] GGUF: $gguf" -ForegroundColor Cyan
Write-Host "[Hypura] hypura serve <GGUF> --port $port --context $ctx  (positional model path; see t8/hypura README)" -ForegroundColor Gray

& $hypuraExe serve $gguf --port $port --context $ctx
