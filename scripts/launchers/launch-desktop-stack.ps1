param(
    [int]$GatewayPort = 18789,
    [string]$GatewayBind = "loopback",
    [string]$GatewayMode = "online",
    [switch]$SkipVoice,
    [switch]$SkipNgrok,
    [switch]$SkipGateway,
    [switch]$SkipTui,
    [switch]$SkipBrowser,
    [switch]$SpeakOnReady
)

$ErrorActionPreference = "Stop"

$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
. "$PSScriptRoot\env-tools.ps1"

$envFile = Ensure-ProjectEnvFile -ProjectDir $ProjectDir

function Write-Step {
    param(
        [string]$Message,
        [string]$Color = "Cyan"
    )

    Write-Host $Message -ForegroundColor $Color
}

function Resolve-LaunchCommand {
    $pnpmCmd = Get-Command "pnpm.cmd" -ErrorAction SilentlyContinue
    if ($pnpmCmd) {
        return @{
            FilePath = $pnpmCmd.Source
            Prefix   = @()
            Label    = "pnpm"
        }
    }

    $corepackCmd = Get-Command "corepack.cmd" -ErrorAction SilentlyContinue
    if ($corepackCmd) {
        return @{
            FilePath = $corepackCmd.Source
            Prefix   = @("pnpm")
            Label    = "corepack pnpm"
        }
    }

    throw "Neither pnpm.cmd nor corepack.cmd was found in PATH."
}

function Test-PortListening {
    param([int]$Port)

    $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return ($null -ne $listener)
}

function Wait-HttpReady {
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 60
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -ge 200) {
                return $true
            }
        } catch {
            Start-Sleep -Milliseconds 800
        }
    }

    return $false
}

function Start-StackProcess {
    param(
        [string]$Title,
        [string[]]$CommandParts,
        [string]$WorkingDirectory,
        [hashtable]$EnvironmentOverrides = @{},
        [ValidateSet("Normal", "Minimized", "Hidden")]
        [string]$WindowStyle = "Normal"
    )

    $quotedCommandParts = $CommandParts | ForEach-Object {
        '"' + ($_ -replace '"', '\"') + '"'
    }
    $commandLine = "& " + ($quotedCommandParts -join " ")

    $envAssignments = @()
    foreach ($key in ($EnvironmentOverrides.Keys | Sort-Object)) {
        $escapedValue = [string]$EnvironmentOverrides[$key]
        $escapedValue = $escapedValue.Replace("'", "''")
        $envAssignments += "`$env:$key='$escapedValue'"
    }

    $scriptLines = @(
        "`$host.UI.RawUI.WindowTitle = '$($Title.Replace("'", "''"))'",
        "Set-Location -Path '$($WorkingDirectory.Replace("'", "''"))'"
    )
    if ($envAssignments.Count -gt 0) {
        $scriptLines += ($envAssignments -join "; ")
    }
    $scriptLines += $commandLine

    $command = $scriptLines -join "; "

    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        $command
    ) -WorkingDirectory $WorkingDirectory -WindowStyle $WindowStyle | Out-Null
}

$launcher = Resolve-LaunchCommand
$token = Get-OrCreateGatewayToken -EnvFile $envFile
$localGatewayUrl = "http://127.0.0.1:$GatewayPort"

Set-EnvValues -EnvFile $envFile -Values @{
    OPENCLAW_GATEWAY_PORT = $GatewayPort
    CLAWDBOT_GATEWAY_PORT = $GatewayPort
    OPENCLAW_GATEWAY_BIND = $GatewayBind
    CLAWDBOT_GATEWAY_BIND = $GatewayBind
    OPENCLAW_GATEWAY_MODE = $GatewayMode
    CLAWDBOT_GATEWAY_MODE = $GatewayMode
    OPENCLAW_GATEWAY_TOKEN = $token
    OPENCLAW_LOCAL_URL = $localGatewayUrl
    OPENCLAW_BROWSER_URL = $localGatewayUrl
    OPENCLAW_DESKTOP_LAUNCHER = "scripts/launchers/launch-desktop-stack.ps1"
}

Write-Host ""
Write-Step "========================================"
Write-Step " OpenClaw Desktop Stack Launcher"
Write-Step "========================================"
Write-Host "Project : $ProjectDir"
Write-Host "Gateway : $localGatewayUrl"
Write-Host "Runner  : $($launcher.Label)"
Write-Host ""

if (-not $SkipVoice) {
    Write-Step "[1/5] Starting VOICEVOX..."
    $voiceArgs = @(
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        (Join-Path $PSScriptRoot "start-voicevox.ps1")
    )
    if ($SpeakOnReady) {
        $voiceArgs += "-SpeakOnReady"
    }
    & powershell.exe @voiceArgs
}

if (-not $SkipNgrok) {
    Write-Step "[2/5] Syncing ngrok tunnel..."
    & powershell.exe -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "start_ngrok.ps1") -Port $GatewayPort

    $envMap = Get-EnvMap -EnvFile $envFile
    $publicUrl = [string]$envMap["OPENCLAW_PUBLIC_URL"]
    if (-not $publicUrl) {
        $publicUrl = [string]$envMap["WEBHOOK_BASE_URL"]
    }
    if ($publicUrl) {
        $lineWebhookPath = [string]$envMap["LINE_WEBHOOK_PATH"]
        if (-not $lineWebhookPath) {
            $lineWebhookPath = "/line/webhook"
        }
        if (-not $lineWebhookPath.StartsWith("/")) {
            $lineWebhookPath = "/$lineWebhookPath"
        }
        Set-EnvValues -EnvFile $envFile -Values @{
            LINE_WEBHOOK_URL = "$publicUrl$lineWebhookPath"
            OPENCLAW_PUBLIC_GATEWAY_URL = $publicUrl
        }
    }
}

$processEnv = @{
    OPENCLAW_GATEWAY_PORT = [string]$GatewayPort
    CLAWDBOT_GATEWAY_PORT = [string]$GatewayPort
    OPENCLAW_GATEWAY_BIND = $GatewayBind
    CLAWDBOT_GATEWAY_BIND = $GatewayBind
    OPENCLAW_GATEWAY_MODE = $GatewayMode
    CLAWDBOT_GATEWAY_MODE = $GatewayMode
    OPENCLAW_GATEWAY_TOKEN = $token
}

if (-not $SkipGateway) {
    Write-Step "[3/5] Ensuring gateway is running..."
    if (Test-PortListening -Port $GatewayPort) {
        Write-Host "Gateway already listening on $GatewayPort." -ForegroundColor Yellow
    } else {
        Start-StackProcess -Title "OpenClaw Gateway" -WorkingDirectory $ProjectDir -WindowStyle "Minimized" -EnvironmentOverrides $processEnv -CommandParts (@($launcher.FilePath) + $launcher.Prefix + @("start"))
        if (-not (Wait-HttpReady -Url $localGatewayUrl -TimeoutSeconds 75)) {
            throw "Gateway did not become ready at $localGatewayUrl"
        }
    }
}

if (-not $SkipTui) {
    Write-Step "[4/5] Launching TUI..."
    Start-StackProcess -Title "OpenClaw TUI" -WorkingDirectory $ProjectDir -EnvironmentOverrides $processEnv -CommandParts (@($launcher.FilePath) + $launcher.Prefix + @("tui"))
}

if (-not $SkipBrowser) {
    Write-Step "[5/5] Opening browser..."
    $browserUrl = "$localGatewayUrl/?token=$token"
    Start-Process $browserUrl | Out-Null
    Set-EnvValues -EnvFile $envFile -Values @{
        OPENCLAW_BROWSER_URL = $browserUrl
    }
}

Write-Host ""
Write-Step "Desktop stack is ready." "Green"
Write-Host "Gateway URL : $localGatewayUrl"
Write-Host "Token       : $token"
Write-Host "Env file    : $envFile"
