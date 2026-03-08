param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$PassthroughArgs
)

$ErrorActionPreference = "Stop"
$ProjectDir = (Get-Item $PSScriptRoot).Parent.FullName
$LauncherPs1 = Join-Path $ProjectDir "scripts\launchers\launch-desktop-stack.ps1"

& powershell.exe -ExecutionPolicy Bypass -File $LauncherPs1 @PassthroughArgs
