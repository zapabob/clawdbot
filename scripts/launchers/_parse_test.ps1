$path = Join-Path $PSScriptRoot 'Sovereign-Portal.ps1'
$err = $null
$tok = $null
[void][System.Management.Automation.Language.Parser]::ParseFile($path, [ref]$tok, [ref]$err)
if ($err) {
    foreach ($e in $err) {
        Write-Output "Line $($e.Extent.StartLineNumber): $($e.ErrorId) :: $($e.Message)"
        Write-Output "  Text: $($e.Extent.Text)"
    }
    exit 1
}
Write-Output 'PARSE_OK'
