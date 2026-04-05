$path = Join-Path $PSScriptRoot 'openclaw-desktop\Sovereign-Portal.ps1'
$err = $null
$tok = $null
[void][System.Management.Automation.Language.Parser]::ParseFile($path, [ref]$tok, [ref]$err)
if (-not $err -or $err.Count -eq 0) {
    Write-Output 'PARSE_OK'
    exit 0
}
foreach ($e in $err) {
    Write-Output "Line $($e.Extent.StartLineNumber) col $($e.Extent.StartColumnNumber): $($e.ErrorId) :: $($e.Message)"
    Write-Output "  Text: $($e.Extent.Text)"
}
exit 1
