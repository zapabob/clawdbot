param(
  [string]$HarnessUrl = "http://127.0.0.1:18794",
  [string]$StatePath = ".openclaw-desktop/companion_state.json",
  [int]$PollMs = 500,
  [int]$OpenClawTimeout = 240
)

$ErrorActionPreference = "Stop"

function Invoke-HarnessJson {
  param(
    [string]$Path,
    [hashtable]$Body
  )

  $json = $Body | ConvertTo-Json -Depth 8 -Compress
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
  $request = [System.Net.HttpWebRequest]::Create("$HarnessUrl$Path")
  $request.Method = "POST"
  $request.ContentType = "application/json; charset=utf-8"
  $request.ContentLength = $bytes.Length
  $stream = $request.GetRequestStream()
  try {
    $stream.Write($bytes, 0, $bytes.Length)
  } finally {
    $stream.Dispose()
  }

  $response = $request.GetResponse()
  $reader = [System.IO.StreamReader]::new($response.GetResponseStream(), [System.Text.Encoding]::UTF8)
  try {
    return $reader.ReadToEnd()
  } finally {
    $reader.Dispose()
    $response.Dispose()
  }
}

function Test-Harness {
  try {
    $response = Invoke-WebRequest -Uri "$HarnessUrl/status" -UseBasicParsing -TimeoutSec 5
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

if (-not (Test-Harness)) {
  Write-Host "Hypura Harness is not responding at $HarnessUrl"
  Write-Host "Start it first: .\scripts\launchers\Start-Hypura-Harness.ps1"
  exit 1
}

Invoke-HarnessJson -Path "/voice/companion-mic" -Body @{ enabled = $true } | Out-Null
Write-Host "Desktop Companion voice conversation monitor is running."
Write-Host "Use the Companion mic button or keep mic enabled, then speak. Ctrl+C stops this monitor."

$lastSeen = $null

while ($true) {
  Start-Sleep -Milliseconds $PollMs

  if (-not (Test-Path -LiteralPath $StatePath)) {
    continue
  }

  try {
    $state = Get-Content -Raw -LiteralPath $StatePath | ConvertFrom-Json
  } catch {
    continue
  }

  $voice = $state.voice
  if ($null -eq $voice -or [string]::IsNullOrWhiteSpace($voice.lastTranscript)) {
    continue
  }

  $timestamp = $voice.lastTranscriptAt
  if ($null -eq $timestamp -or $timestamp -eq $lastSeen) {
    continue
  }

  $body = @{
    transcript = [string]$voice.lastTranscript
    transcript_timestamp = $timestamp
    last_seen_timestamp = $lastSeen
    openclaw_timeout = $OpenClawTimeout
    speak = $true
    animate = $true
  }

  $raw = Invoke-HarnessJson -Path "/voice/companion-turn" -Body $body
  $result = $raw | ConvertFrom-Json
  if ($result.success) {
    $lastSeen = $timestamp
    Write-Host "You: $($result.transcript)"
    Write-Host "OpenClaw: $($result.reply)"
  } elseif ($result.error -ne "stale_transcript") {
    Write-Warning "Companion voice turn failed: $raw"
  }
}

