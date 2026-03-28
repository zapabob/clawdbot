$ErrorActionPreference = "Stop"
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
. "$PSScriptRoot\env-tools.ps1"
Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir

$HarnessDir = Join-Path $ProjectDir "extensions\hypura-harness\scripts"
$VenvPython = Join-Path $ProjectDir ".venv\Scripts\python.exe"
$Script = Join-Path $HarnessDir "harness_daemon.py"

if (-not (Test-Path $Script)) {
    throw "harness_daemon.py not found at $Script"
}

Set-Location $HarnessDir
if (Get-Command uv -ErrorAction SilentlyContinue) {
    uv run harness_daemon.py
} elseif (Test-Path $VenvPython) {
    & $VenvPython $Script
} else {
    py -3 $Script
}
