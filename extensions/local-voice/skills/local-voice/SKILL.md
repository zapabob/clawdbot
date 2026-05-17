---
name: local-voice
description: Operate the Local Voice plugin for local STT, VOICEVOX TTS, camera capture, and VRChat OSC speaking cues.
user-invocable: false
---

# Local Voice

Use this skill when the user asks for the Local Voice plugin directly, asks for
local TTS or STT outside the Desktop Companion bridge, or wants the legacy
chat-command voice surface checked.

Prefer the Desktop Companion `control_companion` tool for avatar speech and
local consent state when the request is about the desktop avatar. Prefer the
Hypura voice skill when the request is explicitly about the Hypura mic-to-agent
loop. Use Local Voice when the request names this plugin, needs its chat
commands, or needs its registered VOICEVOX speech provider.

## Defaults

- TTS provider: `voicevox`.
- Default VOICEVOX endpoint: `http://localhost:50021`.
- Default VOICEVOX speaker id: `8`, Kasukabe Tsumugi normal style.
- STT provider: `whisper` unless config overrides it.
- VRChat OSC speaking cue: parameter `Speaking` toggles true during playback
  and false after playback finishes or fails.

## Commands

Use these chat commands only when command dispatch is the intended path:

```text
/voice-assistant
/voice-assistant start
/voice-assistant stop
/voice-assistant speak <text>
/tts <text>
/voice_tts <text>
/camera capture
```

`/voice_tts` is the Telegram native command alias for `/tts`.

## Safe operating flow

1. Confirm VOICEVOX Engine is running on the configured endpoint before speech.
2. For speech output, use `/tts <text>` or `/voice-assistant speak <text>`.
3. For live voice input, use `/voice-assistant start` only after the user has
   requested microphone capture.
4. Use `/voice-assistant stop` when the voice turn or troubleshooting session
   is finished.
5. Use `/camera capture` only when camera capture is requested or already
   covered by the user's local-consent context.

## Configuration notes

The plugin reads `plugins.entries.local-voice.config`. Important fields:

- `ttsProvider`: keep `voicevox` for the local Kasukabe Tsumugi path.
- `vvEndpoint`: local VOICEVOX HTTP endpoint.
- `vvSpeakerId`: VOICEVOX speaker id. Use `8` for Kasukabe Tsumugi unless the
  user asks for another voice.
- `sttProvider`: `whisper` or `openai-realtime`.
- `vrchatOscEnabled` and `vrchatOscPort`: local OSC speaking cue behavior.
- `cameraDeviceId`, `cameraWidth`, `cameraHeight`, and `cameraMinIntervalMs`:
  camera capture source and throttle.

The registered speech provider also honors `baseUrl`/`speakerId` and the legacy
`vvEndpoint`/`vvSpeakerId` keys so desktop runtime config and provider-style
config stay aligned.

## Proof path

- For VOICEVOX identity, query `/speakers` and confirm speaker id `8` is
  Kasukabe Tsumugi normal style.
- For synthesis, call `/audio_query` and `/synthesis` with `speaker=8`.
- For plugin regression proof, run the Local Voice manifest skill test plus the
  VOICEVOX provider test.
- For user-facing speech proof, prefer a short phrase and confirm the command
  returns success instead of silently falling back to browser/system TTS.

## Troubleshooting

- Mechanical voice usually means the request did not use the VOICEVOX path or
  another companion path fell back to browser/system TTS. Recheck `ttsProvider`,
  `vvEndpoint`, and `vvSpeakerId`.
- VOICEVOX request failures usually mean the engine is not running, the endpoint
  is wrong, or speaker id `8` is unavailable in that VOICEVOX install.
- If playback works but VRChat does not react, check OSC enablement and the
  `vrchatOscPort` setting.
- If microphone capture does not produce transcript text, stop the assistant,
  check the configured STT provider and audio input device, then start it again
  only after the user still wants live capture.
