$setupTasksPs1 = "x"
if (Test-Path $setupTasksPs1) {
    try {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $setupTasksPs1 2>$null
    } catch {
        Write-Host "  [WARN] Task registration failed (need admin?): $_" -ForegroundColor Yellow
    }
}
