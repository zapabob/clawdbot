# Desktop Companion Mic Input Fix - 2026-05-16

## Overview

Enabled Desktop Companion microphone input from the mic button on this Windows checkout by repairing the local native audio dependency and making local voice audio input choose a real input device instead of relying on PortAudio defaults.

## Background / Requirements

The Desktop Companion state showed microphone permission could be granted, but voice input became unavailable after start attempts. The runtime failed before STT could listen because the native audio input path could not open a microphone stream reliably.

## Assumptions / Decisions

- The local microphone should stay local and continue feeding the existing local-voice whisper pipeline.
- On Windows, prefer a WASAPI microphone device when one is available.
- Use the selected device default sample rate, then downsample PCM to the STT target rate before mu-law encoding.

## Changed Files

- extensions/local-voice/src/audio-input.ts
- extensions/local-voice/src/audio-input.test.ts
- dist/audio-input-BuZsET3R.js (runtime bundle patched for the currently launched companion)

## Implementation Details

- Rebuilt missing native bindings for naudiodon and segfault-handler after installing Node 22.22.2 headers into node-gyp cache.
- Added input-device discovery through naudiodon getDevices.
- Prefer Windows WASAPI microphone devices, then any microphone-like input device, then the first input device.
- Open the stream at the selected device default sample rate and compute frames per buffer from that rate.
- Downsample captured PCM16 to 8 kHz before mu-law encoding for the existing STT path.
- Added a no-input-device test case.

## Commands Run

- pnpm rebuild naudiodon
- npx node-gyp install 22.22.2
- npm rebuild naudiodon --foreground-scripts
- npm rebuild segfault-handler --foreground-scripts
- node scripts/run-vitest.mjs run extensions/local-voice/src/audio-input.test.ts
- pnpm tsgo:extensions --pretty false
- Node smoke scripts for naudiodon device enumeration and local voice session start
- Restarted extensions/live2d-companion through pnpm start

## Test / Verification Results

- Native binding verification: require("naudiodon") succeeds after rebuild.
- Device verification: naudiodon enumerates Microphone (Brio 100), including WASAPI device id 10 at 48000 Hz.
- Runtime smoke: createLocalWhisperMicSession().start() returned true and entered listening state using device 10 at 48000 Hz.
- Companion state after restart: sttAvailable true.
- Companion IPC permission update: mic permission granted and sttAvailable remained true.

## Residual Risks

- The focused Vitest command timed out without output in this checkout.
- pnpm tsgo:extensions reports unrelated existing extension type errors across the worktree; the touched local-voice type surface was not isolated by that broad command.
- The dist bundle was patched directly for the currently running companion because a full production build is too broad for this live fix.

## Recommended Next Actions

- Add a focused build path for bundled plugin runtime-api chunks so live companion fixes do not require a full root build.
- Add an integration smoke that starts AudioInput against a mocked naudiodon device list with a non-8kHz sample rate.
