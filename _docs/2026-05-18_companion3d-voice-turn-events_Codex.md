# 2026-05-18 Companion3D Voice Turn Events

## Overview

Connected Desktop Companion transcript turns to the Companion3D event bus so
successful OpenClaw replies emit speech lifecycle state for the local avatar.

## Background

The Hypura harness already exposed /voice/companion-turn and Companion3D
event endpoints, but the transcript turn path only forwarded a coarse emotion
and companion speech command. The 3D layer did not receive explicit
speak_start, lip-sync state, or speak_end events.

## Changes

- Updated extensions/hypura-harness/scripts/harness_daemon.py.
- Added Companion3D emotion, speak_start, speaking/lip-sync state, speak_end,
  and final speaking/lip-sync false state around companion speech.
- Preserved existing bridge failure behavior and ensured the final speech state
  is recorded even when forward_speak fails.
- Updated extensions/hypura-harness/scripts/tests/test_harness_daemon.py to
  verify the event sequence and final lip-sync state.

## Verification

- uv run pytest tests/test_harness_daemon.py -q
- node scripts/run-vitest.mjs --config test/vitest/vitest.extensions.config.ts run extensions/hypura-harness/index.test.ts extensions/hypura-harness/manifest-skills.test.ts --reporter=verbose
- git diff --check

## Residual Risk

No live Desktop Companion renderer was available through this session's tool
surface, so this verifies daemon/event behavior but not rendered avatar motion.
The current state/companion3d/assets directory is empty, so loading a local
VRM/GLB/GLTF/FBX asset still needs a user-approved asset file under that root.
