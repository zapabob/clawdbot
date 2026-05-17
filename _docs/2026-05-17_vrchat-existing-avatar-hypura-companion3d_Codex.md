# VRChat Existing Avatar Harness and Companion3D Implementation Log

## Overview

Implemented the Hypura Harness side of the VRChat Existing Avatar Harness and
3D Desktop Companion requirements. The new flow treats VRChat and the local 3D
companion as separate layers: VRChat writes are profile-gated actions derived
from the currently worn avatar's generated OSC JSON, while Companion3D remains
a local browser/Electron body that can animate when VRChat writes are unsafe or
unavailable.

## Background / requirements

- Use the official VRChat OSC path only.
- Do not log in to VRChat, read credentials, modify the VRChat client, inject
  runtime assets, or require synthetic custom parameters.
- Discover existing published avatar parameters from the generated OSC JSON.
- Send VRChat writes only through an approved per-avatar action profile.
- Keep direct parameter write, movement, and ChatBox disabled by default.
- Add Hypura daemon HTTP endpoints, OpenClaw tools, agent-facing skills,
  docs, config, state scaffolding, and focused verification.

## Assumptions / decisions

- The implementation extends `extensions/hypura-harness` because that daemon
  already owns Python OSC, VOICEVOX, STT, and Desktop Companion routing.
- Companion3D reuses the existing `extensions/live2d-companion` 3D renderer
  stack instead of creating a competing extension. A `renderer-3d` marker doc
  records that implementation boundary.
- `hypura_harness_vrc_approve_profile` exists because the requirement names it,
  but it requires explicit confirmation text and the skill tells agents not to
  invent approval.
- `POST /vrc/parameter` and `POST /vrc/input` exist only as daemon developer
  endpoints. They are not exposed as normal OpenClaw tools.

## Changed files

- `extensions/hypura-harness/scripts/hypura/vrchat_osc_bridge.py`
- `extensions/hypura-harness/scripts/hypura/vrchat_avatar_registry.py`
- `extensions/hypura-harness/scripts/hypura/vrchat_action_profile.py`
- `extensions/hypura-harness/scripts/hypura/vrchat_safety_gate.py`
- `extensions/hypura-harness/scripts/hypura/companion_event_bus.py`
- `extensions/hypura-harness/scripts/harness_daemon.py`
- `extensions/hypura-harness/index.ts`
- `extensions/hypura-harness/config/harness.config.json`
- `extensions/hypura-harness/README.md`
- `extensions/hypura-harness/skills/vrchat-existing-avatar/SKILL.md`
- `extensions/hypura-harness/skills/desktop-companion-3d/SKILL.md`
- `extensions/live2d-companion/renderer-3d/README.md`
- `docs/tools/vrchat-relay.md`
- `extensions/vrchat-relay/README.md`
- `config/openclaw.vrchat-ai.json`
- `state/vrchat/avatar-profiles/.gitkeep`
- `state/companion3d/assets/.gitkeep`
- Focused tests under `extensions/hypura-harness/index.test.ts`,
  `extensions/hypura-harness/manifest-skills.test.ts`, and
  `extensions/hypura-harness/scripts/tests/test_vrchat_*.py`.

## Implementation details

- Added PythonOSC bridge startup/shutdown and `/avatar/change` handling for the
  current avatar id.
- Added OSC JSON discovery across configured roots plus the Windows LocalLow
  VRChat paths, requiring the JSON `id` to match the requested avatar id.
- Added catalog extraction with writable/readable flags, inferred roles, and a
  blocklist for system-like parameters.
- Added suggested profile generation with `approved: false`, approved profile
  loading, current-avatar mismatch checks, address validation, type validation,
  cooldown/rate-limit checks, emergency stop, ChatBox truncation, and movement
  disabled by default.
- Added `/vrc/*` endpoints and OpenClaw tools for status, avatar/catalog,
  profile, suggestion, approval, approved action, ChatBox, and emergency stop.
- Added Companion3D event/status/load-model/state endpoints and OpenClaw tools,
  with local asset-root enforcement, extension allowlist, size limit, and
  remote URL rejection.
- Updated docs to direct existing-avatar users toward generated OSC JSON plus
  per-avatar action profiles, and to state that custom parameters are
  unnecessary for this mode.

## Commands run

- `uv run python -m py_compile harness_daemon.py hypura\vrchat_avatar_registry.py hypura\vrchat_action_profile.py hypura\vrchat_safety_gate.py hypura\vrchat_osc_bridge.py hypura\companion_event_bus.py`
- `uv run pytest tests/test_vrchat_existing_avatar.py tests/test_vrchat_harness_daemon.py tests/test_harness_daemon.py -q -p no:randomly`
- `uv run pytest tests/test_vrchat_existing_avatar.py tests/test_vrchat_harness_daemon.py -q -p no:randomly`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extensions.config.ts --maxWorkers=1 --reporter=verbose` with `OPENCLAW_VITEST_INCLUDE_FILE=.tmp/hypura-vitest-include.json`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extensions.config.ts --maxWorkers=1 --reporter=dot` with the same include file
- `node -e "const fs=require('fs'); for (const p of ['extensions/hypura-harness/config/harness.config.json','config/openclaw.vrchat-ai.json','extensions/hypura-harness/openclaw.plugin.json']) JSON.parse(fs.readFileSync(p,'utf8')); console.log('json-ok')"`
- `pnpm docs:list`
- `git diff --check -- <touched paths>`
- `rg "OC_\*|OC_AutoEnabled|OC_State|Expression Parameters named|requiredPrefix" -n README.md docs extensions --glob '*.md' --glob '*.mdx'`
- `node scripts/run-tsgo.mjs -p test/tsconfig/tsconfig.extensions.test.json --pretty false --noEmit`

## Test / verification results

- Python compile: passed.
- Python daemon/unit proof: `36 passed`, with existing FastAPI `on_event`
  deprecation warnings.
- Focused VRChat/Companion3D pytest proof: `11 passed`, same warnings.
- Focused Hypura Harness Vitest proof: `2 files`, `9 tests` passed.
- JSON parse check: passed.
- Docs index listing: passed.
- Diff whitespace check: passed.
- Public Markdown search found no instructions to create custom Expression
  Parameters; the only match says custom parameters are unnecessary for this
  mode.
- Broad extension TypeScript lane failed on pre-existing unrelated dirty
  surfaces in `extensions/anthropic-vertex`, `extensions/local-voice`,
  `extensions/telegram`, and older `extensions/vrchat-relay` test code. The
  failure was not used as proof for this change.

## Residual risks

- Live VRChat OSC, VOICEVOX audio routing, and Electron overlay behavior were
  not exercised because that requires the user's local VRChat client, selected
  avatar, VOICEVOX Engine, and companion process to be running.
- The existing `vrchat-relay` OC-style implementation code still exists for
  older flows, but public docs/config now direct this requirement to the
  Hypura existing-avatar profile flow.
- Companion3D has an asset directory scaffold only; the actual model remains a
  user-approved local file.

## Recommended next actions

- Run the manual VRChat smoke with the official client: enable OSC, wear a
  published avatar, confirm `/avatar/change`, generate and review a suggested
  profile, approve it, run one conservative action, then trigger emergency
  stop.
- Start VOICEVOX and verify speech-to-Companion3D lip-sync plus optional
  VRChat `talk` action when the approved profile contains it.
- Clean or isolate the unrelated existing TypeScript failures before relying
  on the broad extension TypeScript lane.
