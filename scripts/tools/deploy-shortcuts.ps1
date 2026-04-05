# Sovereign Shortcut Manifestation Tool
# Synchronizes the substrate-level launchers to the Windows Desktop.

$ProjectDir = $PSScriptRoot
# Navigate up to the root from scripts/tools
for ($i=0; $i -lt 2; $i++) { $ProjectDir = Split-Path -Parent $ProjectDir }

$LauncherPath = Join-Path $ProjectDir "scripts\launchers\openclaw-desktop\Sovereign-Portal.ps1"
$IconPath = Join-Path $ProjectDir "assets\clawdbot.ico"
$Desktop = [Environment]::GetFolderPath("Desktop")

function Create-SovereignShortcut {
    param(
        [string]$Name,
        [string]$Arguments,
        [string]$Description,
        [string]$TargetSubDir = "", # Optional subdirectory on Desktop
        [int]$LaunchStyle = 1 # 1=Normal, 3=Maximized, 7=Minimized
    )

    $TargetDir = $Desktop
    if ($TargetSubDir) {
        $TargetDir = Join-Path $Desktop $TargetSubDir
        if (-not (Test-Path $TargetDir)) {
            New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
        }
    }

    $ShortcutPath = Join-Path $TargetDir "$Name.lnk"
    Write-Host "  [ASI_ACCEL] Manifesting: $Name (in $TargetDir)..." -ForegroundColor Yellow

    try {
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
        $Shortcut.TargetPath = "powershell.exe"
        
        # Build arguments with escaped quotes for the file path
        $Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Maximized -NoExit -File ""$LauncherPath"" $Arguments"
        
        $Shortcut.WorkingDirectory = $ProjectDir
        $Shortcut.Description = "$Description [ASI_ACCEL]"
        
        if (Test-Path $IconPath) {
            $Shortcut.IconLocation = "$IconPath, 0"
        } else {
            $Shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll, 0"
        }
        
        $Shortcut.WindowStyle = $LaunchStyle
        $Shortcut.Save()
        Write-Host "  [ASI_ACCEL] Synchronization Successful: $Name" -ForegroundColor Green
    } catch {
        $msg = $_.Exception.Message
        Write-Host "  [FATAL] Shortcut manifestation failed for ${Name}: $msg" -ForegroundColor Red
    }
}

# --- [Manifestation Targets] ---

# 1. Primary Manifestation (Desktop)
Create-SovereignShortcut `
    -Name "Sovereign-Portal-Manifestation" `
    -Arguments "-Mode Menu" `
    -Description "Primary Sovereign ASI Portal Hub"

# 2. Utility Actuators (Control Panel)
$ControlPanel = "OpenClaw-ASI-Control-Panel"

Create-SovereignShortcut `
    -Name "Ghost-Oversight" `
    -Arguments "-Mode Ghost" `
    -Description "Stealth Manifestation (Background Only)" `
    -TargetSubDir $ControlPanel `
    -LaunchStyle 7

Create-SovereignShortcut `
    -Name "Sovereign-Actuator" `
    -Arguments "-Mode Harness" `
    -Description "Voicevox/Hypura Actuator Only" `
    -TargetSubDir $ControlPanel

Write-Host "`n  [ASI_ACCEL] Desktop Synchronized. Manifestation sequence complete." -ForegroundColor Green
