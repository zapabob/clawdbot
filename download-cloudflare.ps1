$url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
$out = ".tunnel\cloudflared.exe"

try {
    Invoke-WebRequest -Uri $url -OutFile $out -TimeoutSec 60
    if (Test-Path $out) {
        Write-Host "SUCCESS: Cloudflared downloaded"
        Write-Host "Path: $out"
    } else {
        Write-Host "ERROR: Download failed"
    }
} catch {
    Write-Host "ERROR: $_"
}
