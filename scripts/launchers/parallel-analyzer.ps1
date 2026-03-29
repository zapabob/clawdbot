param(
    [int]$MaxJobs = 12
)

$ErrorActionPreference = "Stop"
$ProjectRoot = (Get-Item $PSScriptRoot).Parent.Parent.FullName
Set-Location -LiteralPath $ProjectRoot

# --- [Discovery] ---
$Files = Get-ChildItem -Recurse -Filter *.ps1 | Where-Object { 
    $_.FullName -notmatch "node_modules|\.venv|\.git|\.artifacts"
}

if ($Files.Count -eq 0) {
    Write-Host "[PS1] No PowerShell files found to analyze." -ForegroundColor Gray
    exit 0
}

Write-Host ("[PS1] Analyzing {0} files with focus on 12-thread saturation..." -f $Files.Count) -ForegroundColor Cyan

# --- [Parallel Execution (Start-Job)] ---
$Jobs = @()
$PendingFiles = [System.Collections.Generic.Queue[string]]::new()
foreach ($f in $Files.FullName) { $PendingFiles.Enqueue($f) }

while ($PendingFiles.Count -gt 0 -or $Jobs.Count -gt 0) {
    # Replenish jobs up to $MaxJobs
    while ($Jobs.Count -lt $MaxJobs -and $PendingFiles.Count -gt 0) {
        $File = $PendingFiles.Dequeue()
        $Jobs += Start-Job -ScriptBlock {
            param($Path)
            if (-not (Get-Module -ListAvailable PSScriptAnalyzer)) { return "ERR:PSScriptAnalyzer missing" }
            return Invoke-ScriptAnalyzer -Path $Path -Severity Error, Warning
        } -ArgumentList $File
    }

    if ($Jobs.Count -gt 0) {
        # Blocking wait if we can't add more jobs, otherwise timeout wait
        $WaitTimeout = if ($PendingFiles.Count -gt 0) { 1 } else { -1 }
        $Finished = Wait-Job -Any -Timeout $WaitTimeout
        
        if ($Finished) {
            foreach ($j in $Finished) {
                $Output = Receive-Job -Job $j
                if ($Output) {
                    Write-Host "`n[PS1_FAIL] File: $($j.ChildJobs[0].JobParameters.ArgumentList[0])" -ForegroundColor Yellow
                    $Output | ForEach-Object {
                        Write-Host "  | $($_.Severity) ($($_.RuleName)): $($_.Message) [Line $($_.Line)]" -ForegroundColor Gray
                    }
                    $Global:HasErrors = $true
                }
                Remove-Job -Job $j
                $Jobs = $Jobs | Where-Object { $_.Id -ne $j.Id }
            }
        }
    }
}

if ($Global:HasErrors) {
    Write-Host "`n[PS1] Core Integrity Degraded. Fix PowerShell violations above." -ForegroundColor Red
    exit 1
} else {
    Write-Host "[PS1] Analysis Complete. Integrity Level 1 Checked." -ForegroundColor Green
    exit 0
}
