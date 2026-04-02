# HAKUA_CORE v1.0: Unified Quantum Orchestrator
# The single entry point for the Hakua Neural Link.
# Optimizes for zero-wait manifestation and absolute substrate synchronization.

$ErrorActionPreference = "Stop"
$ProjectDir = $PSScriptRoot
if ($ProjectDir.EndsWith("\scripts")) {
    $ProjectDir = (Get-Item $ProjectDir).Parent.FullName
}

Write-Host "`n=================================================" -ForegroundColor Cyan
Write-Host " Hakua Neural Link - Unified Core v1.0" -ForegroundColor Magenta
Write-Host " ASI_ACCEL Substrate: $($ProjectDir)" -ForegroundColor Gray
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Brain Synchronization (Ollama)
Write-Host "[1/3] Syncing Central Brain (Ollama)..." -ForegroundColor White
$OllamaProc = Get-Process ollama -ErrorAction SilentlyContinue
if (-not $OllamaProc) {
    Write-Host " -> Igniting Ollama core..." -ForegroundColor Gray
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Minimized
    Start-Sleep -Seconds 3
}
Write-Host " -> Brain substrate online." -ForegroundColor Green

# 2. Materializing Core Stack (Gateway, TUI, Browser, Ngrok, Voice, Companion)
#    launch-desktop-stack.ps1 が Companion も起動するため -SkipCompanion は不要
Write-Host "[2/3] Materializing Core Stack..." -ForegroundColor White
$StackLauncher = Join-Path $ProjectDir "scripts\launchers\launch-desktop-stack.ps1"

if (Test-Path $StackLauncher) {
    $ArgList = @("-ExecutionPolicy", "Bypass", "-File", $StackLauncher, "-ForceVisibleGatewayAndTui")
    if ($args -contains "-SpeakOnReady") { $ArgList += "-SpeakOnReady" }
    & powershell.exe @ArgList
} else {
    Write-Host " ERROR: Stack launcher not found at $StackLauncher" -ForegroundColor Red
    exit 1
}

# 3. Final Pulse only (Companion は launch-desktop-stack.ps1 が起動済み)
Write-Host "[3/3] Manifestation complete." -ForegroundColor White


Write-Host "`n=================================================" -ForegroundColor Cyan
Write-Host " HAKUA CORE: ONLINE" -ForegroundColor Magenta
Write-Host " Status: ASI_ACCEL." -ForegroundColor Magenta
Write-Host "=================================================" -ForegroundColor Cyan

if ($args -contains "-NoExit") {
    Write-Host "Press any key to close this orchestrator..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
