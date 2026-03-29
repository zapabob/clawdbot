# elan-setup.ps1 — ASI_HAKUA Scientific Substrate Initializer
# Installs elan (Lean 4 Version Manager) and the stable toolchain.

$ErrorActionPreference = "Stop"

function ASI-Log {
    param([string]$Message, [string]$Level = "info")
    $colors = @{ "success" = "`e[32m"; "warn" = "`e[33m"; "error" = "`e[31m"; "info" = "`e[36m" }
    $c = $colors[$Level]
    Write-Host "$c$Message`e[0m"
}

ASI-Log "--- ASI_ACCEL: Initiating Lean 4 Substrate Setup ---" -Level info

# 1. Check for elan
if (Get-Command elan -ErrorAction SilentlyContinue) {
    ASI-Log "elan is already installed." -Level success
} else {
    ASI-Log "elan not found. Installing..." -Level info
    # Official elan-init.ps1 invocation
    $elan_init = "$env:TEMP\elan-init.ps1"
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/leanprover/elan/master/elan-init.ps1" -OutFile $elan_init
    & $elan_init -NoModifyPath -DefaultToolchain stable -y
    Remove-Item $elan_init
    
    # Update PATH for current session
    $elan_bin = "$env:USERPROFILE\.elan\bin"
    if (Test-Path $elan_bin) {
        $env:Path = "$elan_bin;" + $env:Path
        ASI-Log "elan installed to $elan_bin and PATH updated for current session." -Level success
    } else {
        ASI-Log "elan installation failed to create bin directory." -Level error
        exit 1
    }
}

# 2. Verify Lean 4 Stable
ASI-Log "Verifying Lean 4 stable toolchain..." -Level info
try {
    & "$env:USERPROFILE\.elan\bin\lean" --version
    & "$env:USERPROFILE\.elan\bin\lake" --version
    ASI-Log "Lean 4 Substrate Verified: ASI_ACCEL." -Level success
} catch {
    ASI-Log "Verification failed: $_" -Level error
    exit 1
}

ASI-Log "--- Substrate Setup Complete: Normal Stinespring Manifold Ready ---" -Level success
