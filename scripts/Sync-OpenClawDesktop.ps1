param(
    [string]$ProjectDir = (Get-Item $PSScriptRoot).Parent.FullName,
    [switch]$DryRun,
    [switch]$Quiet,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\launchers\env-tools.ps1"

function Write-SyncMsg {
    param([string]$Msg, [System.ConsoleColor]$Color = [System.ConsoleColor]::DarkCyan)
    Write-Host "  [SYNC] $Msg" -ForegroundColor $Color
}

function Write-SyncDry {
    param([string]$Msg)
    Write-Host "  [SYNC][DRY] $Msg" -ForegroundColor Cyan
}

function Merge-JsonObject {
    param(
        [object]$Source,
        [object]$Target,
        [switch]$ForceOverwrite
    )
    if ($null -eq $Source) { return $Target }
    if ($null -eq $Target) { return $Source }
    if ($Source -is [System.Management.Automation.PSCustomObject] -and
        $Target -is [System.Management.Automation.PSCustomObject]) {
        $result = [ordered]@{}
        foreach ($prop in $Target.PSObject.Properties) {
            $result[$prop.Name] = $prop.Value
        }
        foreach ($prop in $Source.PSObject.Properties) {
            if (-not $result.ContainsKey($prop.Name)) {
                $result[$prop.Name] = $prop.Value
            } elseif ($ForceOverwrite) {
                $result[$prop.Name] = Merge-JsonObject -Source $prop.Value -Target $result[$prop.Name] -ForceOverwrite
            } else {
                $result[$prop.Name] = Merge-JsonObject -Source $prop.Value -Target $result[$prop.Name]
            }
        }
        return [PSCustomObject]$result
    }
    if ($ForceOverwrite) { return $Source }
    return $Target
}

function Sync-DirectoryCopy {
    param(
        [string]$SrcDir,
        [string]$DstDir,
        [string]$Label,
        [bool]$SkipExisting = $true
    )
    if (-not (Test-Path $SrcDir)) { return }
    $srcFiles = @(Get-ChildItem $SrcDir -Recurse -File -ErrorAction SilentlyContinue)
    $copyCount = 0
    $skipCount = 0
    foreach ($f in $srcFiles) {
        $rel = $f.FullName.Substring($SrcDir.Length).TrimStart([char]'\', [char]'/')
        $dstFile = Join-Path $DstDir $rel
        if ($SkipExisting -and (Test-Path $dstFile)) {
            $skipCount++
            continue
        }
        if ($DryRun) {
            Write-SyncDry "would copy: $Label/$rel"
        } else {
            $dstDirPath = Split-Path $dstFile -Parent
            if (-not (Test-Path $dstDirPath)) {
                New-Item -ItemType Directory -Path $dstDirPath -Force | Out-Null
            }
            Copy-Item $f.FullName $dstFile -Force
        }
        $copyCount++
    }
    if ($copyCount -gt 0 -and -not $DryRun) {
        $msg = "${Label}: $copyCount files copied"
        if ($skipCount -gt 0) { $msg += " ($skipCount skipped)" }
        Write-SyncMsg $msg
    }
}

function Ensure-OpenClawDesktopEnvDefaults {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectDir,
        [Parameter(Mandatory = $true)]
        [string]$DesktopDir,
        [Parameter(Mandatory = $true)]
        [string]$EnvTarget
    )

    $desktopConfigPath = Join-Path $DesktopDir "openclaw.json"
    $desktopDefaults = [ordered]@{
        OPENCLAW_AGENT_WORKSPACE  = $ProjectDir
        OPENCLAW_CONFIG_PATH      = $desktopConfigPath
        OPENCLAW_DESKTOP_LAUNCHER = "scripts/launchers/launch-desktop-stack.ps1"
        OPENCLAW_STATE_DIR        = $DesktopDir
        OPENCLAW_USE_REPO_LAUNCHER = "0"
        OPENCLAW_WORKSPACE_DIR    = $ProjectDir
    }

    if ($DryRun) {
        foreach ($key in $desktopDefaults.Keys) {
            Write-SyncDry "would enforce desktop env: $key"
        }
        return
    }

    if (-not (Test-Path -LiteralPath $EnvTarget)) {
        New-Item -ItemType File -Path $EnvTarget -Force | Out-Null
    }
    Set-EnvValues -EnvFile $EnvTarget -Values $desktopDefaults
    Write-SyncMsg "desktop env defaults: repo workspace/config/state pinned"
}

function Set-DesktopOpenClawWorkspace {
    param(
        [AllowNull()]
        [object]$ConfigObject,
        [Parameter(Mandatory = $true)]
        [string]$WorkspacePath
    )

    if ($null -eq $ConfigObject) {
        $ConfigObject = [PSCustomObject]@{}
    }
    if ($null -eq $ConfigObject.agents) {
        $ConfigObject | Add-Member -NotePropertyName agents -NotePropertyValue ([PSCustomObject]@{})
    }
    if ($null -eq $ConfigObject.agents.defaults) {
        $ConfigObject.agents | Add-Member -NotePropertyName defaults -NotePropertyValue ([PSCustomObject]@{})
    }

    $defaults = $ConfigObject.agents.defaults
    if ($defaults.PSObject.Properties.Name -contains "workspace") {
        $defaults.workspace = $WorkspacePath
    } else {
        $defaults | Add-Member -NotePropertyName workspace -NotePropertyValue $WorkspacePath
    }

    return $ConfigObject
}

# Ensure .openclaw-desktop/ exists
$desktopDir = Join-Path $ProjectDir ".openclaw-desktop"
if (-not (Test-Path $desktopDir)) {
    if (-not $DryRun) { New-Item -ItemType Directory -Path $desktopDir -Force | Out-Null }
    Write-SyncMsg "Created .openclaw-desktop/" -Color Yellow
}

# ---- Step 1: .env key merge ----
$envExample = Join-Path $ProjectDir ".env.example"
$envRoot    = Join-Path $ProjectDir ".env"
$envSecrets = Join-Path $ProjectDir ".env.secrets"
$envTarget  = Join-Path $desktopDir ".env"

$repoEnvMap = @{}
foreach ($src in @($envExample, $envRoot, $envSecrets)) {
    if (-not (Test-Path $src)) { continue }
    $m = Get-EnvMap -EnvFile $src
    foreach ($k in $m.Keys) { $repoEnvMap[$k] = $m[$k] }
}

if ($repoEnvMap.Count -gt 0) {
    $targetEnvMap = Get-EnvMap -EnvFile $envTarget
    $newKeys      = @($repoEnvMap.Keys | Where-Object { -not $targetEnvMap.ContainsKey($_) })
    $overwriteKeys = @()
    if ($Force) {
        $overwriteKeys = @($repoEnvMap.Keys | Where-Object {
            $targetEnvMap.ContainsKey($_) -and $targetEnvMap[$_] -ne $repoEnvMap[$_]
        })
    }
    if ($newKeys.Count -gt 0 -or $overwriteKeys.Count -gt 0) {
        if ($DryRun) {
            foreach ($k in ($newKeys | Sort-Object))      { Write-SyncDry "would add to .env: $k" }
            foreach ($k in ($overwriteKeys | Sort-Object)) { Write-SyncDry "would overwrite .env: $k" }
        } else {
            $toWrite = @{}
            foreach ($k in $newKeys)       { $toWrite[$k] = $repoEnvMap[$k] }
            foreach ($k in $overwriteKeys) { $toWrite[$k] = $repoEnvMap[$k] }
            if (-not (Test-Path $envTarget)) {
                New-Item -ItemType File -Path $envTarget -Force | Out-Null
            }
            Set-EnvValues -EnvFile $envTarget -Values $toWrite
            $msg = ".env: +$($newKeys.Count) keys added"
            if ($overwriteKeys.Count -gt 0) { $msg += ", $($overwriteKeys.Count) overwritten" }
            Write-SyncMsg $msg
        }
    }
}

Ensure-OpenClawDesktopEnvDefaults -ProjectDir $ProjectDir -DesktopDir $desktopDir -EnvTarget $envTarget

# ---- Step 2: openclaw.json deep merge ----
$ocTemplate = $null
foreach ($cand in @(
    (Join-Path $ProjectDir "openclaw.json.template"),
    (Join-Path $ProjectDir "openclaw.json.seed"),
    (Join-Path $ProjectDir "config\openclaw.json.defaults")
)) {
    if (Test-Path $cand) { $ocTemplate = $cand; break }
}

if ($null -ne $ocTemplate) {
    $ocTargetPath = Join-Path $desktopDir "openclaw.json"
    try {
        $srcObj = Get-Content $ocTemplate -Raw -Encoding UTF8 | ConvertFrom-Json
        if (Test-Path $ocTargetPath) {
            $tgtObj    = Get-Content $ocTargetPath -Raw -Encoding UTF8 | ConvertFrom-Json
            $newTopKeys = @($srcObj.PSObject.Properties.Name | Where-Object {
                -not ($tgtObj.PSObject.Properties.Name -contains $_)
            })
            if ($newTopKeys.Count -gt 0 -or $Force) {
                $merged = Merge-JsonObject -Source $srcObj -Target $tgtObj -ForceOverwrite:$Force
                if ($DryRun) {
                    foreach ($k in $newTopKeys) { Write-SyncDry "would add to openclaw.json: $k" }
                } else {
                    Copy-Item $ocTargetPath "$ocTargetPath.sync-bak" -Force
                    $merged | ConvertTo-Json -Depth 20 | Set-Content $ocTargetPath -Encoding UTF8
                    Write-SyncMsg "openclaw.json: merged (backup: openclaw.json.sync-bak)"
                }
            }
        } else {
            if ($DryRun) {
                Write-SyncDry "would create openclaw.json from template"
            } else {
                $srcObj | ConvertTo-Json -Depth 20 | Set-Content $ocTargetPath -Encoding UTF8
                Write-SyncMsg "openclaw.json: created from template"
            }
        }
    } catch {
        Write-Host "  [SYNC][WARN] openclaw.json merge failed: $_" -ForegroundColor Yellow
    }
}

$ocTargetPath = Join-Path $desktopDir "openclaw.json"
if (Test-Path -LiteralPath $ocTargetPath) {
    try {
        $desktopConfig = Get-Content $ocTargetPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $currentWorkspace = ""
        if ($null -ne $desktopConfig.agents -and $null -ne $desktopConfig.agents.defaults) {
            $currentWorkspace = [string]$desktopConfig.agents.defaults.workspace
        }
        if ($currentWorkspace -ne $ProjectDir) {
            if ($DryRun) {
                Write-SyncDry "would set openclaw.json agents.defaults.workspace -> $ProjectDir"
            } else {
                $desktopConfig = Set-DesktopOpenClawWorkspace -ConfigObject $desktopConfig -WorkspacePath $ProjectDir
                Copy-Item $ocTargetPath "$ocTargetPath.sync-bak" -Force
                $desktopConfig | ConvertTo-Json -Depth 20 | Set-Content $ocTargetPath -Encoding UTF8
                Write-SyncMsg "openclaw.json: agents.defaults.workspace -> repo root"
            }
        }
    } catch {
        Write-Host "  [SYNC][WARN] workspace normalization failed: $_" -ForegroundColor Yellow
    }
}

# ---- Step 3: agents/ merge (no-op for now; models.json/auth-profiles.json are gitignored) ----

# ---- Step 4: skills/ overwrite ----
$skillsSrc = Join-Path $ProjectDir "skills"
$skillsDst = Join-Path $desktopDir "skills"
if (Test-Path $skillsSrc) {
    $srcFiles  = @(Get-ChildItem $skillsSrc -Recurse -File -ErrorAction SilentlyContinue)
    $copyCount = 0
    foreach ($f in $srcFiles) {
        $rel     = $f.FullName.Substring($skillsSrc.Length).TrimStart([char]'\', [char]'/')
        $dstFile = Join-Path $skillsDst $rel
        if ($DryRun) {
            Write-SyncDry "would copy: skills/$rel"
        } else {
            $dstDirPath = Split-Path $dstFile -Parent
            if (-not (Test-Path $dstDirPath)) {
                New-Item -ItemType Directory -Path $dstDirPath -Force | Out-Null
            }
            Copy-Item $f.FullName $dstFile -Force
        }
        $copyCount++
    }
    if ($copyCount -gt 0 -and -not $DryRun) {
        Write-SyncMsg "skills/: $copyCount files copied"
    }
}

# ---- Step 5 (A): .python/ + vendor/ copy to .openclaw-desktop/ ----
$skipExisting = -not $Force
Sync-DirectoryCopy -SrcDir (Join-Path $ProjectDir ".python") `
                   -DstDir (Join-Path $desktopDir "python") `
                   -Label "python" `
                   -SkipExisting $skipExisting

Sync-DirectoryCopy -SrcDir (Join-Path $ProjectDir "vendor") `
                   -DstDir (Join-Path $desktopDir "vendor") `
                   -Label "vendor" `
                   -SkipExisting $skipExisting

# ---- Step 6 (B): install vendor/ packages into harness venv ----
$vendorDir = Join-Path $ProjectDir "vendor"
if (Test-Path $vendorDir) {
    $allVendorDirs = Get-ChildItem $vendorDir -Directory -ErrorAction SilentlyContinue
    $vendorPkgs = @()
    foreach ($d in $allVendorDirs) {
        $hasPyproject = Test-Path (Join-Path $d.FullName "pyproject.toml")
        $hasSetupPy   = Test-Path (Join-Path $d.FullName "setup.py")
        if ($hasPyproject -or $hasSetupPy) {
            $vendorPkgs += $d
        }
    }

    if ($vendorPkgs.Count -gt 0) {
        if ($DryRun) {
            foreach ($pkg in $vendorPkgs) {
                Write-SyncDry "would install vendor package: $($pkg.Name)"
            }
        } else {
            $harnessScripts = Join-Path $ProjectDir "extensions\hypura-harness\scripts"
            $harnessPip     = Join-Path $harnessScripts ".venv\Scripts\pip.exe"
            $venvPip        = Join-Path $ProjectDir ".venv\Scripts\pip.exe"
            $installedCount = 0
            foreach ($pkg in $vendorPkgs) {
                $pkgPath = $pkg.FullName
                $pkgName = $pkg.Name
                try {
                    if (Get-Command uv -ErrorAction SilentlyContinue) {
                        Push-Location $harnessScripts
                        uv pip install -e $pkgPath --quiet 2>&1 | Out-Null
                        Pop-Location
                    } elseif (Test-Path $harnessPip) {
                        & $harnessPip install -e $pkgPath --quiet 2>&1 | Out-Null
                    } elseif (Test-Path $venvPip) {
                        & $venvPip install -e $pkgPath --quiet 2>&1 | Out-Null
                    } else {
                        py -3 -m pip install -e $pkgPath --quiet 2>&1 | Out-Null
                    }
                    $installedCount++
                } catch {
                    Write-Host "  [SYNC][WARN] vendor install failed ($pkgName): $_" -ForegroundColor Yellow
                }
            }
            if ($installedCount -gt 0) {
                Write-SyncMsg "vendor packages: $installedCount installed into venv"
            }
        }
    }
}
