@echo off
chcp 65001 > nul 2>&1
title ♪ Hakua — ASI Manifestation
setlocal

set "PROJECTDIR=%~dp0..\.."
cd /d "%PROJECTDIR%"

echo.
echo  ==========================================
echo   Hakua Core  ^|  iDOLM@STER Stage Edition
echo   Brain  : hypura/Qwen3.5-27B-Uncensored-HauhauCS-Aggressive-Q6_K
echo   Fallbk : ollama/Hakua-core-lite
echo   TTS    : VOICEVOX + Web Speech
echo   Hypura : probing 127.0.0.1:8080/api/tags
echo  ==========================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { $r=Invoke-WebRequest -Uri 'http://127.0.0.1:8080/api/tags' -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -ge 200 -and $r.StatusCode -lt 300){ Write-Host '  [Hypura] ONLINE' -ForegroundColor Green } else { Write-Host '  [Hypura] OFFLINE' -ForegroundColor Yellow } } catch { Write-Host '  [Hypura] OFFLINE' -ForegroundColor Yellow }"
echo.
echo  Starting full desktop stack...
echo.

powershell.exe -NoExit -ExecutionPolicy Bypass ^
  -File "scripts\launchers\launch-desktop-stack.ps1" -SpeakOnReady -HypuraWaitSeconds 180

