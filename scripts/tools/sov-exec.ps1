param(
    [Parameter(Mandatory=$true)]
    [string]$Tool,
    [string]$ToolArgs = "{}"
)

# Sovereign Executive (sov-exec.ps1)
# High-speed tool manifestation bridge for Antigravity-IDE integration.

$SubstrateProfile = "desktop-stack"

# --- [Header (Optional/Stealth)] ---
# chcp 65001 | Out-Null (Assume already set by Portal)

function Submit-SovereignTool {
    param($t, $a)
    $cmd = "pnpm openclaw tool call $t --args '$a' --profile $SubstrateProfile"
    Write-Host "  [SOV_EXEC] Calling $t..." -ForegroundColor DarkGray
    Invoke-Expression $cmd
}

try {
    Submit-SovereignTool -t $Tool -a $ToolArgs
} catch {
    Write-Host "  [FATAL] Sovereign Execution Failure: $_" -ForegroundColor Red
    exit 1
}
