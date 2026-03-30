param(
    [switch]$All
)

$ErrorActionPreference = "SilentlyContinue"
$ProjectDir = (Get-Item $PSScriptRoot).Parent.FullName
$killed = 0

# 1. node プロセスを kill (-All: 全 node.exe / デフォルト: openclaw/run-node のみ)
Get-Process -Name "node" | ForEach-Object {
    $procId = $_.Id
    if ($All) {
        Write-Host ("Kill PID {0}" -f $procId)
        Stop-Process -Id $procId -Force
        $killed++
    } else {
        $filter = "ProcessId = $procId"
        $wmi = Get-CimInstance Win32_Process -Filter $filter
        if ($wmi -and ($wmi.CommandLine -match "openclaw\.mjs|run-node\.mjs")) {
            Write-Host ("Kill PID {0}" -f $procId)
            Stop-Process -Id $procId -Force
            $killed++
        }
    }
}

Write-Host ("Killed {0} processes. Waiting for file handles to release..." -f $killed)
Start-Sleep -Seconds 3

# 2. dist/extensions/*/node_modules を削除（EPERM rename 回避）
$distExtDir = Join-Path $ProjectDir "dist\extensions"
if (Test-Path $distExtDir) {
    Write-Host "Removing dist/extensions/*/node_modules (EPERM guard)..."
    Get-ChildItem $distExtDir -Directory | ForEach-Object {
        $nmDir = Join-Path $_.FullName "node_modules"
        if (Test-Path $nmDir) {
            Write-Host ("  Removing: {0}" -f $nmDir)
            Remove-Item $nmDir -Recurse -Force
        }
        # 残留 .runtime-deps-* 一時ディレクトリも削除
        Get-ChildItem $_.FullName -Directory -Filter ".runtime-deps-*" | ForEach-Object {
            Write-Host ("  Removing temp: {0}" -f $_.FullName)
            Remove-Item $_.FullName -Recurse -Force
        }
    }
}

Write-Host "Done. Run: pnpm dev build"
