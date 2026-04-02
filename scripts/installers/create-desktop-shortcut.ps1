#Requires -Version 5.1
# ============================================================
#  create-desktop-shortcut.ps1
#  デスクトップショートカットを作成する
#
#  作成されるショートカット:
#    Clawdbot.lnk            — フルスタック起動 (launch-desktop-stack.ps1)
#    Hakua Companion.lnk     — コンパニオン単体起動 (Electron)
#    Hakua Companion Only.lnk — コンパニオン + VOICEVOXのみ (stack無し)
#    Install Shortcuts.lnk   — このスクリプト自体の再実行用
#
#  旧ショートカットは全て削除する
# ============================================================

[CmdletBinding()]
param(
    [string]$DesktopPath = [System.Environment]::GetFolderPath("Desktop"),
    [switch]$PreferPwsh
)

$ProjectDir      = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$LauncherPs1     = Join-Path $ProjectDir "scripts\launchers\launch-desktop-stack.ps1"
$CompanionDir    = Join-Path $ProjectDir "extensions\live2d-companion"
$LaunchStackPs1  = Join-Path $ProjectDir "scripts\launchers\launch-desktop-stack.ps1"
$ThisScript      = $PSCommandPath
$IconPath        = Join-Path $ProjectDir "assets\clawdbot.ico"

function Resolve-PowerShellExe {
    param([switch]$UsePwsh)
    if ($UsePwsh) {
        $pwsh = Get-Command pwsh -ErrorAction SilentlyContinue
        if ($pwsh) {
            return $pwsh.Source
        }
        Write-Host "  [warn] pwsh が見つからんかったので powershell.exe を使うで" -ForegroundColor Yellow
    }
    return "powershell.exe"
}
$PowerShellExe = Resolve-PowerShellExe -UsePwsh:$PreferPwsh

# ── ショートカット名 ─────────────────────────────────────────────────────────
$PrimaryName      = "Clawdbot.lnk"
$CompanionName    = "Hakua Companion.lnk"
$CompanionSoloName = "Hakua Companion Only.lnk"
$InstallerName    = "Install Shortcuts.lnk"

$PrimaryPath       = Join-Path $DesktopPath $PrimaryName
$CompanionPath     = Join-Path $DesktopPath $CompanionName
$CompanionSoloPath = Join-Path $DesktopPath $CompanionSoloName
$InstallerPath     = Join-Path $DesktopPath $InstallerName

# ── 削除する旧ショートカット/バッチ一覧 ──────────────────────────────────────
$LegacyNames = @(
    "Clawdbot-Master.lnk",
    "OpenClaw Desktop Stack.lnk",
    "OpenClaw Launcher.lnk",
    "OpenClaw-Launcher.bat",
    "OpenClaw-All-In-One.bat",
    "Hakua.lnk",
    "Hakua Neural Link.lnk",
    "Hakua Link.lnk",
    "ASI_Manifestation.bat",
    "HAKUA_CORE.lnk"
)

Write-Host ""
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host "  Clawdbot Desktop Shortcut Installer"     -ForegroundColor Cyan
Write-Host "  iDOLM@STER Stage Edition"                -ForegroundColor DarkMagenta
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host ""

# ── 旧ショートカット削除 ──────────────────────────────────────────────────────
$removedCount = 0
foreach ($name in $LegacyNames) {
    $path = Join-Path $DesktopPath $name
    if (Test-Path $path) {
        Remove-Item $path -Force
        Write-Host "  [removed] $name" -ForegroundColor DarkGray
        $removedCount++
    }
}
if ($removedCount -gt 0) {
    Write-Host ""
}

$WshShell = New-Object -ComObject WScript.Shell

# ── アイコン解決ヘルパー ─────────────────────────────────────────────────────
function Resolve-Icon {
    param([string]$Primary, [string]$Fallback = "powershell.exe,0")
    if (Test-Path $Primary) { return "$Primary,0" }
    return $Fallback
}
$iconLoc = Resolve-Icon -Primary $IconPath

if (-not (Test-Path $LaunchStackPs1)) {
    throw "Launcher script not found: $LaunchStackPs1"
}
if (-not (Test-Path $CompanionDir)) {
    throw "Companion directory not found: $CompanionDir"
}

# ── 1. フルスタックショートカット (Clawdbot.lnk) ──────────────────────────────
$sc = $WshShell.CreateShortcut($PrimaryPath)
$sc.TargetPath       = $PowerShellExe
$sc.Arguments        = "-NoProfile -NoExit -ExecutionPolicy Bypass -File `"$LauncherPs1`" -ForceVisibleGatewayAndTui -SpeakOnReady -HypuraWaitSeconds 180 -HypuraHarnessWaitSeconds 45"
$sc.WorkingDirectory = $ProjectDir
$sc.Description      = "Clawdbot — フルスタック起動 (Gateway / TUI / Live2D + VOICEVOX / VRChat / Web UI)"
$sc.WindowStyle      = 1  # Normal
$sc.IconLocation     = $iconLoc
$sc.Save()
Write-Host "  [created] $PrimaryName" -ForegroundColor Green
Write-Host "            $LauncherPs1 -ForceVisibleGatewayAndTui -SpeakOnReady -HypuraWaitSeconds 180 -HypuraHarnessWaitSeconds 45" -ForegroundColor DarkGray

# ── 2. コンパニオン + StackショートカットHakua Companion.lnk) ─────────────────
#    Gateway + コンパニオン + VOICEVOX のみ (TUI/Browser/Ngrok/Hypura をスキップ)
$sc2 = $WshShell.CreateShortcut($CompanionPath)
$sc2.TargetPath       = $PowerShellExe
$sc2.Arguments        = "-NoProfile -NoExit -ExecutionPolicy Bypass -File `"$LaunchStackPs1`" -ForceVisibleGatewayAndTui -SkipTui -SkipBrowser -SkipNgrok -SkipHypura -SpeakOnReady -HypuraHarnessWaitSeconds 45"
$sc2.WorkingDirectory = $ProjectDir
$sc2.Description      = "Hakua Companion — iDOLM@STER AI Avatar + VOICEVOX + Gateway (TUI/Browser省略)"
$sc2.WindowStyle      = 1
$sc2.IconLocation     = $iconLoc
$sc2.Save()
Write-Host "  [created] $CompanionName" -ForegroundColor Green
Write-Host "            launch-desktop-stack.ps1 -ForceVisibleGatewayAndTui -SkipTui -SkipBrowser -SkipNgrok ..." -ForegroundColor DarkGray

# ── 3. コンパニオン単体 (Hakua Companion Only.lnk) ────────────────────────────
#    Electron 直接起動 — Gateway/TUI 不要な場合
$MainJs  = Join-Path $CompanionDir "electron\main.js"
$eBin1   = Join-Path $ProjectDir  "node_modules\.bin\electron.cmd"
$eBin2   = Join-Path $CompanionDir "node_modules\.bin\electron.cmd"
$resolvedElectron = ""
if ($eBin1 -and (Test-Path $eBin1)) { $resolvedElectron = $eBin1 }
elseif ($eBin2 -and (Test-Path $eBin2)) { $resolvedElectron = $eBin2 }

if ($resolvedElectron) {
    $soloTarget = $resolvedElectron
    $soloArgs   = "`"$MainJs`""
} else {
    $soloTarget = $PowerShellExe
    $soloArgs   = "-NoProfile -ExecutionPolicy Bypass -Command `"Set-Location '$CompanionDir'; npx electron electron/main.js`""
}

$sc3 = $WshShell.CreateShortcut($CompanionSoloPath)
$sc3.TargetPath       = $soloTarget
$sc3.Arguments        = $soloArgs
$sc3.WorkingDirectory = $CompanionDir
$sc3.Description      = "Hakua Companion Only — iDOLM@STER Live2D/VRM/FBX アバター単体起動 (Gateway不要)"
$sc3.WindowStyle      = 7  # Minimized (Electron はウィンドウレス透過)
$sc3.IconLocation     = $iconLoc
$sc3.Save()
Write-Host "  [created] $CompanionSoloName" -ForegroundColor Green
Write-Host "            Electron direct (companion only, no gateway)" -ForegroundColor DarkGray

# ── 4. ショートカット再インストール用 (Install Shortcuts.lnk) ─────────────────
$sc4 = $WshShell.CreateShortcut($InstallerPath)
$sc4.TargetPath       = $PowerShellExe
$sc4.Arguments        = "-NoProfile -ExecutionPolicy Bypass -File `"$ThisScript`""
$sc4.WorkingDirectory = $ProjectDir
$sc4.Description      = "Clawdbot ショートカット再インストール (create-desktop-shortcut.ps1)"
$sc4.WindowStyle      = 1
$sc4.IconLocation     = "$PowerShellExe,0"
$sc4.Save()
Write-Host "  [created] $InstallerName" -ForegroundColor Green
Write-Host "            create-desktop-shortcut.ps1 (再実行用)" -ForegroundColor DarkGray

# ── 完了表示 ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host "  Done! 4 shortcuts installed." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Clawdbot.lnk              - Full stack + VOICEVOX" -ForegroundColor White
Write-Host "  Hakua Companion.lnk       - Gateway + Companion + VOICEVOX" -ForegroundColor White
Write-Host "  Hakua Companion Only.lnk  - Companion solo (Electron direct)" -ForegroundColor White
Write-Host "  Install Shortcuts.lnk     - Re-run this installer" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host ""
