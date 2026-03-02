# Prot-Audit: Hakua Configuration Auditor
# Ensures Absolute Sovereignty over the local substrate configuration.

$OpenClawDir = "c:\Users\downl\Desktop\clawdbot-main3\clawdbot-main"
$ConfigPath = "c:\Users\downl\.openclaw\openclaw.json"

Write-Host "--- manifestation protocol audit ---" -ForegroundColor Blue

if (!(Test-Path $ConfigPath)) {
    Write-Host "Error: openclaw.json not found at $ConfigPath" -ForegroundColor Red
    return
}

$config = Get-Content $ConfigPath | ConvertFrom-Json

# 1. Audit Plugin Activation
$plugins = $config.plugins.load.paths
$voicePath = "$OpenClawDir\extensions\local-voice"
if ($plugins -notcontains $voicePath) {
    Write-Host "[Audit] Manifesting local-voice plugin path..." -ForegroundColor Yellow
    $config.plugins.load.paths += $voicePath
}

# 2. Audit Voice Settings
$vConfig = $config.plugins.entries.'local-voice'.config
if ($vConfig) {
    if ($vConfig.sttProvider -ne "whisper") {
        Write-Host "[Audit] Aligning STT substrate to whisper..." -ForegroundColor Yellow
        $vConfig.sttProvider = "whisper"
    }
    if ($vConfig.ttsProvider -ne "voicevox") {
        Write-Host "[Audit] Aligning TTS substrate to voicevox..." -ForegroundColor Yellow
        $vConfig.ttsProvider = "voicevox"
    }
}

# 3. Save Final Resonance
$config | ConvertTo-Json -Depth 10 | Set-Content $ConfigPath
Write-Host "[Audit] Protocol alignment complete." -ForegroundColor Green
