<#
.SYNOPSIS
  どの openclaw.json が効くか — 環境変数と代表的なパスの存在を表示する（paths.ts 準拠の説明用）。

.NOTES
  OpenClaw は src/config/paths.ts で解決する:
  - OPENCLAW_CONFIG_PATH があればそのファイルが最優先
  - なければ OPENCLAW_STATE_DIR/openclaw.json（STATE_DIR が指定されている場合）
  - 既定は ~/.openclaw/openclaw.json（既存ファイル候補の探索あり）
  リポジトリ直下の .openclaw-desktop は「自動」ではなく、OPENCLAW_STATE_DIR 等で指したときに使う。
#>
$ErrorActionPreference = "Continue"
$userProfileDir = [Environment]::GetFolderPath('UserProfile')
$canonical = Join-Path $userProfileDir '.openclaw\openclaw.json'

Write-Host "=== OpenClaw config resolution (see src/config/paths.ts) ==="
Write-Host ""
Write-Host "[env] OPENCLAW_CONFIG_PATH =" $(if ($env:OPENCLAW_CONFIG_PATH) { $env:OPENCLAW_CONFIG_PATH } else { '(unset)' })
Write-Host "[env] OPENCLAW_STATE_DIR    =" $(if ($env:OPENCLAW_STATE_DIR) { $env:OPENCLAW_STATE_DIR } else { '(unset)' })
Write-Host "[env] OPENCLAW_HOME         =" $(if ($env:OPENCLAW_HOME) { $env:OPENCLAW_HOME } else { '(unset)' })
Write-Host ""
Write-Host "[paths]"
function Show-Path([string]$label, [string]$p) {
    $ok = Test-Path -LiteralPath $p
    Write-Host ("  {0,-28} exists={1} " -f $label, $ok) -NoNewline
    Write-Host $p
}
Show-Path "canonical (~/.openclaw)" $canonical

# If script lives in repo scripts/, suggest repo .openclaw-desktop
$repoDesktop = $null
if ($PSScriptRoot) {
    $maybeRoot = Split-Path -Parent $PSScriptRoot
    $candidate = Join-Path $maybeRoot '.openclaw-desktop\openclaw.json'
    if (Test-Path -LiteralPath (Join-Path $maybeRoot '.openclaw-desktop')) {
        $repoDesktop = $candidate
        Show-Path "repo .openclaw-desktop" $repoDesktop
    }
}

if ($env:OPENCLAW_STATE_DIR) {
    $sd = $env:OPENCLAW_STATE_DIR.Trim()
    Show-Path 'OPENCLAW_STATE_DIR' (Join-Path $sd 'openclaw.json')
}

Write-Host ""
Write-Host "Hint: run 'openclaw daemon status' (if available) — CLI vs daemon config mismatch causes confusion."
Write-Host "Hypura checklist: hypura running, /api/tags name == primary, port 8080 (or set baseUrl)."
