param(
    [string]$ProjectDir = (Get-Item $PSScriptRoot).Parent.FullName,
    [switch]$DryRun,   # 書き込まず変更内容だけ表示
    [switch]$Quiet,    # 変更があった項目だけ表示（変更なし時は無出力）
    [switch]$Force     # 既存値も上書き（通常はスキップ）
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\launchers\env-tools.ps1"

# --- [Helpers] ---
function Write-SyncMsg {
    param([string]$Msg, [System.ConsoleColor]$Color = [System.ConsoleColor]::DarkCyan)
    if (-not $Quiet) {
        Write-Host "  [SYNC] $Msg" -ForegroundColor $Color
    } else {
        Write-Host "  [SYNC] $Msg" -ForegroundColor $Color
    }
}

function Write-SyncDry {
    param([string]$Msg)
    Write-Host "  [SYNC][DRY] $Msg" -ForegroundColor Cyan
}

# Deep-merge two PSCustomObject/hashtable: source as base, target values win (unless -Force)
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
        # Start with all keys from Target (existing wins)
        foreach ($prop in $Target.PSObject.Properties) {
            $result[$prop.Name] = $prop.Value
        }
        # Add/merge keys from Source that are missing or forced
        foreach ($prop in $Source.PSObject.Properties) {
            if (-not $result.ContainsKey($prop.Name)) {
                $result[$prop.Name] = $prop.Value
            } elseif ($ForceOverwrite) {
                $result[$prop.Name] = Merge-JsonObject -Source $prop.Value -Target $result[$prop.Name] -ForceOverwrite
            } else {
                # recurse into objects to add new nested keys
                $result[$prop.Name] = Merge-JsonObject -Source $prop.Value -Target $result[$prop.Name]
            }
        }
        return [PSCustomObject]$result
    }

    # Scalar or array: target wins (unless Force)
    if ($ForceOverwrite) { return $Source }
    return $Target
}

# Merge only new top-level array entries by a unique key field
function Merge-JsonArrayByKey {
    param(
        [array]$Source,
        [array]$Target,
        [string]$KeyField
    )
    if (-not $Source) { return $Target }
    if (-not $Target) { return $Source }
    $result = [System.Collections.Generic.List[object]]$Target
    $existingKeys = [System.Collections.Generic.HashSet[string]]($Target | ForEach-Object {
        if ($_ -is [System.Management.Automation.PSCustomObject]) { [string]$_.$KeyField }
        elseif ($_ -is [string]) { $_ }
    })
    foreach ($item in $Source) {
        $key = if ($item -is [System.Management.Automation.PSCustomObject]) { [string]$item.$KeyField } else { [string]$item }
        if (-not $existingKeys.Contains($key)) {
            $result.Add($item)
        }
    }
    return $result.ToArray()
}

# --- [Ensure .openclaw-desktop/ exists] ---
$desktopDir = Join-Path $ProjectDir ".openclaw-desktop"
if (-not (Test-Path $desktopDir)) {
    if (-not $DryRun) { New-Item -ItemType Directory -Path $desktopDir -Force | Out-Null }
    Write-SyncMsg "Created .openclaw-desktop/" -Color Yellow
}

# ============================================================
# Step 1: .env キーマージ
# 優先順位（低→高）: .env.example → .env → .env.secrets → 既存 .openclaw-desktop/.env
# ============================================================
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
    $newKeys = @($repoEnvMap.Keys | Where-Object { -not $targetEnvMap.ContainsKey($_) })
    $overwriteKeys = @()
    if ($Force) {
        $overwriteKeys = @($repoEnvMap.Keys | Where-Object { $targetEnvMap.ContainsKey($_) -and $targetEnvMap[$_] -ne $repoEnvMap[$_] })
    }

    $addKeys = $newKeys
    if ($addKeys.Count -gt 0 -or $overwriteKeys.Count -gt 0) {
        if ($DryRun) {
            foreach ($k in ($addKeys | Sort-Object)) {
                Write-SyncDry "would add to .env: $k"
            }
            foreach ($k in ($overwriteKeys | Sort-Object)) {
                Write-SyncDry "would overwrite .env: $k"
            }
        } else {
            $toWrite = @{}
            foreach ($k in $addKeys) { $toWrite[$k] = $repoEnvMap[$k] }
            foreach ($k in $overwriteKeys) { $toWrite[$k] = $repoEnvMap[$k] }
            if (-not (Test-Path $envTarget)) {
                New-Item -ItemType File -Path $envTarget -Force | Out-Null
            }
            Set-EnvValues -EnvFile $envTarget -Values $toWrite
            $msg = ".env: +$($addKeys.Count) keys added"
            if ($overwriteKeys.Count -gt 0) { $msg += ", $($overwriteKeys.Count) overwritten" }
            Write-SyncMsg $msg
        }
    } elseif (-not $Quiet) {
        # no change, quiet suppresses
    }
}

# ============================================================
# Step 2: openclaw.json ディープマージ
# 優先順位: リポジトリ側 → 既存 .openclaw-desktop/openclaw.json（既存値優先）
# ============================================================
$ocSrc = Join-Path $desktopDir "openclaw.json"  # same file; if no committed version, only ensure target exists
# Check for a committed template (e.g. openclaw.json.template or openclaw.json.seed in project root)
$ocTemplate = $null
foreach ($cand in @(
    (Join-Path $ProjectDir "openclaw.json.template"),
    (Join-Path $ProjectDir "openclaw.json.seed"),
    (Join-Path $ProjectDir "config\openclaw.json.defaults")
)) {
    if (Test-Path $cand) { $ocTemplate = $cand; break }
}

if ($ocTemplate -and (Test-Path $ocTemplate)) {
    $ocTargetPath = Join-Path $desktopDir "openclaw.json"
    try {
        $srcObj = Get-Content $ocTemplate -Raw -Encoding UTF8 | ConvertFrom-Json
        if (Test-Path $ocTargetPath) {
            $tgtObj = Get-Content $ocTargetPath -Raw -Encoding UTF8 | ConvertFrom-Json
            $merged = Merge-JsonObject -Source $srcObj -Target $tgtObj -ForceOverwrite:$Force
            # count differences (top-level new keys)
            $newTopKeys = @($srcObj.PSObject.Properties.Name | Where-Object {
                -not ($tgtObj.PSObject.Properties.Name -contains $_)
            })
            if ($newTopKeys.Count -gt 0 -or $Force) {
                if ($DryRun) {
                    foreach ($k in $newTopKeys) { Write-SyncDry "would add to openclaw.json: $k" }
                } else {
                    # backup
                    $bak = "$ocTargetPath.sync-bak"
                    Copy-Item $ocTargetPath $bak -Force
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

# ============================================================
# Step 3: agents/ マージ
# ============================================================
$agentsSrcDir = Join-Path $desktopDir "agents"
if (Test-Path $agentsSrcDir) {
    # Walk all agent subdirectories
    $agentDirs = Get-ChildItem $agentsSrcDir -Directory -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -eq "agent" }

    foreach ($agentDir in $agentDirs) {
        $agentPath = $agentDir.FullName

        # models.json — 新規モデルだけ追加
        $modelsFile = Join-Path $agentPath "models.json"
        if (Test-Path $modelsFile) {
            # self-merge: source == target, nothing to do unless Force
            # In distributed scenario, source would come from a different path
            # Current: no-op (file is already the target)
        }

        # auth-profiles.json — gitignored; new profiles only
        # auth.json — skip（機密）
    }
}

# ============================================================
# Step 4: skills/ 上書き
# ============================================================
$skillsSrc = Join-Path $ProjectDir "skills"
$skillsDst = Join-Path $desktopDir "skills"

if (Test-Path $skillsSrc) {
    $srcFiles  = @(Get-ChildItem $skillsSrc -Recurse -File -ErrorAction SilentlyContinue)
    $copyCount = 0
    $skipCount = 0

    foreach ($f in $srcFiles) {
        $rel     = $f.FullName.Substring($skillsSrc.Length).TrimStart('\', '/')
        $dstFile = Join-Path $skillsDst $rel
        $dstDir  = Split-Path $dstFile -Parent

        $needsCopy = $true
        if ((Test-Path $dstFile) -and -not $Force) {
            # overwrite unconditionally for skills/ (spec: 上書き)
        }

        if ($DryRun) {
            Write-SyncDry "would copy: skills/$rel"
            $copyCount++
        } else {
            if (-not (Test-Path $dstDir)) {
                New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
            }
            Copy-Item $f.FullName $dstFile -Force
            $copyCount++
        }
    }

    if ($copyCount -gt 0) {
        if (-not $DryRun) {
            Write-SyncMsg "skills/: $copyCount files copied"
        }
    }
}

if (-not $DryRun -and -not $Quiet) {
    # Nothing extra; individual steps report themselves
}
