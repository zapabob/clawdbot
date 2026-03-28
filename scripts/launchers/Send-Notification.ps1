param(
    [string]$Message,
    [string]$Type = "HEARTBEAT"
)

$ErrorActionPreference = "SilentlyContinue"
$ProjectDir = (Get-Item $PSScriptRoot).Parent.Parent.FullName
. "$PSScriptRoot\env-tools.ps1"
Merge-OpenClawEnvToProcess -ProjectDir $ProjectDir
Set-OpenClawDesktopConfigEnv -ProjectDir $ProjectDir

# Read config from openclaw.json (single source of truth)
$ocJsonPath = Join-Path $ProjectDir ".openclaw-desktop\openclaw.json"
$tgToken    = ""
$lineToken  = ""
$gwPort     = 18789
$gwToken    = ""   # hooks.token
$tgChatId    = $env:TELEGRAM_CHAT_ID
$lineUserId  = $env:LINE_USER_ID
$lineSecret  = ""

if (Test-Path $ocJsonPath) {
    $oc = Get-Content $ocJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $tgToken    = [string]$oc.channels.telegram.botToken
    $lineToken  = [string]$oc.channels.line.channelAccessToken
    $lineSecret = [string]$oc.channels.line.channelSecret
    $gwPort     = if ($oc.gateway.port) { [int]$oc.gateway.port } else { 18789 }
    $gwToken    = [string]$oc.hooks.token
}
# env fallback
if (-not $tgToken)   { $tgToken   = $env:TELEGRAM_BOT_TOKEN }
if (-not $lineToken) { $lineToken = $env:LINE_CHANNEL_ACCESS_TOKEN }
if (-not $gwToken)   { $gwToken   = $env:OPENCLAW_HOOKS_TOKEN }

# Auto-fill chat_id from pairing file
if (-not $tgChatId) {
    $pairingPath = Join-Path $ProjectDir ".openclaw-desktop\credentials\telegram-pairing.json"
    if (Test-Path $pairingPath) {
        $p = Get-Content $pairingPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $first = $p.requests | Select-Object -First 1
        if ($first) {
            $tgChatId = $first.id
            Set-EnvValues -EnvFile (Join-Path $ProjectDir ".env") -Values @{ TELEGRAM_CHAT_ID = "$tgChatId" }
        }
    }
}

$gwBase = "http://127.0.0.1:$gwPort"

# ---- Gateway /hooks/agent (primary) ---------------------------------
function Send-ViaGateway {
    param([string]$Channel, [string]$To, [string]$Text)
    if (-not $gwToken -or -not $To) { return $false }
    try {
        $body = ConvertTo-Json @{
            message = $Text
            channel = $Channel
            to      = $To
            deliver = $true
        } -Compress
        Invoke-RestMethod -Uri "$gwBase/hooks/agent" `
            -Method Post -ContentType "application/json" -TimeoutSec 8 `
            -Headers @{ Authorization = "Bearer $gwToken" } `
            -Body $body -ErrorAction Stop | Out-Null
        Write-Host "  [GW->$Channel] Sent via Gateway" -ForegroundColor DarkGreen
        return $true
    } catch {
        return $false
    }
}

# ---- Direct Telegram API (fallback) ---------------------------------
function Send-TelegramDirect {
    param([string]$Text)
    if (-not $tgToken -or -not $tgChatId) { return }
    try {
        $body = ConvertTo-Json @{ chat_id = $tgChatId; text = $Text; parse_mode = "HTML" } -Compress
        Invoke-RestMethod -Uri "https://api.telegram.org/bot$tgToken/sendMessage" `
            -Method Post -ContentType "application/json" -TimeoutSec 10 `
            -Body $body -ErrorAction Stop | Out-Null
        Write-Host "  [TG-direct] Sent (chat $tgChatId)" -ForegroundColor DarkGreen
    } catch {
        Write-Host "  [TG-direct] Failed: $_" -ForegroundColor DarkYellow
    }
}

# ---- Direct LINE API (fallback) -------------------------------------
# Uses channelAccessToken + channelSecret from openclaw.json.
# If LINE_USER_ID is set -> push to that user.
# Otherwise -> broadcast to all followers (no user ID needed).
function Send-LineDirect {
    param([string]$Text)
    if (-not $lineToken) {
        Write-Host "  [LINE] channelAccessToken not found" -ForegroundColor DarkYellow
        return
    }
    try {
        $msgs = @(@{ type = "text"; text = $Text })
        if ($lineUserId) {
            $body = ConvertTo-Json @{ to = $lineUserId; messages = $msgs } -Compress
            $uri  = "https://api.line.me/v2/bot/message/push"
            $dest = "user $lineUserId"
        } else {
            $body = ConvertTo-Json @{ messages = $msgs } -Compress
            $uri  = "https://api.line.me/v2/bot/message/broadcast"
            $dest = "broadcast"
        }
        Invoke-RestMethod -Uri $uri `
            -Method Post -ContentType "application/json" -TimeoutSec 10 `
            -Headers @{ Authorization = "Bearer $lineToken" } `
            -Body $body -ErrorAction Stop | Out-Null
        Write-Host "  [LINE-direct] Sent ($dest)" -ForegroundColor DarkGreen
    } catch {
        Write-Host "  [LINE-direct] Failed: $_" -ForegroundColor DarkYellow
    }
}

function Get-HarnessSitrep {
    try {
        $s  = Invoke-RestMethod -Uri "http://127.0.0.1:18794/status" -TimeoutSec 3 -ErrorAction Stop
        $vv = if ($s.voicevox_alive) { "OK" } else { "NG" }
        $ol = if ($s.ollama_alive)   { "OK" } else { "NG" }
        $vr = if ($s.vrchat_active)  { "ACTIVE" } else { "OFF" }
        return ("Harness v{0} | VV:{1} | Ollama:{2} | VRC:{3}" -f $s.daemon_version, $vv, $ol, $vr)
    } catch { return "Harness: offline" }
}

# ---- Build message --------------------------------------------------
$ts      = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
$pubUrl  = if ($env:OPENCLAW_PUBLIC_URL) { ("`npublic: " + $env:OPENCLAW_PUBLIC_URL) } else { "" }
$harness = Get-HarnessSitrep

switch ($Type) {
    "STARTUP" { $fullMsg = "<b>[STARTUP] Sovereign Portal</b>`nTime: $ts`n$harness$pubUrl`nClawdbot is online." }
    "SITREP"  { $fullMsg = "<b>[SITREP]</b> $ts`n$harness$pubUrl`n$Message" }
    default   { $fullMsg = "[HB] Clawdbot alive | $ts | $harness" }
}
$lineMsg = $fullMsg -replace '</?b>', '' -replace '</?i>', ''

# ---- Send: Gateway first, direct fallback ---------------------------
$tgSent   = Send-ViaGateway -Channel "telegram" -To $tgChatId  -Text $fullMsg
$lineSent = Send-ViaGateway -Channel "line"     -To $lineUserId -Text $lineMsg

if (-not $tgSent)   { Send-TelegramDirect -Text $fullMsg }
if (-not $lineSent) { Send-LineDirect     -Text $lineMsg  }
