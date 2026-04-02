# Waits for Gateway TCP listen, then opens the URL (used by launch-desktop-stack with injected env).
param(
    [int]$GatewayPort = 18789,
    [Parameter(Mandatory = $true)]
    [string]$Url
)

$ErrorActionPreference = "Stop"
$deadline = [DateTime]::Now.AddSeconds(45)
while ([DateTime]::Now -lt $deadline) {
    $conn = Get-NetTCPConnection -LocalPort $GatewayPort -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        break
    }
    Start-Sleep -Milliseconds 800
}
Start-Process $Url
