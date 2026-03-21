# ============================================================
#  create-desktop-shortcut.ps1
#  デスクトップショートカットを作成する
#  ・Clawdbot.lnk       — フルスタック起動 (clawdbot-master.ps1)
#  ・Hakua Companion.lnk — コンパニオン単体起動 (Electron)
#  旧ショートカットは全て削除する
# ============================================================

$ProjectDir      = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$LauncherPs1     = Join-Path $ProjectDir "scripts\clawdbot-master.ps1"
$CompanionDir    = Join-Path $ProjectDir "extensions\live2d-companion"
$NodeModulesElec = Join-Path $CompanionDir "node_modules\.bin\electron.cmd"
$MainJs          = Join-Path $CompanionDir "electron\main.js"
$IconPath        = Join-Path $ProjectDir "assets\clawdbot.ico"
$DesktopPath     = [System.Environment]::GetFolderPath("Desktop")

# ── ショートカット名 ─────────────────────────────────────────────────────
$PrimaryName    = "Clawdbot.lnk"
$CompanionName  = "Hakua Companion.lnk"
$PrimaryPath    = Join-Path $DesktopPath $PrimaryName
$CompanionPath  = Join-Path $DesktopPath $CompanionName

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

$WshShell = New-Object -ComObject WScript.Shell

# ── 1. フルスタックショートカット (Clawdbot.lnk) ─────────────────────────
$Shortcut = $WshShell.CreateShortcut($PrimaryPath)
$Shortcut.TargetPath       = "powershell.exe"
$Shortcut.Arguments        = "-NoExit -ExecutionPolicy Bypass -File `"$LauncherPs1`" -SpeakOnReady"
$Shortcut.WorkingDirectory = $ProjectDir
$Shortcut.Description      = "Clawdbot — Gateway / TUI / VRM+Live2D+VOICEVOX / VRChat Relay / X Poster / Web UI"
$Shortcut.WindowStyle      = 1  # Normal

if (Test-Path $IconPath) {
    $Shortcut.IconLocation = "$IconPath,0"
} else {
    $Shortcut.IconLocation = "powershell.exe,0"
}
$Shortcut.Save()

Write-Host "  [created] $PrimaryName" -ForegroundColor Green
Write-Host "            -> $LauncherPs1" -ForegroundColor Gray

# ── 2. コンパニオン単体ショートカット (Hakua Companion.lnk) ──────────────
# electron.cmd が node_modules にあれば使う、なければ npx electron にフォールバック
if (Test-Path $NodeModulesElec) {
    $CompTarget = $NodeModulesElec
    $CompArgs   = "`"$MainJs`""
} else {
    $CompTarget = "powershell.exe"
    $CompArgs   = "-NoProfile -ExecutionPolicy Bypass -Command `"cd '$CompanionDir'; npx electron electron/main.js`""
}

$Companion = $WshShell.CreateShortcut($CompanionPath)
$Companion.TargetPath       = $CompTarget
$Companion.Arguments        = $CompArgs
$Companion.WorkingDirectory = $CompanionDir
$Companion.Description      = "Hakua Companion — Cyberpunk AI Avatar (VRM / FBX / Live2D) + VOICEVOX"
$Companion.WindowStyle      = 7  # Minimized (Electron 自身はウィンドウレス透過)

if (Test-Path $IconPath) {
    $Companion.IconLocation = "$IconPath,0"
} else {
    $Companion.IconLocation = "powershell.exe,0"
}
$Companion.Save()

Write-Host "  [created] $CompanionName" -ForegroundColor Green
Write-Host "            -> Hakua VRM/Live2D Companion (Electron)" -ForegroundColor Gray
Write-Host ""
Write-Host "Done." -ForegroundColor Yellow
Write-Host "  Clawdbot.lnk       — フルスタック起動" -ForegroundColor White
Write-Host "  Hakua Companion.lnk — コンパニオン単体起動" -ForegroundColor White
Write-Host ""
