# Installs a single desktop shortcut (OpenClaw.lnk). Launcher PS1 files live under scripts/launchers/openclaw-desktop/.
param(
    [Parameter(Mandatory = $false)]
    [string]$ProjectRoot = (Get-Item $PSScriptRoot).Parent.Parent.Parent.FullName,
    [switch]$Force,
    [switch]$PreferPwsh,
    [switch]$AlsoStartMenu,
    # Kept for backward compatibility with older callers; ignored (no extra shortcuts).
    [switch]$IncludeCompanion,
    [switch]$LegacyAliases
)

$ErrorActionPreference = "Stop"

function Resolve-OpenClawPowerShellExe {
    param([switch]$UsePwsh)
    if ($UsePwsh) {
        $pwsh = Get-Command pwsh -ErrorAction SilentlyContinue
        if ($pwsh) {
            return $pwsh.Source
        }
        Write-Host "[shortcuts] pwsh not found; using powershell.exe" -ForegroundColor DarkYellow
    }
    return "powershell.exe"
}

$ShellExe = Resolve-OpenClawPowerShellExe -UsePwsh:$PreferPwsh
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$StartMenuProgramsPath = Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs"
$IconPath = Join-Path $ProjectRoot "assets\clawdbot.ico"
$HasIcon = Test-Path -LiteralPath $IconPath

$stackPs1 = Join-Path $ProjectRoot "scripts\launchers\openclaw-desktop\launch-desktop-stack.ps1"
if (-not (Test-Path -LiteralPath $stackPs1)) {
    throw "Stack launcher not found: $stackPs1"
}

$syncPs1 = Join-Path $ProjectRoot "scripts\Sync-OpenClawDesktop.ps1"
if (Test-Path -LiteralPath $syncPs1) {
    & $syncPs1 -ProjectDir $ProjectRoot -Force:$Force -Quiet
}

$stackArgsFull =
    '-NoProfile -ExecutionPolicy Bypass -WindowStyle Normal -File "{0}" -UseDesktopLauncher -ForceVisibleGatewayAndTui -SpeakOnReady -HypuraWaitSeconds 180 -HypuraHarnessWaitSeconds 45' -f $stackPs1

function Test-ShortcutMatches {
    param(
        [Parameter(Mandatory = $true)]$Shortcut,
        [Parameter(Mandatory = $true)][string]$TargetPath,
        [Parameter(Mandatory = $true)][string]$Arguments,
        [Parameter(Mandatory = $true)][string]$WorkingDirectory,
        [Parameter(Mandatory = $true)][string]$Description,
        [string]$IconLocation
    )

    if ($Shortcut.TargetPath -ne $TargetPath) { return $false }
    if ($Shortcut.Arguments -ne $Arguments) { return $false }
    if ($Shortcut.WorkingDirectory -ne $WorkingDirectory) { return $false }
    if ($Shortcut.Description -ne $Description) { return $false }
    if ($IconLocation -and $Shortcut.IconLocation -ne $IconLocation) { return $false }
    return $true
}

function Set-Shortcut {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$TargetPath,
        [Parameter(Mandatory = $true)][string]$Arguments,
        [Parameter(Mandatory = $true)][string]$WorkingDirectory,
        [Parameter(Mandatory = $true)][string]$Description,
        [string]$IconLocation,
        [switch]$ForceRewrite
    )

    if (Test-Path -LiteralPath $Path) {
        $existing = $WshShell.CreateShortcut($Path)
        $isAlreadyExpected = Test-ShortcutMatches `
            -Shortcut $existing `
            -TargetPath $TargetPath `
            -Arguments $Arguments `
            -WorkingDirectory $WorkingDirectory `
            -Description $Description `
            -IconLocation $IconLocation
        if ($isAlreadyExpected -and -not $ForceRewrite) {
            Write-Host ("[shortcuts] up to date: {0}" -f [System.IO.Path]::GetFileName($Path)) -ForegroundColor DarkGray
            return
        }
    }

    $sc = $WshShell.CreateShortcut($Path)
    $sc.TargetPath = $TargetPath
    $sc.Arguments = $Arguments
    $sc.WorkingDirectory = $WorkingDirectory
    $sc.Description = $Description
    if ($IconLocation) {
        $sc.IconLocation = $IconLocation
    }
    $sc.Save()
    Write-Host ("[LNK] {0}" -f [System.IO.Path]::GetFileName($Path)) -ForegroundColor Green
}

$obsoleteDesktopLnks = @(
    "OpenClaw-Sovereign.lnk",
    "OpenClaw-Desktop-Stack.lnk",
    "OpenClaw-Refresh-Shortcuts.lnk",
    "OpenClaw-Companion-Light.lnk",
    "OpenClaw-Companion-Only.lnk",
    "Install Shortcuts.lnk",
    "Clawdbot.lnk",
    "Hakua Companion.lnk",
    "Hakua Companion Only.lnk",
    "Clawdbot-Master.lnk",
    "OpenClaw Desktop Stack.lnk",
    "OpenClaw Launcher.lnk",
    "Hakua.lnk",
    "Hakua Neural Link.lnk",
    "Hakua Link.lnk",
    "HAKUA_CORE.lnk",
    "ASI-Internet.lnk",
    "ASI-ngrok.lnk",
    "ASI-Gateway.lnk",
    "ASI-TUI.lnk",
    "ASI-Hypura-Harness.lnk",
    "ASI-VOICEVOX.lnk",
    "ASI-Hakua-Sovereign.lnk",
    "Sovereign-Portal.lnk"
)

foreach ($name in $obsoleteDesktopLnks) {
    $p = Join-Path $DesktopPath $name
    if (Test-Path -LiteralPath $p) {
        Remove-Item -LiteralPath $p -Force
        Write-Host "[shortcuts] removed obsolete: $name" -ForegroundColor DarkGray
    }
}

$targetLnk = Join-Path $DesktopPath "OpenClaw.lnk"
$shortcutDescription = "OpenClaw — full desktop stack (Gateway, TUI, ngrok, Hypura, VOICEVOX, browser)."
$resolvedIconLocation = $null
if ($HasIcon) {
    $resolvedIconLocation = $IconPath
}
Set-Shortcut `
    -Path $targetLnk `
    -TargetPath $ShellExe `
    -Arguments $stackArgsFull `
    -WorkingDirectory $ProjectRoot `
    -Description $shortcutDescription `
    -IconLocation $resolvedIconLocation `
    -ForceRewrite:$Force

if ($AlsoStartMenu) {
    $startMenuLnk = Join-Path $StartMenuProgramsPath "OpenClaw.lnk"
    Set-Shortcut `
        -Path $startMenuLnk `
        -TargetPath $ShellExe `
        -Arguments $stackArgsFull `
        -WorkingDirectory $ProjectRoot `
        -Description $shortcutDescription `
        -IconLocation $resolvedIconLocation `
        -ForceRewrite:$Force
}

Write-Host "[shortcuts] done (desktop + optional start menu; launcher under scripts\launchers\openclaw-desktop\)" -ForegroundColor Green
