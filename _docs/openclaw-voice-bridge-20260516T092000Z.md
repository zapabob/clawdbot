# OpenClaw Voice Bridge Implementation Log

## Overview

Added a local Python helper and Hypura Harness endpoints for microphone-to-OpenClaw voice turns using Whisper.cpp for speech-to-text and VOICEVOX for text-to-speech.

## Background / Requirements

- User already had VOICEVOX available locally.
- Whisper.cpp was installed under the user's Desktop before this change.
- The goal is a local, free voice loop that can eventually run as: record audio, transcribe it, send text to OpenClaw, synthesize the reply, and play it.

## Assumptions / Decisions

- Kept this as a local helper script under scripts/ rather than a product plugin.
- Made input/output audio devices explicit because Windows may route playback to a monitor or virtual cable silently.
- Used Python sounddevice and soundfile, which were already installed.
- Used whisper-cli.exe with ggml-small.bin as the default transcription path.
- Left the OpenClaw command configurable through OPENCLAW_VOICE_AGENT_CMD.

## Changed Files

- scripts/openclaw_voice_bridge.py
- extensions/hypura-harness/scripts/voice_bridge.py
- extensions/hypura-harness/scripts/voicevox_sequencer.py
- extensions/hypura-harness/scripts/harness_daemon.py
- extensions/hypura-harness/scripts/tests/test_harness_daemon.py
- extensions/hypura-harness/scripts/tests/test_voicevox_sequencer.py
- \_docs/openclaw-voice-bridge-20260516T092000Z.md

## Implementation Details

- Added subcommands: devices, test-say, transcribe, once, loop.
- Added explicit --input-device and --output-device options.
- Added UTF-8 subprocess decoding for Whisper and OpenClaw output.
- Added Hypura Harness REST endpoints: GET /voice/devices, POST /voice/test-say, POST /voice/transcribe, POST /voice/turn.

## Commands Run

- python scripts\\openclaw_voice_bridge.py devices
- python scripts\\openclaw_voice_bridge.py --output-device 4 test-say --text "これはオープンクロー音声再生テストです"
- python scripts\\openclaw_voice_bridge.py transcribe C:\\Users\\downl\\Desktop\\whisper.cpp\\test\\bridge-test.wav
- python -m py_compile extensions\\hypura-harness\\scripts\\voice_bridge.py extensions\\hypura-harness\\scripts\\voicevox_sequencer.py extensions\\hypura-harness\\scripts\\harness_daemon.py
- uv run pytest -p no:randomly tests/test_harness_daemon.py tests/test_voicevox_sequencer.py
- curl.exe --max-time 5 -v http://127.0.0.1:18794/voice/devices
- Python urllib POST to http://127.0.0.1:18794/voice/test-say

## Test / Verification Results

- Device listing succeeded.
- VOICEVOX synthesis and Python playback API completed against output device 4.
- Whisper.cpp transcription completed against the generated wav, but the generated VOICEVOX sentence was partially misrecognized.
- Hypura Harness unit tests passed: 20 passed.
- Restarted the local Hypura Harness daemon and verified GET /voice/devices.
- Verified POST /voice/test-say through the live Hypura Harness daemon with success=true.

## Residual Risks

- Actual audible playback depends on Windows routing and the selected output device. Device 4 is currently QG241Y P, which may be a monitor audio sink.
- The OpenClaw CLI/Gateway agent turn is wired behind /voice/turn, but the full live agent loop still depends on the local Gateway/CLI response path being healthy.
- Whisper.cpp accuracy on synthetic VOICEVOX audio is imperfect; real microphone tests are still needed.

## Recommended Next Actions

- Run devices and choose the output device that actually maps to the desired speaker/headphones.
- Run test-say against candidate output devices until sound is audible.
- Run once after the OpenClaw CLI/Gateway response path is confirmed.
