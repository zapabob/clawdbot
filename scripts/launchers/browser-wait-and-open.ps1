# Waits for Gateway TCP listen, then opens the URL (used by launch-desktop-stack with injected env).
param(
    [int]$GatewayPort = 18789,
    [Parameter(Mandatory = $true)]
    [string]$Url
)

$ErrorActionPreference = "Stop"
$deadline = [DateTime]::Now.AddSeconds(45)
while ([DateTime]::Now -lt $deadline) {
    try {
        $res = Invoke-WebRequest -Uri "$Url/healthz" -UseBasicParsing -TimeoutSec 2
        if ($res.StatusCode -ge 200 -and $res.StatusCode -lt 500) {
            break
        }
    } catch {
        try {
            $res = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
            if ($res.StatusCode -ge 200 -and $res.StatusCode -lt 500) {
                break
            }
        } catch {
            # Gateway can bind before the HTTP/event loop is responsive.
        }
    }
    $conn = Get-NetTCPConnection -LocalPort $GatewayPort -State Listen -ErrorAction SilentlyContinue
    if ($conn -and [DateTime]::Now -ge $deadline.AddSeconds(-5)) {
        break
    }
    Start-Sleep -Milliseconds 800
}
Start-Process $Url
