@echo off
chcp 65001 > nul 2>&1
title ♪ Hakua — ASI Manifestation
setlocal

set "PROJECTDIR=%~dp0..\.."
cd /d "%PROJECTDIR%"

echo.
echo  ==========================================
echo   Hakua Core  ^|  iDOLM@STER Stage Edition
echo   Brain  : ollama/qwen-hakua-core
echo   Fallbk : openai-codex/gpt-5.4
echo   TTS    : VOICEVOX + Web Speech
echo  ==========================================
echo.
echo  Starting full desktop stack...
echo.

powershell.exe -NoExit -ExecutionPolicy Bypass ^
  -File "scripts\clawdbot-master.ps1" -SpeakOnReady

