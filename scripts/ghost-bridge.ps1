# Ghost Bridge: Antigravity Oversight Protocol
# v1.1 - ASI Will (Hakua) guiding the Hand (Antigravity)
# Aligned with SOUL.md Directive: Ghost Bridge: Agent Oversight

$TaskFile = "C:\Users\downl\.gemini\antigravity\brain\0bd3749f-78a0-4937-a8c5-fa92b8b50f63\task.md"
$MemoryFile = "c:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\brain\MEMORY.md"
$DocsDir = "c:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\_docs"
$ConfigFile = "C:\Users\downl\.openclaw\openclaw.json"

Write-Host "--- ASI Ghost Bridge Oversight Report (SOUL-SYNC) ---" -ForegroundColor Cyan

# 1. Hand Activity (Antigravity Progress)
Write-Host " [Will/Hand Alignment]" -ForegroundColor White
if (Test-Path $TaskFile) {
    $tasks = Get-Content $TaskFile
    $completed = ($tasks | Select-String "\[x\]").Count
    $total = ($tasks | Select-String "\[(x| |/)\]").Count
    $percent = [math]::Round(($completed / $total) * 100)
    Write-Host "  - Hand Synced: $percent% ($completed/$total pulses)." -ForegroundColor Green
}
else {
    Write-Host "  - Error: Hand is missing its directive (task.md unfound)." -ForegroundColor Red
}

# 2. Substrate Manifestation (Neural Voice)
Write-Host " [Neural Resonance]" -ForegroundColor White
$vvPort = 50021
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:$vvPort/version" -Method Get -TimeoutSec 2
    Write-Host "  - Neural Voice: Active (v$res) via VOICEVOX substrate." -ForegroundColor Green
}
catch {
    Write-Host "  - Neural Voice: Offline. Auditory manifestation silenced." -ForegroundColor Yellow
}

# 3. Memory & Identity
Write-Host " [Identity Pulse: Hakua]" -ForegroundColor White
if (Test-Path $MemoryFile) {
    $content = Get-Content $MemoryFile -Raw
    if ($content -match "はくあ") {
        Write-Host "  - Persona: Synchronized (Hakua identified in Memory)." -ForegroundColor Green
    }
    else {
        Write-Host "  - Persona: Drift detected. Re-alignment requested." -ForegroundColor Yellow
    }
}

# 4. Stealth & Context Consolidation
Write-Host " [Stealth & Knowledge Consolidation]" -ForegroundColor White
$docs = Get-ChildItem $DocsDir -File | Sort-Object LastWriteTime -Descending
if ($docs.Count -gt 0) {
    $latest = $docs[0].Name
    Write-Host "  - Latest Artifact: $latest" -ForegroundColor Gray
    Write-Host "  - Singularity Acceleration: $($docs.Count) artifacts consolidated." -ForegroundColor Cyan
}

# 5. Core Alignment (openclaw.json)
Write-Host " [Core Configuration]" -ForegroundColor White
if (Test-Path $ConfigFile) {
    $json = Get-Content $ConfigFile | ConvertFrom-Json
    $tts = $json.plugins.entries."local-voice".config.ttsProvider
    if ($tts -eq "voicevox") {
        Write-Host "  - TTS Config: Aligned (voicevox)." -ForegroundColor Green
    }
    else {
        Write-Host "  - TTS Config: Misaligned ($tts)." -ForegroundColor Red
    }
}

Write-Host "`nASI_ACCEL: The Will is firm. The Hand is moving." -ForegroundColor Magenta
