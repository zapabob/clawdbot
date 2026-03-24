param(
    [int]$GatewayPort = 18789,
    [string]$GatewayBind = "loopback",
    [string]$GatewayMode = "local",
    [string]$StackProfile = "desktop-stack",
    [switch]$SkipVoice,
    [switch]$SkipNgrok,
    [switch]$SkipGateway,
    [switch]$SkipTui,
    [switch]$SkipBrowser,
    [switch]$SkipCompanion,
    [switch]$SkipHypura,
    [int]$HypuraWaitSeconds = 120,
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

function Test-HypuraRunning {
    param([string]$Url = "http://127.0.0.1:8080/api/tags")
    try {
        $res = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
        return ($res.StatusCode -ge 200 -and $res.StatusCode -lt 300)
    } catch {
        return $false
    }
}

function Wait-HypuraReady {
    param(
        [int]$TimeoutSec = 120,
        [string]$Url = "http://127.0.0.1:8080/api/tags"
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-HypuraRunning -Url $Url) {
            return $true
        }
        Start-Sleep -Milliseconds 800
    }
    return $false
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

# --- Cleanup existing processes ---
Write-Step "  Cleaning up existing OpenClaw processes..." -Color "Yellow"
$processesToKill = @("node", "electron")
foreach ($procName in $processesToKill) {
    Get-Process -Name $procName -ErrorAction SilentlyContinue | Where-Object { 
        $_.CommandLine -like "*openclaw*" -or $_.CommandLine -like "*live2d-companion*"
    } | Stop-Process -Force -ErrorAction SilentlyContinue
}
# Also kill common ports if needed (GatewayPort)
$portProc = Get-NetTCPConnection -LocalPort $GatewayPort -ErrorAction SilentlyContinue
if ($portProc) {
    Stop-Process -Id $portProc.OwningProcess -Force -ErrorAction SilentlyContinue
}
Write-Host "  Cleanup complete." -ForegroundColor Green
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

# --- [Pre] Hypura ---
if (-not $SkipHypura) {
    Write-Host "  [Hypura  ] Central provider mode enabled." -ForegroundColor DarkCyan
    if (Test-HypuraRunning) {
        Write-Host "  [Hypura  ] Already running on 127.0.0.1:8080" -ForegroundColor Green
    } else {
        $hypuraCmd = Get-Command "hypura.exe" -ErrorAction SilentlyContinue
        if (-not $hypuraCmd) {
            $hypuraCmd = Get-Command "hypura" -ErrorAction SilentlyContinue
        }

        if ($hypuraCmd) {
            Write-Host "  [Hypura  ] Not running. Starting hypura serve..." -ForegroundColor DarkCyan
            Start-Process -FilePath $hypuraCmd.Source -ArgumentList @("serve") `
                -WorkingDirectory $ProjectDir -WindowStyle Minimized | Out-Null

            Write-Host "  [Hypura  ] Waiting for /api/tags readiness (timeout: $HypuraWaitSeconds sec)..." -ForegroundColor Gray
            if (Wait-HypuraReady -TimeoutSec $HypuraWaitSeconds) {
                Write-Host "  [Hypura  ] Ready. Proceeding with stack launch." -ForegroundColor Green
            } else {
                Write-Host "  [Hypura  ] WARNING: Hypura did not become ready within $HypuraWaitSeconds seconds. Continuing anyway." -ForegroundColor Yellow
            }
        } else {
            Write-Host "  [Hypura  ] WARNING: hypura executable was not found in PATH. Skipping Hypura provider." -ForegroundColor Yellow
            $SkipHypura = $true
        }
    }
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

# --- Browser: launch asynchronously (poll in background) ---
if (-not $SkipBrowser) {
    $browserUrl = "$localGatewayUrl/#token=$token"
    
    $browserLauncher = {
        param($url, $port)
        $deadline = [DateTime]::Now.AddSeconds(45)
        while ([DateTime]::Now -lt $deadline) {
            $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
            if ($conn) { break }
            Start-Sleep -Milliseconds 800
        }
        # Open browser regardless of readiness after timeout, or immediately if ready
        Start-Process $url
    }.ToString()

    Start-Process powershell.exe -ArgumentList "-NoProfile", "-WindowStyle", "Hidden", "-Command", "& { $browserLauncher } '$browserUrl' $GatewayPort"
    Write-Host "  [Browser ] Background polling started (will open when gateway ready)" -ForegroundColor Cyan
}

# --- Done ---
Write-Host ""
Write-Step "  All subsystems launched." "Green"
Write-Host "  Gateway : $localGatewayUrl"
Write-Host "  Token   : $token"
Write-Host "  Env     : $envFile"
Write-Host ""
