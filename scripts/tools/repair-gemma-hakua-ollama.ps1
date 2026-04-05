#Requires -Version 5.1
# Repair Ollama "unable to load model" / 500 blob errors for Gemma-Hakua-core (Windows).
# Run from repo root: powershell -ExecutionPolicy Bypass -File scripts/tools/repair-gemma-hakua-ollama.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = (Get-Item (Join-Path $PSScriptRoot "..\..")).FullName
$Modelfile = Join-Path $ProjectRoot "scripts\modelfiles\Modelfile_Gemma-Hakua-core"
$BaseModel = "hf.co/HauhauCS/Gemma-4-E4B-Uncensored-HauhauCS-Aggressive:Q4_K_M"
$Tag = "Gemma-Hakua-core"

$ollamaCmd = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollamaCmd) {
    throw "ollama not found on PATH. Install Ollama and reopen the terminal."
}
$ollamaExe = $ollamaCmd.Source

function Invoke-OllamaCli {
    param(
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )
    $p = Start-Process -FilePath $ollamaExe -ArgumentList $Arguments -Wait -PassThru -NoNewWindow
    return [int]$p.ExitCode
}

Write-Host "[1/4] Removing custom tag '$Tag' (if present)..." -ForegroundColor Cyan
$null = Invoke-OllamaCli -Arguments @("rm", $Tag)

Write-Host "[2/4] Pulling base model (re-downloads missing/corrupt layers)..." -ForegroundColor Cyan
$pullCode = Invoke-OllamaCli -Arguments @("pull", $BaseModel)
if ($pullCode -ne 0) {
    throw "ollama pull failed (exit $pullCode)."
}

Write-Host "[3/4] Sanity check: run base model once..." -ForegroundColor Cyan
$runCode = Invoke-OllamaCli -Arguments @("run", $BaseModel, "ping")
if ($runCode -ne 0) {
    throw "Base model still fails. Try: free disk space, exclude $env:USERPROFILE\.ollama from AV, update Ollama, reboot, then re-run this script."
}

Write-Host "[4/4] Recreate '$Tag' from Modelfile..." -ForegroundColor Cyan
$createCode = Invoke-OllamaCli -Arguments @("create", $Tag, "-f", $Modelfile)
if ($createCode -ne 0) {
    throw "ollama create failed (exit $createCode)."
}

Write-Host "Done. Test: ollama run $Tag `"一文で自己紹介して`"" -ForegroundColor Green
