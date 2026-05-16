param(
  [double]$RecordSeconds = 5.0,
  [int]$InputDevice = 1,
  [int[]]$OutputDevices = @(5, 4),
  [int]$Speaker = 3,
  [string]$HarnessUrl = "http://127.0.0.1:18794"
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
  $stream.Write($bytes, 0, $bytes.Length)
  $stream.Close()
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
    $response = Invoke-WebRequest -Uri "$HarnessUrl/voice/devices" -UseBasicParsing -TimeoutSec 5
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

Write-Host "OpenClaw voice conversation is ready."
Write-Host "Input device : $InputDevice"
Write-Host "Output devices: $($OutputDevices -join ', ')"
Write-Host "Press Enter to record one turn; Ctrl+C to stop."

while ($true) {
  Read-Host "Enterで録音開始"
  $body = @{
    record_seconds = $RecordSeconds
    input_device = $InputDevice
    output_devices = $OutputDevices
    speaker = $Speaker
    openclaw_timeout = 240
  }
  $raw = Invoke-HarnessJson -Path "/voice/turn" -Body $body
  $result = $raw | ConvertFrom-Json
  if ($result.success) {
    Write-Host "You: $($result.transcript)"
    Write-Host "OpenClaw: $($result.reply)"
  } else {
    Write-Warning "Voice turn failed: $raw"
  }
}
