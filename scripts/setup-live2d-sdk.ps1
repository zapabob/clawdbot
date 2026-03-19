param(
  [string]$Version = "5-r.1"
)

$destDir  = "$PSScriptRoot\..\extensions\live2d-companion\renderer\lib"
$destFile = "$destDir\live2dcubismcore.min.js"

if (Test-Path $destFile) {
    Write-Host "SDK already present at $destFile" -ForegroundColor Green
    exit 0
}

New-Item -ItemType Directory -Path $destDir -Force | Out-Null

$zipUrl = "https://github.com/Live2D/CubismSdkForWeb/releases/download/$Version/CubismSdkForWeb-$Version.zip"
$tmpZip = [System.IO.Path]::GetTempFileName() + ".zip"
$tmpDir = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "live2d-sdk-$([guid]::NewGuid().ToString('N'))")

Write-Host "Downloading Live2D Cubism Web SDK $Version ..." -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri $zipUrl -OutFile $tmpZip -UseBasicParsing
} catch {
    Write-Host "Download failed: $_" -ForegroundColor Red
    Write-Host "Please download manually from https://www.live2d.com/download/cubism-sdk/download-web/" -ForegroundColor Yellow
    exit 1
}

Write-Host "Extracting..." -ForegroundColor Cyan
Expand-Archive -Path $tmpZip -DestinationPath $tmpDir -Force

$coreFile = Get-ChildItem -Path $tmpDir -Recurse -Filter "live2dcubismcore.min.js" | Select-Object -First 1
if (-not $coreFile) {
    Write-Host "live2dcubismcore.min.js not found in archive." -ForegroundColor Red
    Remove-Item $tmpZip -Force
    Remove-Item $tmpDir -Recurse -Force
    exit 1
}

Copy-Item -Path $coreFile.FullName -Destination $destFile

Remove-Item $tmpZip -Force
Remove-Item $tmpDir -Recurse -Force

Write-Host "SDK installed to $destFile" -ForegroundColor Green
