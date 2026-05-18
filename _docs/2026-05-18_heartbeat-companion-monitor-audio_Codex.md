# 2026-05-18 Heartbeat Companion Monitor Audio

## Overview

Enabled the local Desktop Companion heartbeat permission path and documented
how Hypura Harness voice output can be routed to an operator-selected monitor
audio device.

## Changes

- Updated HEARTBEAT.md with a generic local-operator opt-in path for Desktop
  Companion expressions, gaze, gestures, idle motions, and short local speech.
- Kept microphone capture, browser monitoring, credentials, VRChat ChatBox,
  VRChat movement, and unapproved VRChat parameter writes outside that opt-in.
- Kept tracked Hypura Harness voice output_devices empty so local device indices
  stay private and operator-specific.
- Replaced the older single-purpose VRChat heartbeat with generic Telegram
  SITREP, VRChat readiness, and schedule/business review heartbeat tasks.
- Updated Hypura Harness companion speech paths to mirror Companion speech
  through VOICEVOX monitor playback when output_devices are configured.

## Verification

- Hypura /companion3d/status responded successfully.
- Hypura /voice/devices listed the local monitor output in the operator's
  environment.
- Hypura /reload reflected local output device configuration during the
  operator run.
- Hypura /voice/test-say with explicit local output_devices returned success.

- uv run pytest tests/test_harness_daemon.py -q -p no:randomly
- git diff --check
