Write-Host "=== node.exe processes ===" -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
    $procId = $_.Id
    $cpu = [math]::Round($_.CPU, 1)
    $filter = "ProcessId = $procId"
    $cmd = (Get-CimInstance Win32_Process -Filter $filter -ErrorAction SilentlyContinue).CommandLine
    Write-Host ("PID={0} CPU={1} CMD={2}" -f $procId, $cpu, $cmd)
}
Write-Host "=== done ===" -ForegroundColor Cyan
