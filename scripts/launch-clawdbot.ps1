<#
.SYNOPSIS
  Clawdbot ランチャー — 自己修復・自己改善・自己増殖エージェント
.DESCRIPTION
  openclaw gateway を起動し、EvoDaemon を並行して起動する。
  PowerShell ウィンドウを最小化して常駐することで、タスクバーに格納される。
#>

param(
  [switch]$NoDaemon  # デーモンを起動しない場合のフラグ
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ─── パス設定 ───────────────────────────────────────────────
$RepoRoot   = 'C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main'
$LogFile    = 'C:\Users\downl\clawd\launcher.log'
$LockFile   = 'C:\Users\downl\clawd\launcher.lock'

# ─── 多重起動防止 ────────────────────────────────────────────
if (Test-Path $LockFile) {
  $lockedPid = [int](Get-Content $LockFile -ErrorAction SilentlyContinue)
  if ($lockedPid -and (Get-Process -Id $lockedPid -ErrorAction SilentlyContinue)) {
    Write-Host "[Clawdbot] 既に起動中です (PID $lockedPid)。終了します。" -ForegroundColor Yellow
    exit 0
  }
  Remove-Item $LockFile -Force
}
$PID | Out-File $LockFile -Encoding ascii -Force

# ─── ロギング ────────────────────────────────────────────────
function Write-Log {
  param([string]$Msg, [string]$Level = 'INFO')
  $ts = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
  $line = "[$ts] [$Level] $Msg"
  Add-Content -Path $LogFile -Value $line -Encoding UTF8
  Write-Host $line
}

Write-Log "=== Clawdbot Launcher START (PID $PID) ==="

# ─── Node / pnpm 確認 ────────────────────────────────────────
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Log "node.exe が見つかりません。Node.js をインストールしてください。" 'ERROR'
  Remove-Item $LockFile -Force
  exit 1
}
Write-Log "Node: $($node.Source) $(node --version)"

# ─── openclaw gateway 起動 ────────────────────────────────────
Write-Log "openclaw gateway を起動中..."
$gatewayJob = Start-Job -Name 'ClawdbotGateway' -ScriptBlock {
  param($root)
  Set-Location $root
  # pnpm start が存在すれば使用、なければ openclaw start
  $pkg = Get-Content (Join-Path $root 'package.json') | ConvertFrom-Json
  if ($pkg.scripts.start) {
    & pnpm start 2>&1
  } else {
    & node dist/cli/index.js start 2>&1
  }
} -ArgumentList $RepoRoot

Write-Log "Gateway job ID: $($gatewayJob.Id)"

# ─── EvoDaemon 起動 (オプション) ─────────────────────────────
if (-not $NoDaemon) {
  Write-Log "EvoDaemon を起動中..."
  Start-Sleep -Seconds 8  # gateway の起動を待つ

  $daemonJob = Start-Job -Name 'ClawdbotEvoDaemon' -ScriptBlock {
    param($root)
    Set-Location $root
    & node dist/cli/index.js evo daemon start 2>&1
  } -ArgumentList $RepoRoot

  Write-Log "EvoDaemon job ID: $($daemonJob.Id)"
}

# ─── 自動 Git コミット (起動時) ──────────────────────────────
try {
  Push-Location $RepoRoot
  $status = git status --short 2>&1
  if ($status -and $status.Trim() -ne '') {
    Write-Log "未コミット変更を自動コミット..."
    git add -A 2>&1 | Out-Null
    $msg = "auto: launcher startup commit $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    git commit --no-verify -m $msg 2>&1 | Out-Null
    Write-Log "Git auto-commit 完了: $msg"
  } else {
    Write-Log "Git: 未コミット変更なし"
  }
} catch {
  Write-Log "Git auto-commit エラー: $_" 'WARN'
} finally {
  Pop-Location
}

# ─── メインループ — ジョブ監視 ───────────────────────────────
Write-Log "メインループ開始。Ctrl+C で終了。"
try {
  while ($true) {
    Start-Sleep -Seconds 60

    # Gateway 死活監視
    $gw = Get-Job -Name 'ClawdbotGateway' -ErrorAction SilentlyContinue
    if ($gw -and $gw.State -eq 'Failed') {
      Write-Log "Gateway がクラッシュしました。再起動します..." 'WARN'
      Remove-Job -Job $gw -Force
      $gatewayJob = Start-Job -Name 'ClawdbotGateway' -ScriptBlock {
        param($root); Set-Location $root; & pnpm start 2>&1
      } -ArgumentList $RepoRoot
      Write-Log "Gateway 再起動 job ID: $($gatewayJob.Id)"
    }

    # 1時間ごとに auto git commit
    $min = [int](Get-Date -Format 'mm')
    if ($min -lt 1) {
      try {
        Push-Location $RepoRoot
        $s2 = git status --short 2>&1
        if ($s2 -and $s2.Trim() -ne '') {
          git add -A 2>&1 | Out-Null
          git commit --no-verify -m "auto: hourly heartbeat commit $(Get-Date -Format 'yyyy-MM-dd HH:mm')" 2>&1 | Out-Null
          Write-Log "Git hourly auto-commit 完了"
        }
      } catch {
        Write-Log "Git hourly commit エラー: $_" 'WARN'
      } finally {
        Pop-Location
      }
    }
  }
} finally {
  Write-Log "Launcher 終了。クリーンアップ中..."
  Get-Job -Name 'ClawdbotGateway'  -ErrorAction SilentlyContinue | Stop-Job
  Get-Job -Name 'ClawdbotGateway'  -ErrorAction SilentlyContinue | Remove-Job
  Get-Job -Name 'ClawdbotEvoDaemon' -ErrorAction SilentlyContinue | Stop-Job
  Get-Job -Name 'ClawdbotEvoDaemon' -ErrorAction SilentlyContinue | Remove-Job
  Remove-Item $LockFile -Force -ErrorAction SilentlyContinue
  Write-Log "=== Clawdbot Launcher STOP ==="
}
