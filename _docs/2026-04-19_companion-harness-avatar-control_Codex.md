# 2026-04-19 Companion Harness Avatar Control

**Date**: 2026-04-19
**Author**: Codex
**Scope**: OpenClaw AI companion control and Hypura harness companion bridge

## Overview
- Expanded OpenClaw's `control_companion` tool so agents can drive avatar gaze and model loading in addition to speech, emotion, expression, and motion.
- Added a Hypura harness companion tool plus a daemon endpoint that forwards avatar commands through the public Desktop Companion SDK with a legacy HTTP fallback.
- Added focused regression tests for repo-relative FBX loading and companion bridge command routing.

## Background And Requirements
- The user wanted OpenClaw AI and the Hypura harness to operate the Desktop Companion avatar directly.
- The desired control surface included speech plus avatar behaviors similar to the renderer quick actions and model switching path.
- Compatibility with the older localhost HTTP control path needed to remain available during migration.

## Assumptions And Decisions
- Kept `control_companion` as the OpenClaw-side AI tool rather than introducing a second core tool.
- Used the existing public `openclaw/plugin-sdk/live2d-companion` seam as the preferred transport from Hypura into the companion.
- Preserved the legacy `http://127.0.0.1:18791/control` fallback in the Python bridge when the SDK bridge is unavailable.
- Resolved relative model paths against the workspace or repo root so repo-owned FBX assets can be targeted safely.

## Changed Files
- `src/plugin-sdk/live2d-companion.ts`
- `src/agents/tool-display-config.ts`
- `src/agents/tools/companion-control-tool.ts`
- `src/agents/tools/companion-control-tool.test.ts`
- `extensions/hypura-harness/index.ts`
- `extensions/hypura-harness/index.test.ts`
- `extensions/hypura-harness/scripts/companion_sdk_bridge.mjs`
- `extensions/hypura-harness/scripts/companion_bridge.py`
- `extensions/hypura-harness/scripts/harness_daemon.py`
- `extensions/hypura-harness/scripts/tests/test_companion_bridge.py`
- `extensions/hypura-harness/scripts/tests/test_harness_daemon.py`

## Implementation Details
- Extended the companion SDK avatar command payload to cover `loadModel`, `speakText`, and `lookAt`.
- Added `look_at` and `load_model` to the OpenClaw `control_companion` tool and clamped gaze coordinates to normalized bounds.
- Added `hypura_harness_companion` as a plugin tool that posts structured avatar-control requests to the harness daemon.
- Implemented a Node-based SDK bridge script so Hypura can call `setCompanionAvatarCommand` and `speakWithCompanion` without reaching into private core modules.
- Added `/companion/control` to the Hypura daemon and mapped action payloads onto the bridge methods.
- Preserved compatibility by falling back to the existing localhost `/control` endpoint when the SDK bridge fails.
- Added tests for repo-relative model-path resolution and for daemon/bridge `load_model`, `motion`, and `look_at` routing.

## Commands Run
```text
pnpm test -- src/agents/tools/companion-control-tool.test.ts extensions/hypura-harness/index.test.ts
uv run pytest -p no:randomly tests/test_companion_bridge.py tests/test_harness_daemon.py
pnpm plugin-sdk:api:check
pnpm plugin-sdk:check-exports
pnpm --dir extensions/live2d-companion build
node scripts/tsdown-build.mjs
pnpm build
```

## Test And Verification Results
- `pnpm test -- src/agents/tools/companion-control-tool.test.ts extensions/hypura-harness/index.test.ts`
  - Passed: 2 files, 5 tests.
- `uv run pytest -p no:randomly tests/test_companion_bridge.py tests/test_harness_daemon.py`
  - Passed: 16 tests.
- `pnpm plugin-sdk:api:check`
  - Passed.
- `pnpm plugin-sdk:check-exports`
  - Passed.
- `pnpm --dir extensions/live2d-companion build`
  - Passed.
- `node scripts/tsdown-build.mjs`
  - Failed on pre-existing unresolved imports in `extensions/local-voice` for `./src/audio-input.js` and `./audio-input.js`.
- `pnpm build`
  - Failed on the existing A2UI prerequisite: missing `src/canvas-host/a2ui/a2ui.bundle.js`.

## Residual Risks
- No live end-to-end GUI smoke was run against a visibly running Desktop Companion window in this pass.
- Full repo build remains blocked by unrelated existing issues in `extensions/local-voice` and the missing A2UI bundle prerequisite.
- The Hypura SDK bridge depends on a working Node runtime plus the Desktop Companion public facade being available from the workspace or built plugin surface.

## Recommended Next Actions
- Run a live smoke with the Desktop Companion window open and a repo FBX such as `assets/NFD/Hakua/FBX/FBX/Hakua.fbx`.
- If mainline landing is required, resolve or isolate the unrelated `extensions/local-voice` unresolved import issue and the A2UI bundle prerequisite first.
- Consider teaching OpenClaw prompts or agent policy docs to prefer `control_companion` for avatar staging actions now that gaze and model loading are available.
