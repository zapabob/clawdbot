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
    [switch]$SkipHypuraHarness,
    [int]$HypuraWaitSeconds = 120,
    [int]$HypuraHarnessWaitSeconds = 45,
    # When false (default), ngrok gets -ForceRestart so a fresh public URL is issued each stack launch.
    [switch]$NgrokReuse,
    [switch]$SpeakOnReady,
    # Desktop shortcut: show Gateway + TUI in normal (visible) PowerShell windows instead of Minimized/Hidden.
    [switch]$ForceVisibleGatewayAndTui
)

[console]::Title = "ASI-Hakua-Sovereign-Portal"

Write-Host @"
     █████╗ ███████╗██╗    ██╗  ██╗ █████╗ ██╗   ██╗██╗   ██╗ █████╗ 
    ██╔══██╗██╔════╝██║    ██║  ██║██╔══██╗██║   ██║██║   ██║██╔══██╗
    ███████║███████╗██║    ███████║███████║██║   ██║██║   ██║███████║
    ██╔══██║╚════██║██║    ██╔══██║██╔══██║██║   ██║██║   ██║██╔══██║
    ██║  ██║███████║██║    ██║  ██║██║  ██║╚██████╔╝╚██████╔╝██║  ██║
    ╚═╝  ╚═╝╚══════╝╚═╝    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝
                      [ ASI-HAKUA SOVEREIGN PORTAL ]
"@ -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

# Explorer / .lnk launches often inherit a minimal PATH (no pnpm, no node). Prepend common locations.
$pathBootstrapDirs = @(
    (Join-Path $env:ProgramFiles "nodejs"),
    "${env:ProgramFiles(x86)}\nodejs",
    (Join-Path $env:APPDATA "npm"),
    (Join-Path $env:LOCALAPPDATA "pnpm"),
    (Join-Path $env:USERPROFILE ".local\bin"),
    (Join-Path $env:USERPROFILE "scoop\shims")
)
foreach ($dir in $pathBootstrapDirs) {
    if ($dir -and (Test-Path -LiteralPath $dir)) {
        $env:Path = "$dir;$env:Path"
    }
}

$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.Parent.FullName
$projectLocalBin = Join-Path $ProjectDir "node_modules\.bin"
if (Test-Path -LiteralPath $projectLocalBin) {
    $env:Path = "$projectLocalBin;$env:Path"
}
. "$PSScriptRoot\..\env-tools.ps1"

$envFile = Ensure-ProjectEnvFile -ProjectDir $ProjectDir
$desktopStateDir = Join-Path $ProjectDir ".openclaw-desktop"
$desktopConfigPath = Join-Path $desktopStateDir "openclaw.json"
New-Item -ItemType Directory -Path $desktopStateDir -Force | Out-Null

Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir
Add-SovereignDevToolsToPath

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
    throw 'Neither pnpm.cmd nor corepack.cmd was found in PATH. Install Node.js, run corepack enable, ensure pnpm is on PATH, or open PowerShell from a login shell where pnpm works, then retry the shortcut.'
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
        [string]$LogFile = "",
        [bool]$NoExit = $true
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

    $joined = ($scriptLines -join "; ")
    if ($NoExit) {
        $psArgs = @("-NoProfile", "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $joined)
    } else {
        $psArgs = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $joined)
    }

    Start-Process -FilePath "powershell.exe" -ArgumentList $psArgs `
        -WorkingDirectory $WorkingDirectory -WindowStyle $WindowStyle | Out-Null
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

function Get-HypuraHarnessPort {
    param(
        [string]$HarnessDir,
        [int]$FallbackPort = 18794
    )
    $cfgPath = Join-Path $HarnessDir "harness.config.json"
    if (-not (Test-Path $cfgPath)) {
        return $FallbackPort
    }
    try {
        $raw = Get-Content -Path $cfgPath -Raw -Encoding UTF8
        $cfg = $raw | ConvertFrom-Json
        $port = [int]$cfg.daemon_port
        if ($port -gt 0 -and $port -le 65535) {
            return $port
        }
    } catch {
        Write-Host "  [HypuraHX] Failed to parse harness.config.json; fallback port $FallbackPort." -ForegroundColor Yellow
    }
    return $FallbackPort
}

function Test-HypuraHarnessRunning {
    param([string]$Url)
    try {
        $res = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
        return ($res.StatusCode -ge 200 -and $res.StatusCode -lt 300)
    } catch {
        return $false
    }
}

function Wait-HypuraHarnessReady {
    param(
        [string]$Url,
        [int]$TimeoutSec = 45
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-HypuraHarnessRunning -Url $Url) {
            return $true
        }
        Start-Sleep -Milliseconds 800
    }
    return $false
}

function Build-DesktopStackProcessEnvTable {
    param(
        [Parameter(Mandatory = $true)][string]$ProjectDir,
        [Parameter(Mandatory = $true)][int]$GatewayPort,
        [Parameter(Mandatory = $true)][string]$GatewayBind,
        [Parameter(Mandatory = $true)][string]$GatewayMode,
        [Parameter(Mandatory = $true)][string]$StackProfile,
        [Parameter(Mandatory = $true)][string]$DesktopStateDir,
        [Parameter(Mandatory = $true)][string]$DesktopConfigPath,
        [Parameter(Mandatory = $true)][string]$Token,
        [Parameter(Mandatory = $true)][string]$LocalGatewayUrl,
        [Parameter(Mandatory = $true)][string]$WsGatewayUrl
    )
    $mergedEnv = Get-MergedEnvMap -ProjectDir $ProjectDir
    $pe = @{}
    foreach ($key in $mergedEnv.Keys) {
        if ($null -ne $mergedEnv[$key]) {
            $pe[$key] = [string]$mergedEnv[$key]
        }
    }
    $pe["OPENCLAW_GATEWAY_PORT"]   = [string]$GatewayPort
    $pe["CLAWDBOT_GATEWAY_PORT"]   = [string]$GatewayPort
    $pe["OPENCLAW_GATEWAY_BIND"]   = $GatewayBind
    $pe["CLAWDBOT_GATEWAY_BIND"]   = $GatewayBind
    $pe["OPENCLAW_GATEWAY_MODE"]   = $GatewayMode
    $pe["CLAWDBOT_GATEWAY_MODE"]   = $GatewayMode
    $pe["OPENCLAW_GATEWAY_TOKEN"]  = $Token
    $pe["OPENCLAW_PROFILE"]        = $StackProfile
    $pe["OPENCLAW_STATE_DIR"]      = $DesktopStateDir
    $pe["OPENCLAW_CONFIG_PATH"]    = $DesktopConfigPath
    $pe["OPENCLAW_LOCAL_URL"]      = $LocalGatewayUrl
    $pe["OPENCLAW_BROWSER_URL"]    = $LocalGatewayUrl
    $pe["OPENCLAW_GATEWAY_WS_URL"] = $WsGatewayUrl
    $pe["OPENCLAW_DESKTOP_LAUNCHER"] = "scripts/launchers/launch-desktop-stack.ps1"
    $pe["Path"]                    = $env:Path
    return $pe
}

function Apply-DesktopStackProcessEnvToCurrentSession {
    param([Parameter(Mandatory = $true)][hashtable]$ProcessEnv)
    foreach ($entry in $ProcessEnv.GetEnumerator()) {
        try {
            Set-Item -Path ("Env:" + $entry.Key) -Value ([string]$entry.Value)
        } catch {
            Write-Host ("  [env] Skip invalid env key: {0}" -f $entry.Key) -ForegroundColor DarkGray
        }
    }
}

# --- Build-time env setup (.env + .env.local merged, then dynamic overlays for all child processes) ---
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

Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir
Add-SovereignDevToolsToPath

$processEnv = Build-DesktopStackProcessEnvTable `
    -ProjectDir $ProjectDir `
    -GatewayPort $GatewayPort `
    -GatewayBind $GatewayBind `
    -GatewayMode $GatewayMode `
    -StackProfile $StackProfile `
    -DesktopStateDir $desktopStateDir `
    -DesktopConfigPath $desktopConfigPath `
    -Token $token `
    -LocalGatewayUrl $localGatewayUrl `
    -WsGatewayUrl $wsGatewayUrl
Apply-DesktopStackProcessEnvToCurrentSession -ProcessEnv $processEnv

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
# Also kill processes listening on GatewayPort (best-effort; may fail without rights or on older hosts)
try {
    $listeners = @(Get-NetTCPConnection -LocalPort $GatewayPort -State Listen -ErrorAction SilentlyContinue)
    foreach ($c in $listeners) {
        $owningPid = [int]$c.OwningProcess
        if ($owningPid -gt 0) {
            Stop-Process -Id $owningPid -Force -ErrorAction SilentlyContinue
        }
    }
} catch {
    Write-Host "  [cleanup] Port $GatewayPort cleanup skipped: $($_.Exception.Message)" -ForegroundColor DarkGray
}
Write-Host "  Cleanup complete." -ForegroundColor Green
Write-Host ""

# --- [Pre] VOICEVOX ---
if (-not $SkipVoice) {
    Write-Host "  [VOICEVOX] Starting (env injected)..." -ForegroundColor DarkCyan
    $voiceScript = Join-Path $PSScriptRoot "..\start-voicevox.ps1"
    $voiceParts = @(
        "powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $voiceScript
    )
    if ($SpeakOnReady) { $voiceParts += "-SpeakOnReady" }
    Start-StackProcess -Title "VOICEVOX" `
        -WorkingDirectory $ProjectDir `
        -WindowStyle "Minimized" `
        -NoExit:$false `
        -EnvironmentOverrides $processEnv `
        -CommandParts $voiceParts
}

# --- [Pre] Hypura ---
if (-not $SkipHypura) {
    Write-Host "  [Hypura  ] Central provider mode enabled." -ForegroundColor DarkCyan
    if (Test-HypuraRunning) {
        Write-Host "  [Hypura  ] Already running on 127.0.0.1:8080" -ForegroundColor Green
    } else {
        $hypuraExe = Resolve-HypuraExecutablePath

        if ($hypuraExe) {
            $ggufPath = $null
            foreach ($cand in @([string]$env:HAKUA_HYPURA_GGUF, [string]$env:HYPURA_GGUF)) {
                $t = $cand.Trim()
                if ($t -and (Test-Path -LiteralPath $t)) {
                    $ggufPath = $t
                    break
                }
            }
            if (-not $ggufPath) {
                Write-Host "  [Hypura  ] Skipping auto-start: set HAKUA_HYPURA_GGUF (or HYPURA_GGUF) in .env to full path of .gguf" -ForegroundColor Yellow
                Write-Host "  [Hypura  ] Official CLI: hypura serve <model.gguf> [--port 8080] [--context N]" -ForegroundColor DarkGray
            } else {
                $hypPort = [string]$env:HYPURA_PORT
                if ([string]::IsNullOrWhiteSpace($hypPort)) { $hypPort = "8080" }
                $hypCtx = [string]$env:HYPURA_CONTEXT
                if ([string]::IsNullOrWhiteSpace($hypCtx)) { $hypCtx = "32768" }
                $hypuraParts = @($hypuraExe, "serve", $ggufPath, "--port", $hypPort, "--context", $hypCtx)
                Write-Host "  [Hypura  ] Starting: serve $ggufPath --port $hypPort --context $hypCtx" -ForegroundColor DarkCyan
                Start-StackProcess -Title "Hypura provider" `
                    -WorkingDirectory $ProjectDir `
                    -WindowStyle "Minimized" `
                    -NoExit:$false `
                    -EnvironmentOverrides $processEnv `
                    -CommandParts $hypuraParts

                Write-Host "  [Hypura  ] Waiting for /api/tags readiness (timeout: $HypuraWaitSeconds sec)..." -ForegroundColor Gray
                if (Wait-HypuraReady -TimeoutSec $HypuraWaitSeconds) {
                    Write-Host "  [Hypura  ] Ready. Proceeding with stack launch." -ForegroundColor Green
                } else {
                    Write-Host "  [Hypura  ] WARNING: Hypura did not become ready within $HypuraWaitSeconds seconds. Continuing anyway." -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "  [Hypura  ] WARNING: hypura not found. Set HAKUA_HYPURA_EXE (or HYPURA_EXE) to hypura.exe, or add hypura to PATH. Skipping Hypura provider." -ForegroundColor Yellow
            $SkipHypura = $true
        }
    }
}

# --- [Pre] Hypura Python Harness (FastAPI; auto-start + health check) ---
if (-not $SkipHypuraHarness) {
    $hypuraHarnessDir = Join-Path $ProjectDir "extensions\hypura-harness\scripts"
    $harnessEntry = Join-Path $hypuraHarnessDir "harness_daemon.py"
    $pythonExe = Join-Path $ProjectDir ".venv\Scripts\python.exe"
    
    $harnessPort = Get-HypuraHarnessPort -HarnessDir $hypuraHarnessDir
    $harnessStatusUrl = "http://127.0.0.1:$harnessPort/status"

    if (Test-HypuraHarnessRunning -Url $harnessStatusUrl) {
        Write-Host "  [HypuraHX] Already running on 127.0.0.1:$harnessPort" -ForegroundColor Green
    } elseif ((Test-Path $pythonExe) -and (Test-Path $harnessEntry)) {
        Write-Host "  [HypuraHX] Starting Hypura harness daemon via substrate (.venv, env injected)..." -ForegroundColor DarkCyan
        Start-StackProcess -Title "Hypura Harness daemon" `
            -WorkingDirectory $hypuraHarnessDir `
            -WindowStyle "Hidden" `
            -NoExit:$false `
            -EnvironmentOverrides $processEnv `
            -CommandParts @($pythonExe, $harnessEntry)
        
        Write-Host "  [HypuraHX] Waiting for /status readiness (timeout: $HypuraHarnessWaitSeconds sec)..." -ForegroundColor Gray
        if (Wait-HypuraHarnessReady -Url $harnessStatusUrl -TimeoutSec $HypuraHarnessWaitSeconds) {
            Write-Host "  [HypuraHX] Ready. Proceeding with stack launch." -ForegroundColor Green
        } else {
            Write-Host "  [HypuraHX] WARNING: harness did not become ready within $HypuraHarnessWaitSeconds seconds. Continuing anyway." -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [HypuraHX] Substrate .venv or official harness script missing; skipping auto-start." -ForegroundColor Yellow
    }

    # --- [Shinka] Evolution Monitor (ASI Pulse) ---
    $monitorEntry = Join-Path $hypuraHarnessDir "shinka_monitor.py"
    if ((Test-Path $pythonExe) -and (Test-Path $monitorEntry)) {
        Write-Host "  [ShinkaEV] Starting ASI Evolution Monitor (Pulse, env injected)..." -ForegroundColor Magenta
        Start-StackProcess -Title "Shinka Evolution Monitor" `
            -WorkingDirectory $hypuraHarnessDir `
            -WindowStyle "Minimized" `
            -NoExit:$false `
            -EnvironmentOverrides $processEnv `
            -CommandParts @($pythonExe, $monitorEntry)
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

$gatewayWindowStyle = if ($ForceVisibleGatewayAndTui) { "Normal" } else { "Minimized" }
$tuiWindowStyle     = "Normal"
if ($ForceVisibleGatewayAndTui) {
    Write-Host "  [UI      ] ForceVisibleGatewayAndTui: Gateway window -> $gatewayWindowStyle, TUI -> $tuiWindowStyle" -ForegroundColor DarkCyan
}

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
        -WindowStyle $gatewayWindowStyle `
        -EnvironmentOverrides $processEnv `
        -LogFile $gatewayLogFile `
        -CommandParts $gatewayCmd
    Write-Host "  [Gateway ] process spawned  (port $GatewayPort)" -ForegroundColor Cyan

    # --- Ngrok: MUST run after Gateway is listening (ERR_NGROK_8012 / undefined upstream if too early) ---
    if (-not $SkipNgrok) {
        Write-Host "  [Ngrok   ] Waiting for Gateway TCP listen on $GatewayPort (up to 120s; reduces ERR_NGROK_8012)..." -ForegroundColor DarkCyan
        $gwDeadline = [DateTime]::Now.AddSeconds(120)
        $gwListen = $false
        while ([DateTime]::Now -lt $gwDeadline) {
            $listen = @(Get-NetTCPConnection -LocalPort $GatewayPort -State Listen -ErrorAction SilentlyContinue)
            if ($listen.Count -gt 0) {
                $gwListen = $true
                break
            }
            Start-Sleep -Milliseconds 500
        }
        if (-not $gwListen) {
            Write-Host "  [Ngrok   ] WARNING: Gateway not listening on $GatewayPort within 120s; starting ngrok anyway (may show ERR_NGROK_8012 until gateway binds)." -ForegroundColor Yellow
        } else {
            Write-Host "  [Ngrok   ] Gateway port is listening; starting tunnel (env injected)..." -ForegroundColor DarkCyan
        }
        Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir
        $ngrokTunnelPort = Get-NgrokUpstreamTunnelMatchPort -GatewayPort $GatewayPort -ProjectDir $ProjectDir
        if ($ngrokTunnelPort -ne $GatewayPort) {
            Write-Host "  [Ngrok   ] Upstream targets port $ngrokTunnelPort (not Gateway $GatewayPort); waiting for TCP listen (up to 120s; Telegram webhook / custom listener)..." -ForegroundColor DarkCyan
            $upDeadline = [DateTime]::Now.AddSeconds(120)
            $upListen = $false
            while ([DateTime]::Now -lt $upDeadline) {
                $listenUp = @(Get-NetTCPConnection -LocalPort $ngrokTunnelPort -State Listen -ErrorAction SilentlyContinue)
                if ($listenUp.Count -gt 0) {
                    $upListen = $true
                    break
                }
                Start-Sleep -Milliseconds 500
            }
            if (-not $upListen) {
                Write-Host "  [Ngrok   ] WARNING: Port $ngrokTunnelPort not listening within 120s; ngrok may show ERR_NGROK_8012 until the listener binds." -ForegroundColor Yellow
            } else {
                Write-Host "  [Ngrok   ] Upstream port $ngrokTunnelPort is listening." -ForegroundColor DarkCyan
            }
        }
        $ngrokScript = Join-Path $PSScriptRoot "..\start_ngrok.ps1"
        $ngrokParts = @(
            "powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $ngrokScript,
            "-Port", [string]$GatewayPort,
            "-UpstreamWaitSeconds", "120"
        )
        if (-not $NgrokReuse) {
            $ngrokParts += "-ForceRestart"
        }
        Start-StackProcess -Title "ngrok tunnel" `
            -WorkingDirectory $ProjectDir `
            -WindowStyle "Minimized" `
            -NoExit:$false `
            -EnvironmentOverrides $processEnv `
            -CommandParts $ngrokParts

        Write-Host "  [Ngrok   ] Waiting for public URL (localhost:4040) and syncing OPENCLAW_PUBLIC_URL / webhooks to .env (up to 90s)..." -ForegroundColor DarkCyan
        $syncedNgrokUrl = Sync-NgrokPublicUrlToEnv -ProjectDir $ProjectDir -MaxWaitSeconds 90 -PollMs 750 -GatewayPort $GatewayPort
        Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir
        Add-SovereignDevToolsToPath
        $processEnv = Build-DesktopStackProcessEnvTable `
            -ProjectDir $ProjectDir `
            -GatewayPort $GatewayPort `
            -GatewayBind $GatewayBind `
            -GatewayMode $GatewayMode `
            -StackProfile $StackProfile `
            -DesktopStateDir $desktopStateDir `
            -DesktopConfigPath $desktopConfigPath `
            -Token $token `
            -LocalGatewayUrl $localGatewayUrl `
            -WsGatewayUrl $wsGatewayUrl
        Apply-DesktopStackProcessEnvToCurrentSession -ProcessEnv $processEnv
        if ($syncedNgrokUrl) {
            Write-Host "  [Ngrok   ] Public URL synced; TUI/Companion/Browser inherit: $syncedNgrokUrl" -ForegroundColor Green
        } else {
            Write-Host "  [Ngrok   ] WARNING: Public URL not ready within 90s (check ngrok window / auth). Child processes may lack OPENCLAW_PUBLIC_URL." -ForegroundColor Yellow
        }
    }
}

if ($ForceVisibleGatewayAndTui -and -not $SkipGateway -and -not $SkipTui) {
    Write-Host "  [TUI     ] Brief pause so Gateway console can bind before TUI (force-visible mode)..." -ForegroundColor DarkGray
    Start-Sleep -Seconds 2
}

# --- BURST: TUI ---
if (-not $SkipTui) {
    # Desktop stack: cap initial history below CLI default (200) to reduce first-connect load; for near-full history run `openclaw tui` manually or raise the value.
    $tuiCmd = @($launcher.FilePath) + $launcher.Prefix + @(
        "openclaw","--profile",$StackProfile,"tui",
        "--history-limit","120",
        "--url",$wsGatewayUrl,"--token",$token
    )
    Start-StackProcess -Title "OpenClaw TUI" `
        -WorkingDirectory $ProjectDir `
        -WindowStyle $tuiWindowStyle `
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

# --- Browser: launch asynchronously (poll in background) with same env as Gateway/TUI/ngrok ---
if (-not $SkipBrowser) {
    $browserUrl = "$localGatewayUrl/#token=$token"
    $browserScript = Join-Path $PSScriptRoot "..\browser-wait-and-open.ps1"
    Start-StackProcess -Title "OpenClaw Browser" `
        -WorkingDirectory $ProjectDir `
        -WindowStyle "Hidden" `
        -NoExit:$false `
        -EnvironmentOverrides $processEnv `
        -CommandParts @(
            "powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $browserScript,
            "-GatewayPort", [string]$GatewayPort, "-Url", $browserUrl
        )
    Write-Host "  [Browser ] Background polling started (env injected; opens when gateway ready)" -ForegroundColor Cyan
}

# --- Done ---
Write-Host ""
Write-Step "  All subsystems launched." "Green"
Write-Host "  Gateway : $localGatewayUrl"
Write-Host "  Token   : $token"
Write-Host "  Env     : $envFile"
Write-Host ""
