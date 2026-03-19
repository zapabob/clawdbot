param(
    [int]$GatewayPort = 18789,
    [string]$GatewayBind = "loopback",
    [string]$GatewayMode = "online",
    [string]$StackProfile = "desktop-stack",
    [switch]$SkipVoice,
    [switch]$SkipNgrok,
    [switch]$SkipGateway,
    [switch]$SkipTui,
    [switch]$SkipBrowser,
    [switch]$SkipCompanion,
    [switch]$SpeakOnReady
)

$ErrorActionPreference = "Stop"

$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
. "$PSScriptRoot\env-tools.ps1"

$envFile = Ensure-ProjectEnvFile -ProjectDir $ProjectDir
$desktopStateDir = Join-Path $ProjectDir ".openclaw-desktop"
$desktopConfigPath = Join-Path $desktopStateDir "openclaw.json"
New-Item -ItemType Directory -Path $desktopStateDir -Force | Out-Null

function Write-Step {
    param([string]$Message, [string]$Color = "Cyan")
    Write-Host $Message -ForegroundColor $Color
}

function Resolve-LaunchCommand {
    $pnpmCmd = Get-Command "pnpm.cmd" -ErrorAction SilentlyContinue
    if ($pnpmCmd) {
        return @{ FilePath = $pnpmCmd.Source; Prefix = @(); Label = "pnpm" }
    }
    $corepackCmd = Get-Command "corepack.cmd" -ErrorAction SilentlyContinue
    if ($corepackCmd) {
        return @{ FilePath = $corepackCmd.Source; Prefix = @("pnpm"); Label = "corepack pnpm" }
    }
    throw "Neither pnpm.cmd nor corepack.cmd was found in PATH."
}

function Assert-DependenciesReady {
    param([string]$ProjectDir)
    $nodeModulesBin  = Join-Path (Join-Path $ProjectDir "node_modules") ".bin"
    $nodeModulesPnpm = Join-Path (Join-Path $ProjectDir "node_modules") ".pnpm"
    if (-not (Test-Path $nodeModulesBin) -or -not (Test-Path $nodeModulesPnpm)) {
        Write-Host "ERROR: Dependencies missing. Run 'corepack pnpm install' in '$ProjectDir'." -ForegroundColor Red
        throw "Dependencies not installed."
    }
    $tsdownCmd = Join-Path $nodeModulesBin "tsdown.cmd"
    $tsdownBin = Join-Path $nodeModulesBin "tsdown"
    if (-not (Test-Path $tsdownCmd) -and -not (Test-Path $tsdownBin)) {
        Write-Host "ERROR: 'tsdown' missing. Run 'corepack pnpm install'." -ForegroundColor Red
        throw "Build tool 'tsdown' missing."
    }
}

function Start-StackProcess {
    param(
        [string]$Title,
        [string[]]$CommandParts,
        [string]$WorkingDirectory,
        [hashtable]$EnvironmentOverrides = @{},
        [ValidateSet("Normal","Minimized","Hidden")]
        [string]$WindowStyle = "Normal",
        [string]$LogFile = ""
    )
    $quotedCommandParts = $CommandParts | ForEach-Object { '"' + ($_ -replace '"', '\"') + '"' }
    $commandLine = "& " + ($quotedCommandParts -join " ")

    $envAssignments = @()
    foreach ($key in ($EnvironmentOverrides.Keys | Sort-Object)) {
        $escapedValue = ([string]$EnvironmentOverrides[$key]).Replace("'", "''")
        $envAssignments += "`$env:$key='$escapedValue'"
    }

    $scriptLines = @(
        "`$host.UI.RawUI.WindowTitle = '$($Title.Replace("'","''"))'",
        "Set-Location -Path '$($WorkingDirectory.Replace("'","''"))'"
    )
    if ($LogFile -ne "") {
        $scriptLines += "Start-Transcript -Path '$($LogFile.Replace("'","''"))' -Append | Out-Null"
    }
    if ($envAssignments.Count -gt 0) { $scriptLines += ($envAssignments -join "; ") }
    $scriptLines += $commandLine

    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", ($scriptLines -join "; ")
    ) -WorkingDirectory $WorkingDirectory -WindowStyle $WindowStyle | Out-Null
}

# --- Build-time env setup ---
$launcher = Resolve-LaunchCommand
$token = Get-OrCreateGatewayToken -EnvFile $envFile
$localGatewayUrl = "http://127.0.0.1:$GatewayPort"
$wsGatewayUrl    = "ws://127.0.0.1:$GatewayPort"

Set-EnvValues -EnvFile $envFile -Values @{
    OPENCLAW_GATEWAY_PORT      = $GatewayPort
    CLAWDBOT_GATEWAY_PORT      = $GatewayPort
    OPENCLAW_GATEWAY_BIND      = $GatewayBind
    CLAWDBOT_GATEWAY_BIND      = $GatewayBind
    OPENCLAW_GATEWAY_MODE      = $GatewayMode
    CLAWDBOT_GATEWAY_MODE      = $GatewayMode
    OPENCLAW_GATEWAY_TOKEN     = $token
    OPENCLAW_PROFILE           = $StackProfile
    OPENCLAW_STATE_DIR         = $desktopStateDir
    OPENCLAW_CONFIG_PATH       = $desktopConfigPath
    OPENCLAW_LOCAL_URL         = $localGatewayUrl
    OPENCLAW_BROWSER_URL       = $localGatewayUrl
    OPENCLAW_DESKTOP_LAUNCHER  = "scripts/launchers/launch-desktop-stack.ps1"
}

$envMap = Get-EnvMap -EnvFile $envFile

$processEnv = @{
    OPENCLAW_GATEWAY_PORT  = [string]$GatewayPort
    CLAWDBOT_GATEWAY_PORT  = [string]$GatewayPort
    OPENCLAW_GATEWAY_BIND  = $GatewayBind
    CLAWDBOT_GATEWAY_BIND  = $GatewayBind
    OPENCLAW_GATEWAY_MODE  = $GatewayMode
    CLAWDBOT_GATEWAY_MODE  = $GatewayMode
    OPENCLAW_GATEWAY_TOKEN = $token
    OPENCLAW_PROFILE       = $StackProfile
    OPENCLAW_STATE_DIR     = $desktopStateDir
    OPENCLAW_CONFIG_PATH   = $desktopConfigPath
}
foreach ($lineKey in @(
    "OLLAMA_API_KEY","LINE_CHANNEL_ACCESS_TOKEN","LINE_CHANNEL_SECRET",
    "LINE_WEBHOOK_PATH","LINE_WEBHOOK_URL","LINE_DM_POLICY","LINE_GROUP_POLICY"
)) {
    $val = [string]$envMap[$lineKey]
    if ($val) { $processEnv[$lineKey] = $val }
}
foreach ($entry in $processEnv.GetEnumerator()) {
    Set-Item -Path ("Env:" + $entry.Key) -Value ([string]$entry.Value)
}

# --- Banner ---
Write-Host ""
Write-Step "========================================"
Write-Step " OpenClaw Desktop Stack  (Parallel)"
Write-Step "========================================"
Write-Host "  Project : $ProjectDir"
Write-Host "  Gateway : $localGatewayUrl"
Write-Host "  Profile : $StackProfile"
Write-Host "  Runner  : $($launcher.Label)"
Write-Host ""

# --- [Pre] VOICEVOX ---
if (-not $SkipVoice) {
    Write-Host "  [VOICEVOX] Starting..." -ForegroundColor DarkCyan
    $voiceArgs = @("-ExecutionPolicy","Bypass","-File",(Join-Path $PSScriptRoot "start-voicevox.ps1"))
    if ($SpeakOnReady) { $voiceArgs += "-SpeakOnReady" }
    Start-Process -FilePath "powershell.exe" -ArgumentList $voiceArgs -WindowStyle Minimized
}

# --- [Pre] Ngrok ---
if (-not $SkipNgrok) {
    Write-Host "  [Ngrok   ] Starting..." -ForegroundColor DarkCyan
    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-ExecutionPolicy","Bypass","-File",(Join-Path $PSScriptRoot "start_ngrok.ps1"),
        "-Port",[string]$GatewayPort
    ) -WorkingDirectory $ProjectDir -WindowStyle Minimized | Out-Null
}

# --- Dependency check (done once, before burst) ---
if (-not $SkipGateway) {
    Assert-DependenciesReady -ProjectDir $ProjectDir
}

$logsDir = Join-Path $desktopStateDir "logs"
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

Write-Host ""
Write-Host "  ** Launching all subsystems simultaneously..." -ForegroundColor Yellow
Write-Host ""

# --- BURST: Gateway ---
if (-not $SkipGateway) {
    $gatewayLogFile = Join-Path $logsDir ("gateway-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".log")
    $gatewayCmd = @($launcher.FilePath) + $launcher.Prefix + @(
        "openclaw","--profile",$StackProfile,"gateway","run",
        "--allow-unconfigured","--force","--bind",$GatewayBind,
        "--port",[string]$GatewayPort,"--token",$token
    )
    Start-StackProcess -Title "OpenClaw Gateway [$GatewayPort]" `
        -WorkingDirectory $ProjectDir `
        -WindowStyle "Minimized" `
        -EnvironmentOverrides $processEnv `
        -LogFile $gatewayLogFile `
        -CommandParts $gatewayCmd
    Write-Host "  [Gateway ] process spawned  (port $GatewayPort)" -ForegroundColor Cyan
}

# --- BURST: TUI ---
if (-not $SkipTui) {
    $tuiCmd = @($launcher.FilePath) + $launcher.Prefix + @(
        "openclaw","--profile",$StackProfile,"tui",
        "--url",$wsGatewayUrl,"--token",$token
    )
    Start-StackProcess -Title "OpenClaw TUI" `
        -WorkingDirectory $ProjectDir `
        -WindowStyle "Normal" `
        -EnvironmentOverrides $processEnv `
        -CommandParts $tuiCmd
    Write-Host "  [TUI     ] process spawned" -ForegroundColor Cyan
}

# --- BURST: Live2D Companion ---
if (-not $SkipCompanion) {
    $companionDir = Join-Path $ProjectDir "extensions\live2d-companion"
    if (Test-Path $companionDir) {
        $electronBin = Join-Path $ProjectDir "node_modules\.bin\electron.cmd"
        if (-not (Test-Path $electronBin)) {
            $electronBin = Join-Path $companionDir "node_modules\.bin\electron.cmd"
        }
        if (-not (Test-Path $electronBin)) { $electronBin = "npx" }

        $companionCmd = if ($electronBin -eq "npx") {
            @("npx","--yes","electron",".")
        } else {
            @($electronBin, ".")
        }

        Start-StackProcess -Title "Hakua Live2D Companion" `
            -WorkingDirectory $companionDir `
            -WindowStyle "Minimized" `
            -EnvironmentOverrides $processEnv `
            -CommandParts $companionCmd
        Write-Host "  [Companion] process spawned  (Live2D + DD support)" -ForegroundColor Cyan
    } else {
        Write-Host "  [Companion] directory not found, skipping" -ForegroundColor Yellow
    }
}

# --- Browser: wait for Gateway then open ---
if (-not $SkipBrowser) {
    $browserUrl = "$localGatewayUrl/#token=$token"

    if (-not $SkipGateway) {
        Write-Host ""
        Write-Host "  Waiting for gateway on :$GatewayPort" -ForegroundColor Gray -NoNewline

        $pollJob = Start-Job -ScriptBlock {
            param([int]$port, [int]$maxSecs)
            $deadline = [DateTime]::Now.AddSeconds($maxSecs)
            while ([DateTime]::Now -lt $deadline) {
                $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
                if ($conn) { return $true }
                Start-Sleep -Milliseconds 600
            }
            return $false
        } -ArgumentList $GatewayPort, 30

        $gatewayReady = $false
        for ($tick = 0; $tick -lt 31; $tick++) {
            if ($pollJob.State -in "Completed","Failed","Stopped") {
                $gatewayReady = [bool](Receive-Job $pollJob -ErrorAction SilentlyContinue)
                break
            }
            Write-Host "." -NoNewline -ForegroundColor DarkGray
            Start-Sleep -Milliseconds 1000
        }
        Remove-Job $pollJob -Force -ErrorAction SilentlyContinue
        Write-Host ""

        if ($gatewayReady) {
            Write-Host "  [Browser ] Gateway ready - opening browser" -ForegroundColor Green
        } else {
            Write-Host "  [Browser ] Gateway not yet listening - opening anyway" -ForegroundColor Yellow
        }
    }

    Start-Process $browserUrl | Out-Null
}

# --- Done ---
Write-Host ""
Write-Step "  All subsystems launched." "Green"
Write-Host "  Gateway : $localGatewayUrl"
Write-Host "  Token   : $token"
Write-Host "  Env     : $envFile"
Write-Host ""
