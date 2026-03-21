# ============================================================
#  create-desktop-shortcut.ps1
#  デスクトップショートカットを1つだけ作成し、古いエイリアスを全て削除する
#  ターゲット: scripts/clawdbot-master.ps1 (launch-desktop-stack への委譲)
# ============================================================

$ProjectDir   = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$LauncherPs1  = Join-Path $ProjectDir "scripts\clawdbot-master.ps1"
$IconPath     = Join-Path $ProjectDir "assets\clawdbot.ico"
$DesktopPath  = [System.Environment]::GetFolderPath("Desktop")

# ── 統合後の唯一のショートカット名 ─────────────────────────────────────
$PrimaryName  = "Clawdbot.lnk"
$PrimaryPath  = Join-Path $DesktopPath $PrimaryName

# ── 削除する旧ショートカット/バッチ一覧 ──────────────────────────────────
$LegacyNames = @(
    "Clawdbot-Master.lnk",
    "OpenClaw Desktop Stack.lnk",
    "OpenClaw Launcher.lnk",
    "OpenClaw-Launcher.bat",
    "OpenClaw-All-In-One.bat",
    "Hakua.lnk",
    "Hakua Neural Link.lnk",
    "Hakua Link.lnk",
    "ASI_Manifestation.bat"
)

Write-Host ""
Write-Host "=== Clawdbot Desktop Shortcut Installer ===" -ForegroundColor Cyan
Write-Host ""

# ── 旧ショートカット削除 ───────────────────────────────────────────────────
$removedCount = 0
foreach ($name in $LegacyNames) {
    $path = Join-Path $DesktopPath $name
    if (Test-Path $path) {
        Remove-Item $path -Force
        Write-Host "  [removed] $name" -ForegroundColor DarkGray
        $removedCount++
    }
}
if ($removedCount -eq 0) {
    Write-Host "  (no legacy shortcuts found)" -ForegroundColor DarkGray
}
Write-Host ""

# ── 新しい統合ショートカット作成 ────────────────────────────────────────────
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($PrimaryPath)
$Shortcut.TargetPath    = "powershell.exe"
$Shortcut.Arguments     = "-NoExit -ExecutionPolicy Bypass -File `"$LauncherPs1`" -SpeakOnReady"
$Shortcut.WorkingDirectory = $ProjectDir
$Shortcut.Description   = "Clawdbot — Gateway / TUI / Live2D+VOICEVOX / VRChat Relay / X Poster / Web UI"
$Shortcut.WindowStyle   = 1   # Normal

if (Test-Path $IconPath) {
    $Shortcut.IconLocation = "$IconPath,0"
} else {
    $Shortcut.IconLocation = "powershell.exe,0"
}

$Shortcut.Save()

Write-Host "  [created] $PrimaryName" -ForegroundColor Green
Write-Host "            -> $LauncherPs1" -ForegroundColor Gray
Write-Host ""
Write-Host "Done. Double-click Clawdbot.lnk to launch the full stack." -ForegroundColor Yellow
Write-Host ""
