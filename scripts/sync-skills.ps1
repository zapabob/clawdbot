# sync-skills.ps1
# Syncs .agents/skills/ → ~/.claude/skills/ so skills work in both OpenClaw and Claude Code.
# Also syncs from Codex / Gemini CLI / Antigravity skill sources.
#
# Usage:
#   .\scripts\sync-skills.ps1            # Sync .agents/skills to Claude Code
#   .\scripts\sync-skills.ps1 -DryRun    # Preview only

param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path $PSScriptRoot -Parent
$AgentsSkillsDir = Join-Path $RepoRoot ".agents\skills"
$ClaudeSkillsDir = Join-Path $env:USERPROFILE ".claude\skills"

# Other source directories (read-only; we don't push back to these)
$SourceDirs = @{
    "codex"      = Join-Path $env:USERPROFILE ".codex\skills"
    "gemini"     = Join-Path $env:USERPROFILE ".gemini\skills"
    "antigravity"= Join-Path $env:USERPROFILE ".gemini\antigravity\global_skills"
}

function Write-Status($msg, $color = "Cyan") {
    Write-Host $msg -ForegroundColor $color
}

# ── 1. Sync .agents/skills → ~/.claude/skills ────────────────────────────────
Write-Status "`n=== Syncing .agents/skills → Claude Code ===`n"

if (-not (Test-Path $AgentsSkillsDir)) {
    Write-Status "ERROR: $AgentsSkillsDir not found" "Red"
    exit 1
}
if (-not (Test-Path $ClaudeSkillsDir)) {
    if (-not $DryRun) { New-Item -ItemType Directory -Path $ClaudeSkillsDir -Force | Out-Null }
    Write-Status "Created $ClaudeSkillsDir" "Yellow"
}

$synced = 0
Get-ChildItem -Path $AgentsSkillsDir -Directory | ForEach-Object {
    $skillName = $_.Name
    $srcSkillDir = $_.FullName
    $srcSkillFile = Join-Path $srcSkillDir "SKILL.md"
    if (-not (Test-Path $srcSkillFile)) { return }

    $destSkillDir = Join-Path $ClaudeSkillsDir $skillName
    $destSkillFile = Join-Path $destSkillDir "SKILL.md"

    $needsCopy = $true
    if (Test-Path $destSkillFile) {
        $srcHash  = (Get-FileHash $srcSkillFile -Algorithm MD5).Hash
        $destHash = (Get-FileHash $destSkillFile -Algorithm MD5).Hash
        if ($srcHash -eq $destHash) { $needsCopy = $false }
    }

    if ($needsCopy) {
        if (-not $DryRun) {
            if (-not (Test-Path $destSkillDir)) { New-Item -ItemType Directory -Path $destSkillDir -Force | Out-Null }
            # Copy SKILL.md and any supporting files (.py, .sh, .js)
            Get-ChildItem -Path $srcSkillDir -File | ForEach-Object {
                Copy-Item $_.FullName (Join-Path $destSkillDir $_.Name) -Force
            }
        }
        Write-Status "  ✅ $skillName" "Green"
        $synced++
    } else {
        Write-Status "  ⏭  $skillName (up to date)" "DarkGray"
    }
}
Write-Status "`nSynced $synced skills from .agents/skills → $ClaudeSkillsDir"

# ── 2. Pull new skills from Codex / Gemini / Antigravity → .agents/skills ────
Write-Status "`n=== Pulling from external tools → .agents/skills ===`n"

# Skills already in .agents/skills (skip them)
$existing = Get-ChildItem -Path $AgentsSkillsDir -Directory | Select-Object -ExpandProperty Name

$pulled = 0
foreach ($toolName in $SourceDirs.Keys) {
    $srcDir = $SourceDirs[$toolName]
    if (-not (Test-Path $srcDir)) {
        Write-Status "  ⚠️  $toolName : $srcDir not found" "Yellow"
        continue
    }
    Get-ChildItem -Path $srcDir -Directory | ForEach-Object {
        $skillName = $_.Name
        if ($existing -contains $skillName) { return }   # already integrated
        $srcFile = Join-Path $_.FullName "SKILL.md"
        if (-not (Test-Path $srcFile)) { return }

        $destSkillDir = Join-Path $AgentsSkillsDir $skillName
        if (-not $DryRun) {
            if (-not (Test-Path $destSkillDir)) { New-Item -ItemType Directory -Path $destSkillDir -Force | Out-Null }
            Get-ChildItem -Path $_.FullName -File | ForEach-Object {
                Copy-Item $_.FullName (Join-Path $destSkillDir $_.Name) -Force
            }
        }
        Write-Status "  ✅ $skillName  ← $toolName" "Green"
        $pulled++
    }
}
Write-Status "`nPulled $pulled new skills from external tools"

if ($DryRun) {
    Write-Status "`n[DRY-RUN] No files were actually written." "Yellow"
}

Write-Status "`n✨ Done. Restart OpenClaw / Claude Code to pick up new skills." "Cyan"
