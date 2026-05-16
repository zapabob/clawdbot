---
name: hypura-voice-io
description: Use Hypura Harness voice input and output tools for local mic, WAV transcription, VOICEVOX playback, and Desktop Companion voice turns.
category: automation, voice, audio, companion
version: 1.0.0
---

# Hypura Harness Voice I/O

Use this skill when an agent needs local voice input, local voice output, or a
Desktop Companion transcript loop through the bundled `hypura-harness` plugin.
The harness daemon owns audio devices, VOICEVOX synthesis, whisper.cpp
transcription, and the local OpenClaw agent command bridge.

## Before you begin

- Start the harness with `scripts/launchers/Start-Hypura-Harness.ps1` or from
  `extensions/hypura-harness/scripts` with `uv run harness_daemon.py`.
- Check `hypura_harness_status` before using voice tools.
- Run `hypura_harness_voice_devices` before selecting `input_device`,
  `output_device`, or `output_devices`.
- Use explicit device ids when routing to speakers, VB-Cable, or mixed
  monitor plus virtual-cable output.
- Do not start microphone recording unless the user asked for live voice input
  or an operator has already started the voice session.

## Tool map

| Need                                         | Tool                                  | Harness endpoint             |
| -------------------------------------------- | ------------------------------------- | ---------------------------- |
| Inspect local audio devices                  | `hypura_harness_voice_devices`        | `GET /voice/devices`         |
| Test TTS output routing                      | `hypura_harness_voice_test_say`       | `POST /voice/test-say`       |
| Transcribe a WAV file                        | `hypura_harness_voice_transcribe`     | `POST /voice/transcribe`     |
| Record mic, run OpenClaw, speak reply        | `hypura_harness_voice_turn`           | `POST /voice/turn`           |
| Enable or disable Companion mic capture      | `hypura_harness_companion_mic`        | `POST /voice/companion-mic`  |
| Handle Companion transcript as an agent turn | `hypura_harness_companion_voice_turn` | `POST /voice/companion-turn` |

## Recommended workflow

1. Confirm daemon health.

```text
hypura_harness_status({})
```

2. List devices and choose explicit ids.

```text
hypura_harness_voice_devices({})
```

3. Test output before recording input.

```text
hypura_harness_voice_test_say({
  "text": "Voice output test.",
  "speaker": 3,
  "output_devices": [5, 4]
})
```

4. For file input, transcribe the WAV first.

```text
hypura_harness_voice_transcribe({
  "wav_path": "path/to/input.wav"
})
```

5. For a live mic turn, keep the capture short and route the reply explicitly.

```text
hypura_harness_voice_turn({
  "record_seconds": 5,
  "input_device": 1,
  "output_devices": [5, 4],
  "speaker": 3,
  "openclaw_timeout": 240
})
```

## Desktop Companion transcript loop

Use the Companion path when the Desktop Companion already captures the
transcript and the harness only needs to hand that text to OpenClaw.

Enable mic capture:

```text
hypura_harness_companion_mic({ "enabled": true })
```

Process an explicit transcript:

```text
hypura_harness_companion_voice_turn({
  "transcript": "What changed in the workspace?",
  "transcript_timestamp": 1778918400000,
  "last_seen_timestamp": 1778918399000,
  "speak": true,
  "animate": true
})
```

If `transcript` is omitted, the harness reads the latest transcript from the
Desktop Companion state file. Pass `last_seen_timestamp` when polling so the
same transcript is not handled twice.

## Troubleshooting

- Empty or stale input: call `hypura_harness_voice_devices`, verify the selected
  input id, then retry with a short `record_seconds` value.
- No audio output: run `hypura_harness_voice_test_say` with one output device at
  a time, then add the second output device after the route is confirmed.
- Whisper path errors: pass `whisper_exe` and `whisper_model`, or install the
  expected whisper.cpp runtime before using `hypura_harness_voice_turn`.
- VOICEVOX errors: start VOICEVOX and confirm `hypura_harness_status` reports a
  healthy VOICEVOX connection.
- OpenClaw command errors: check `voice.openclaw_command` in
  `extensions/hypura-harness/config/harness.config.json`. The command template
  must contain `{message}`.
