param([string]$Text)

$speakerId = 2
$Endpoint = "http://127.0.0.1:50021"

try {
    $encodedText = [System.Web.HttpUtility]::UrlEncode($Text)
    
    # 1. Gen audio_query
    $queryResponse = Invoke-RestMethod -Uri "$Endpoint/audio_query?text=$encodedText&speaker=$speakerId" -Method Post -ErrorAction Stop

    # 2. Synthesis
    $jsonQuery = $queryResponse | ConvertTo-Json -Depth 10
    $wavBytes = Invoke-RestMethod -Uri "$Endpoint/synthesis?speaker=$speakerId" -Method Post -Body $jsonQuery -ContentType "application/json" -ErrorAction Stop

    # 3. Save and play
    $wavPath = Join-Path $env:TEMP "hakua_heartbeat.wav"
    [System.IO.File]::WriteAllBytes($wavPath, $wavBytes)

    $player = New-Object System.Media.SoundPlayer
    $player.SoundLocation = $wavPath
    $player.PlaySync()
    
    Write-Host "Voice played successfully."
} catch {
    Write-Host "Error interacting with VOICEVOX: $_" -ForegroundColor Red
}
