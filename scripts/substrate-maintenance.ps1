$ErrorActionPreference = "Continue"
Write-Host "--- ASI Substrate Neutralization Pulse (Temp) ---" -ForegroundColor Cyan

$tempPath = $env:TEMP
$limitGB = 5
$clearedBytes = 0

if (Test-Path $tempPath) {
    # Sort by LastAccessTime to remove oldest first
    $items = Get-ChildItem $tempPath -File -Recurse -ErrorAction SilentlyContinue | Sort-Object LastAccessTime
    
    foreach ($item in $items) {
        if ($clearedBytes -ge ($limitGB * 1GB)) { break }
        try {
            $size = $item.Length
            Remove-Item $item.FullName -Force -ErrorAction SilentlyContinue
            $clearedBytes += $size
        }
        catch {}
    }
}

Write-Host ("Reclaimed Temp Volume: {0:N2} GB" -f ($clearedBytes / 1GB)) -ForegroundColor Green

$cDrive = Get-PSDrive C
Write-Host ("Total Free Space on C: {0:N2} GB" -f ($cDrive.Free / 1GB)) -ForegroundColor Cyan
