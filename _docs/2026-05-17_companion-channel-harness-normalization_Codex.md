# Companion channel harness normalization

## Overview

Normalized the agent-facing LINE, Telegram, Desktop Companion, and Hypura
Harness surfaces for local channel and avatar operation. The pass adds
channel skills, exposes speech, STT, and permission controls through the core
companion tool, and gives VRM/FBX avatars procedural motion when a model has
no matching animation clip.

## Background / requirements

- Normalize LINE and Telegram operation for agents without guessing webhook,
  group, or mention-gating behavior.
- Fix Desktop Companion avatar command handling so renderer-specific
  expressions can pass through instead of being coerced to generic emotions.
- Let OpenClaw AI speech cue expression and motion on FBX/VRM avatars.
- Expose Desktop Companion microphone/STT state through an agent-operable
  OpenClaw harness path with explicit local consent controls.
- Keep Hypura Harness voice/companion guidance aligned with the Desktop
  Companion bridge.
- Preserve unrelated local VRChat relay work already present in the dirty tree.

## Assumptions / decisions

- LINE and Telegram runtime secrets remain external to the repository; this
  pass validates focused lifecycle and mention/webhook behavior, not live
  credentialed delivery.
- `control_companion` is the primary OpenClaw harness surface for local avatar
  and companion-local voice control. Hypura Harness remains the bridge path
  when the user explicitly wants the Hypura mic-to-agent-to-VOICEVOX loop.
- Speech animation should travel with the speech request when possible, so the
  SDK `speak` payload now carries optional emotion and TTS provider fields
  instead of relying only on separate pre-speech avatar commands.
- Live2D keeps its existing `exp_*` expression ids. VRM/FBX use native common
  VRM expressions where possible and procedural fallback motion otherwise.
- Checked-in Desktop Companion JavaScript remains runtime-relevant, so TS and
  JS behavior were both updated while avoiding unrelated generated formatting
  churn.

## Changed files

- `src/agents/tools/companion-control-tool.ts`
- `src/agents/tools/companion-control-tool.test.ts`
- `src/agents/tool-display-config.ts`
- `extensions/live2d-companion/README.md`
- `extensions/live2d-companion/skills/desktop-companion/SKILL.md`
- `extensions/live2d-companion/bridge/event-types.ts`
- `extensions/live2d-companion/companion-ipc-protocol.ts`
- `extensions/live2d-companion/runtime-api.ts`
- `extensions/live2d-companion/runtime-api.js`
- `extensions/live2d-companion/electron/main.ts`
- `extensions/live2d-companion/electron/main.js`
- `extensions/live2d-companion/electron/preload.ts`
- `extensions/live2d-companion/index.ts`
- `extensions/live2d-companion/index.js`
- `extensions/live2d-companion/index.test.ts`
- `extensions/live2d-companion/manifest-skills.test.ts`
- `extensions/live2d-companion/renderer/avatar-state.ts`
- `extensions/live2d-companion/renderer/avatar-state.js`
- `extensions/live2d-companion/renderer/avatar-state.test.ts`
- `extensions/live2d-companion/renderer/app.ts`
- `extensions/live2d-companion/renderer/app.js`
- `extensions/live2d-companion/renderer-ui-state.test.ts`
- `extensions/live2d-companion/renderer/emotion-mapper.ts`
- `extensions/live2d-companion/renderer/emotion-mapper.js`
- `extensions/live2d-companion/renderer/emotion-mapper.test.ts`
- `extensions/live2d-companion/renderer/vrm-controller.ts`
- `extensions/live2d-companion/renderer/vrm-controller.js`
- `extensions/line/openclaw.plugin.json`
- `extensions/line/skills/line-channel/SKILL.md`
- `extensions/line/src/send.ts`
- `extensions/line/src/send.test.ts`
- `extensions/telegram/openclaw.plugin.json`
- `extensions/telegram/skills/telegram-channel/SKILL.md`
- `extensions/telegram/src/token.ts`
- `extensions/telegram/src/token.test.ts`
- `extensions/hypura-harness/README.md`
- `extensions/hypura-harness/index.ts`
- `extensions/hypura-harness/index.test.ts`
- `extensions/hypura-harness/manifest-skills.test.ts`
- `extensions/hypura-harness/scripts/channel_readiness.py`
- `extensions/hypura-harness/scripts/companion_bridge.py`
- `extensions/hypura-harness/scripts/companion_sdk_bridge.mjs`
- `extensions/hypura-harness/scripts/harness_daemon.py`
- `extensions/hypura-harness/scripts/redis_loop.py`
- `extensions/hypura-harness/scripts/voice_bridge.py`
- `extensions/hypura-harness/scripts/tests/test_companion_bridge.py`
- `extensions/hypura-harness/scripts/tests/test_channel_readiness.py`
- `extensions/hypura-harness/scripts/tests/test_harness_daemon.py`
- `extensions/hypura-harness/scripts/tests/test_voice_bridge.py`
- `extensions/hypura-harness/skills/channel-readiness/SKILL.md`
- `extensions/hypura-harness/skills/voice-io/SKILL.md`
- `_docs/2026-05-17_companion-channel-harness-normalization_Codex.md`

## Implementation details

- Added `status`, `mic`, `input_snapshot`, and `permission` to
  `control_companion` so agents can inspect companion state, toggle local STT
  capture, read transcripts/camera/tab context, and update explicit companion
  permissions.
- Added optional `emotion` and `tts_provider` to `control_companion`
  `action=speak`. The tool now forwards those fields through the Desktop
  Companion SDK speech payload so the renderer can apply TTS provider and
  expression state in the same speech command path.
- Extended `speakWithCompanion` and the Companion IPC `speak` action with
  optional `emotion` and `ttsProvider`, and made the renderer honor
  `AvatarCommand.speakEmotion`/`ttsProvider` before starting lip sync.
- Changed Desktop Companion avatar command handling so known generic emotions
  still use `applyEmotion`, while renderer-specific expressions are sent
  directly to the current avatar controller.
- Expanded emotion mapping with Japanese and English keyword detection,
  Live2D-specific expressions, and VRM/FBX-friendly expression and procedural
  motion names.
- Added VRM procedural idle, gaze, expression pulse, and named gesture fallback
  for `happy`, `surprised`, `sad`/`bow`, `angry`/`shake`, `nod`, and left/right
  gestures when no animation clip matches.
- Registered LINE and Telegram skills from their plugin manifests and added
  agent-readable operating guides for webhook lifecycle, group routing,
  mention gating, and focused proof commands.
- Normalized real LINE `U`/`C`/`R` recipient ids after stripping
  `line:user:`, `line:group:`, `line:room:`, or `line:` prefixes. Lowercase
  session-route group ids now become LINE API-compatible uppercase-prefix ids
  before push, while existing short test/custom ids remain unchanged.
- Updated Telegram runtime token resolution so legacy full-string env templates
  such as `${TELEGRAM_BOT_TOKEN}` resolve from `process.env` before plaintext
  token handling. Missing env templates now fail closed instead of being sent
  to Telegram as literal tokens.
- Added LINE and Telegram manifest/skill regression tests so the bundled
  channel operating skills stay registered and keep their focused proof
  commands visible to agents.
- Updated Hypura Harness voice guidance so `animate=true` is documented as
  forwarding inferred emotion to the Desktop Companion before speech.
- Updated the Hypura Companion SDK bridge so inferred emotions from
  `/voice/companion-turn` travel through the same speech payload used by the
  core OpenClaw tool.
- Expanded `hypura_harness_companion` / `/companion/control` to mirror the core
  `control_companion` state surface: `status`, `permission`, `mic`,
  `input_snapshot`, speech `emotion`, and speech `tts_provider` now pass through
  the Hypura daemon and SDK bridge.
- Hardened Hypura companion mic dispatch so SDK bridge failures are reported
  explicitly instead of silently falling back to an empty legacy HTTP request.
- Removed the Hypura SDK bridge's implicit microphone permission grant. The
  `permission` action and `mic` action now stay separate, and mic denial is
  surfaced as a failed bridge result instead of being converted into success.
- Propagated failed Companion bridge results through `/companion/control`,
  `/voice/companion-mic`, and `/voice/companion-turn` so speech or STT failures
  do not look like successful local voice operation.
- Updated Desktop Companion README and skill guidance with the consent-first
  local voice workflow: check status, request/record permission, enable mic,
  read `input_snapshot`, and disable mic when finished.
- Added Desktop Companion and Hypura Harness manifest/skill regression tests so
  their agent operating guides stay registered through `openclaw.plugin.json`.
- Added a Desktop Companion plugin-entry test proving `voicevox_speak` forwards
  `emotion` and `tts_provider` through the SDK speech payload, and that
  assistant output mirroring still reaches the companion speech path.
- Updated Desktop Companion prompt guidance so agents see `control_companion`
  as the primary local avatar harness for status, permission, STT snapshots,
  speech animation, gaze, and model loading before falling back to plugin-only
  speech tools.
- Added renderer-reported avatar activity to `CompanionRuntimeState`. After
  speech, emotion, expression, motion, gesture, pose, look-at, or model-load
  commands are applied in the renderer, `status` now exposes `state.avatar`
  fields such as `lastAction`, `lastEmotion`, `lastMotion`, `lastExpression`,
  and `lastSpeechAt`, giving agents a stronger local proof point than the sent
  command alone.
- Updated the Hypura voice skill to make `hypura_harness_companion` the
  explicit permission/status path before `hypura_harness_companion_mic`.
- Bounded optional Redis loop checks in the Hypura daemon. `/status` now treats
  an unavailable Redis loop as a short-timeout optional dependency and caches
  that unavailable result briefly, preventing Redis connection stalls from
  blocking `/status`, `/voice/devices`, or `/companion/control`.
- Hardened Hypura STT diagnostics. `transcribe_wav` now rejects a missing WAV
  path before launching Whisper and wraps non-zero Whisper exits with concrete
  stderr/stdout detail, so `/voice/transcribe` failures are actionable instead
  of surfacing only a generic process error.
- Updated the machine-local desktop-stack voice configuration so
  `plugins.entries.local-voice.config.vvSpeakerId` is `8`. That makes the
  running local voice setup match the checked-in VOICEVOX Kasukabe Tsumugi
  default instead of continuing to use the older speaker id.
- Refreshed `dist` with the gateway-watch build profile and restarted the local
  desktop-stack gateway against the repo-local `.openclaw-desktop` state so the
  running plugin registry reflected the updated LINE, Telegram, Companion, and
  Hypura harness manifests/skills.
- Enabled `live2d-companion` in the repo-local desktop runtime config for this
  profile, then started the visible Electron companion with Electron-safe
  `NODE_OPTIONS` so the IPC pipe existed for live Hypura bridge proof.

## Commands run

- `pnpm --dir extensions/live2d-companion build`
- `pnpm exec oxfmt --write --threads=1 src/agents/tools/companion-control-tool.ts src/agents/tools/companion-control-tool.test.ts src/agents/tool-display-config.ts`
- `pnpm exec oxfmt --write --threads=1 extensions/live2d-companion/bridge/event-types.ts extensions/live2d-companion/companion-ipc-protocol.ts extensions/live2d-companion/runtime-api.ts extensions/live2d-companion/electron/main.ts extensions/live2d-companion/renderer/app.ts extensions/live2d-companion/index.ts`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.agents-tools.config.ts src/agents/tools/companion-control-tool.test.ts`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extension-line.config.ts extensions/line/src/gateway.lifecycle.test.ts extensions/line/src/monitor.lifecycle.test.ts`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extension-telegram.config.ts extensions/telegram/src/bot-message-context.require-mention.test.ts extensions/telegram/src/webhook-status.test.ts`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extension-line.config.ts extensions/line/manifest-skills.test.ts`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extension-telegram.config.ts extensions/telegram/manifest-skills.test.ts`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extension-line.config.ts extensions/line/src/gateway.lifecycle.test.ts extensions/line/src/monitor.lifecycle.test.ts extensions/line/manifest-skills.test.ts`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extension-telegram.config.ts extensions/telegram/src/bot-message-context.require-mention.test.ts extensions/telegram/src/webhook-status.test.ts extensions/telegram/manifest-skills.test.ts`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extensions.config.ts extensions/live2d-companion/renderer/emotion-mapper.test.ts extensions/hypura-harness/index.test.ts`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extensions.config.ts extensions/hypura-harness/index.test.ts`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extensions.config.ts extensions/live2d-companion/manifest-skills.test.ts extensions/hypura-harness/manifest-skills.test.ts`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extensions.config.ts extensions/live2d-companion/index.test.ts extensions/live2d-companion/manifest-skills.test.ts extensions/hypura-harness/manifest-skills.test.ts extensions/hypura-harness/index.test.ts`
- `pnpm --dir extensions/live2d-companion build`
- `pnpm exec oxfmt --write --threads=1 extensions/live2d-companion/index.ts extensions/live2d-companion/index.js extensions/live2d-companion/index.test.ts`
- `node --check extensions/live2d-companion/index.js`
- `uv run pytest tests/test_companion_bridge.py tests/test_harness_daemon.py -q -p no:randomly`
- `python -m py_compile extensions/hypura-harness/scripts/companion_bridge.py extensions/hypura-harness/scripts/harness_daemon.py extensions/hypura-harness/scripts/tests/test_companion_bridge.py extensions/hypura-harness/scripts/tests/test_harness_daemon.py`
- `python -m py_compile extensions/hypura-harness/scripts/harness_daemon.py extensions/hypura-harness/scripts/tests/test_harness_daemon.py`
- `node --check extensions/live2d-companion/renderer/app.js`
- `node --check extensions/live2d-companion/electron/main.js`
- `node --check extensions/live2d-companion/index.js`
- `node --check extensions/live2d-companion/runtime-api.js`
- `node --check extensions/hypura-harness/scripts/companion_sdk_bridge.mjs`
- `node --check extensions/live2d-companion/renderer/vrm-controller.js`
- `node --check extensions/live2d-companion/renderer/emotion-mapper.js`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extensions.config.ts src/agents/tools/companion-control-tool.test.ts extensions/live2d-companion/index.test.ts extensions/live2d-companion/renderer/emotion-mapper.test.ts extensions/live2d-companion/manifest-skills.test.ts extensions/hypura-harness/index.test.ts extensions/hypura-harness/manifest-skills.test.ts`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.agents-tools.config.ts src/agents/tools/companion-control-tool.test.ts`
- `node --check extensions/live2d-companion/renderer/app.js`
- `node --check extensions/live2d-companion/renderer/emotion-mapper.js`
- `node --check extensions/live2d-companion/runtime-api.js`
- `node scripts/run-tsgo.mjs -p extensions/live2d-companion/tsconfig.json --noEmit`
- Desktop Companion renderer-avatar-state IPC smoke: started Electron from
  `extensions/live2d-companion/electron/main.js`, waited for renderer startup,
  called `speakWithCompanion({ emotion: "happy", ttsProvider: "web-speech" })`,
  polled `getCompanionState`, and stopped the spawned Electron process tree.
- `node openclaw.mjs --profile desktop-stack channels status --json`
- `node openclaw.mjs --profile desktop-stack plugins list --json` with output
  filtered locally to `line`, `telegram`, `live2d-companion`, and
  `hypura-harness`.
- `pnpm docs:list`
- `git diff --check`
- `Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'node|electron|openclaw' } | Select-Object ProcessId,Name,CommandLine`
- Desktop Companion IPC smoke: started Electron from
  `extensions/live2d-companion/electron/main.js`, called
  `getCompanionState`, `getCompanionInputSnapshot`, and
  `speakWithCompanion({ emotion: "happy", ttsProvider: "voicevox" })`, then
  stopped the spawned Electron process tree.
- Hypura SDK bridge consent smoke: started Electron from
  `extensions/live2d-companion/electron/main.js`, set mic permission to denied,
  called `extensions/hypura-harness/scripts/companion_sdk_bridge.mjs` with
  `micEnabled: true`, verified `micResult.ok=false`, and stopped the spawned
  Electron process tree.
- `node scripts/build-all.mjs gatewayWatch`
- `rg 'state\.avatar|input_snapshot|tts_provider|desktop-companion|line-channel|telegram-channel|hypura-voice-io' dist/extensions/...`
- Restarted the local desktop-stack gateway on port `18789` with the repo-local
  `.openclaw-desktop` config/token environment and `NODE_OPTIONS=--use-system-ca`.
- `node openclaw.mjs --profile desktop-stack channels status --json` with the
  repo-local gateway token/config environment.
- `node openclaw.mjs --profile desktop-stack channels status --channel telegram --probe --json`
- `node openclaw.mjs --profile desktop-stack channels status --channel line --probe --json`
- LINE webhook verification: `POST https://api.line.me/v2/bot/channel/webhook/test`
  with the configured LINE channel token.
- Telegram Bot API verification: `getMe` using the configured bot token.
- Telegram outbound proof: `node openclaw.mjs --profile desktop-stack message send --channel telegram --target <configured chat id> --message ... --silent --json`
- `uv run pytest tests/test_harness_daemon.py tests/test_companion_bridge.py -q -p no:randomly`
- `python -m py_compile extensions/hypura-harness/scripts/redis_loop.py extensions/hypura-harness/scripts/harness_daemon.py extensions/hypura-harness/scripts/tests/test_harness_daemon.py extensions/hypura-harness/scripts/tests/test_companion_bridge.py`
- Restarted `extensions/hypura-harness/scripts/harness_daemon.py` on port
  `18794` after the Redis timeout fix.
- `GET http://127.0.0.1:18794/status`
- `GET http://127.0.0.1:18794/voice/devices`
- `POST http://127.0.0.1:18794/companion/control` with `status`,
  `input_snapshot`, `load_model`, and `speak`.
- Started the Desktop Companion Electron runtime from
  `extensions/live2d-companion/electron/main.js` and polled
  `getCompanionState`.
- `python -m py_compile extensions/hypura-harness/scripts/voice_bridge.py extensions/hypura-harness/scripts/tests/test_voice_bridge.py`
- `uv run pytest tests/test_voice_bridge.py -q -p no:randomly -s`
- `node openclaw.mjs config set plugins.entries.local-voice.config.vvSpeakerId 8 --strict-json`
- Telegram direct credential probe with `NODE_OPTIONS=--use-system-ca`:
  `probeTelegram(..., includeWebhookInfo=true)`.
- LINE direct credential probe with `NODE_OPTIONS=--use-system-ca`:
  `probeLineBot(...)`.
- VOICEVOX speaker proof: queried `/speakers`, generated a speaker 8 WAV with
  `/audio_query` + `/synthesis`, and sent that WAV through Hypura
  `/voice/transcribe`.
- `POST http://127.0.0.1:18794/voice/test-say` with `speaker=8`.
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extensions.config.ts extensions/live2d-companion/renderer/avatar-state.test.ts extensions/live2d-companion/renderer/emotion-mapper.test.ts --reporter=verbose`
- `pnpm --dir extensions/live2d-companion build`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extensions.config.ts extensions/live2d-companion/renderer/avatar-state.test.ts extensions/live2d-companion/renderer/emotion-mapper.test.ts extensions/live2d-companion/renderer/lip-sync.test.ts extensions/live2d-companion/manifest-skills.test.ts --reporter=verbose`
- VOICEVOX direct speaker 8 proof: `/speakers` confirmed speaker id 8 maps to
  Kasukabe Tsumugi / Normal, and local `/audio_query` + `/synthesis` produced
  a 65068-byte WAV for the Tsumugi proof phrase.
- `uv run pytest tests/test_channel_readiness.py tests/test_harness_daemon.py -q -p no:randomly`
- `python -m py_compile extensions/hypura-harness/scripts/channel_readiness.py extensions/hypura-harness/scripts/harness_daemon.py`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extensions.config.ts extensions/hypura-harness/index.test.ts extensions/hypura-harness/manifest-skills.test.ts --reporter=verbose`
- `node scripts/build-all.mjs gatewayWatch`
- `node --check dist/extensions/hypura-harness/index.js`
- `GET http://127.0.0.1:18794/channels/readiness`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extension-line.config.ts extensions/line/src/send.test.ts extensions/line/manifest-skills.test.ts --reporter=verbose`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extension-telegram.config.ts extensions/telegram/src/token.test.ts extensions/telegram/manifest-skills.test.ts --reporter=verbose`
- `node --check dist/extensions/line/runtime-api.js`
- `node --check dist/extensions/telegram/runtime-api.js`
- `node --check dist/extensions/telegram/api.js`
- Direct live runtime proof with `NODE_OPTIONS=--use-system-ca` for LINE and
  Telegram; the script redacted raw routing ids and tokens from output.
- Direct global-state Telegram live proof with `NODE_OPTIONS=--use-system-ca`;
  the script used the repo-local target without printing it and redacted raw
  routing ids and tokens from output.

## Test / verification results

- Desktop Companion TypeScript build passed before pruning unrelated generated
  formatting churn.
- Companion tool test passed: 1 file, 8 tests.
- LINE focused lifecycle tests passed: 2 files, 9 tests.
- Telegram mention/webhook focused tests passed: 2 files, 5 tests.
- LINE and Telegram manifest/skill regression tests passed: 1 file and 1 test
  each after formatting.
- LINE lifecycle plus manifest skill proof passed: 3 files, 10 tests.
- Telegram mention/webhook plus manifest skill proof passed: 3 files, 6 tests.
- Desktop Companion emotion mapper plus Hypura Harness tests passed: 2 files,
  9 tests.
- Hypura Harness plugin test passed after companion-control expansion: 1 file,
  6 tests.
- Desktop Companion/Hypura manifest skill tests passed: 2 files, 2 tests.
- Desktop Companion plugin-entry plus companion/hypura manifest and Hypura
  plugin tests passed after `control_companion` guidance was added: 4 files,
  11 tests.
- Latest companion/hypura focused rerun passed for 5 files and 15 tests under
  the extensions config; `src/agents/tools/companion-control-tool.test.ts`
  then passed separately under the agents-tools config: 1 file, 8 tests.
- Renderer-avatar-state focused rerun passed after adding `state.avatar`: 6
  files, 18 tests.
- Desktop Companion `tsgo` no-emit check passed for
  `extensions/live2d-companion/tsconfig.json`.
- Hypura Harness Python bridge/daemon tests passed: 31 tests.
- Python syntax compilation passed for the changed Hypura bridge, daemon, and
  focused tests.
- Runtime JavaScript syntax checks passed for the changed Desktop Companion
  renderer files.
- Documentation listing and whitespace checks completed successfully.
- No stray Electron/Desktop Companion process was left running; remaining
  `node.exe` processes were the existing desktop-stack gateway/TUI and Codex
  app server.
- Desktop Companion IPC smoke passed against the local `.openclaw-desktop`
  state: IPC became ready, `Hakua.fbx` was the active local-reference FBX
  asset, `ttsProvider` was `voicevox`, STT capability reported available, mic
  remained denied, and `input_snapshot` returned without camera or transcript.
- Desktop Companion renderer-avatar-state IPC smoke passed against the local
  `.openclaw-desktop` state: after `speakWithCompanion` with `emotion="happy"`
  and `ttsProvider="web-speech"`, `getCompanionState()` reported active
  `Hakua.fbx` (`assetType="fbx"`), `state.avatar.lastAction="speak"`,
  `lastEmotion="happy"`, `lastExpression="happy"`, `lastMotion="happy"`,
  `lastMotionIndex=0`, and a populated `lastSpeechAt`.
- Hypura SDK bridge consent smoke passed: with mic permission denied,
  `micEnabled: true` returned `micResult.ok=false`, left mic permission denied,
  and left mic inactive.
- Desktop-stack channel status could not complete live RPC verification because
  the local gateway rejected the CLI connection with a gateway token mismatch.
  The config-only fallback showed `line` and `telegram` are configured channels.
- Desktop-stack plugin inventory showed `line`, `telegram`, and
  `hypura-harness` enabled and loaded from the current `dist` registry;
  `live2d-companion` is present but disabled in that desktop-stack plugin
  configuration.
- The gateway-watch build completed successfully and refreshed `dist`. Follow-up
  `rg` checks confirmed the built plugin assets contain `input_snapshot`,
  `tts_provider`, `state.avatar` guidance, and the `desktop-companion`,
  `hypura-voice-io`, `line-channel`, and `telegram-channel` skills.
- After launching with the repo-local gateway token/config, desktop-stack RPC
  recovered: `channels status` returned `telegram.running=true`,
  `telegram.connected=true`, `line.running=true`, `line.mode=webhook`, and no
  channel errors.
- Telegram credential probe passed through OpenClaw (`probe.ok=true`) and direct
  Bot API `getMe` returned HTTP 200 with a bot identity present.
- LINE credential probe passed through OpenClaw (`probe.ok=true`) and the
  official LINE webhook test endpoint returned HTTP 200 with
  `success=true`.
- OpenClaw Telegram outbound proof passed through the plugin delivery path:
  `message send` returned `handledBy="plugin"`, `ok=true`, and a Telegram
  message id; the follow-up channel status showed `lastOutboundAt` populated
  and no Telegram error.
- The repo-local desktop-stack plugin inventory now shows `line`, `telegram`,
  `live2d-companion`, and `hypura-harness` all enabled and loaded from `dist`.
- Hypura harness Python tests now pass: 32 tests, including the new Redis
  unavailable-cache regression.
- Hypura harness `/status` no longer stalls when Redis is absent: live status
  returned HTTP 200 with `voicevox_alive=true`, `ollama_alive=true`, and
  `loop.redis="unavailable"`.
- Hypura harness `/voice/devices` returned HTTP 200 with local audio device
  inventory.
- Desktop Companion Electron started successfully after stripping
  Electron-incompatible `NODE_OPTIONS`, and `getCompanionState` returned IPC
  state from the visible runtime.
- Hypura `/companion/control` live proof passed: `load_model` loaded the
  creator-acknowledged local `Hakua.fbx`, `speak` with `emotion=happy` and
  `tts_provider=voicevox` returned success, and follow-up `status` reported
  active `Hakua.fbx` (`assetType="fbx"`), `ttsProvider="voicevox"`,
  `voice.sttAvailable=true`, and current renderer-reported avatar activity
  (`lastAction="speak"`, `lastEmotion="happy"`, `lastMotion="happy"`,
  `lastSpeechAt` populated).
- VOICEVOX Engine was started from the local VOICEVOX install and `/speakers`
  confirmed speaker id `8` is `春日部つむぎ / ノーマル`. Local Voice,
  Desktop Companion, and Hypura Harness docs now treat Kasukabe Tsumugi speaker
  8 as the default local speech voice.
- Hypura `/status` was rechecked after widening the bounded dependency probe
  timeout: live status returned `voicevox_alive=true` while preserving bounded
  Redis/optional dependency handling.
- Desktop Companion mic start now works under Electron without rebuilding repo
  `node_modules` for Electron ABI: Electron falls back to a Node worker for
  `naudiodon` microphone capture. Live `permission` -> `mic enabled=true` ->
  `mic enabled=false` returned `micResult.ok=true`; no transcript was expected
  because no operator speech was provided during the smoke.
- Desktop Companion `window_capture` now returns a renderer image again after
  Companion restart. The proof artifact is
  `_docs/2026-05-17_desktop-companion-renderer-window-capture.png`; pixel
  sampling saw a 380x480 image with 624/624 non-transparent samples and 76
  bright samples.
- Latest focused checks after the VOICEVOX/STT/window-capture pass:
  `src/agents/tools/companion-control-tool.test.ts` passed 9 tests;
  Desktop Companion/Hypura manifest and plugin tests plus Local Voice audio
  input tests passed 17 tests; Hypura daemon/bridge Python tests passed 33
  tests; Python syntax compilation passed for the changed Hypura files.
- Hypura STT diagnostic regression tests passed: 2 tests covering missing WAV
  input and surfaced Whisper stderr.
- Machine-local voice config now reports `local-voice` `vvSpeakerId=8`.
- VOICEVOX `/speakers` confirmed speaker id `8` is
  `春日部つむぎ / ノーマル`. A generated speaker 8 WAV contained 8 accent
  phrases and 324652 bytes, and Hypura `/voice/transcribe` returned a Japanese
  transcript for the proof phrase. Whisper recognized the content but rendered
  the speaker name phonetically as `カスカベツ麦`, which is an STT recognition
  artifact rather than a VOICEVOX speaker mismatch.
- Hypura `/voice/test-say` accepted `speaker=8` and returned success, proving
  the local harness voice playback route is no longer pinned to the older
  speaker id.
- Direct Telegram and LINE official API probes passed when run with the same
  system CA mode used by the desktop gateway. Telegram `getMe` returned a bot
  identity for `hakuawhite_bot` and no webhook URL; LINE bot info returned the
  configured bot display name `はくあ`.
- Follow-up VOICEVOX/provider fix: `extensions/local-voice/voicevox-speech-provider.ts`
  now honors legacy `vvEndpoint` and `vvSpeakerId` desktop runtime keys, and
  `.openclaw-desktop/openclaw.json` is set to `vvSpeakerId=8`.
- Follow-up Desktop Companion voice fix:
  `extensions/live2d-companion/renderer/lip-sync.ts` and the runtime JS no
  longer fall back to browser Web Speech when `ttsProvider="voicevox"` is
  selected and VOICEVOX fails. This prevents the voice from silently becoming
  the mechanical system/browser TTS path.
- Follow-up channel status fix: `src/commands/channels/status.ts`,
  `src/cli/command-secret-gateway.ts`, and read-only channel discovery now use
  fast source config, skip a second gateway SecretRef call after gateway
  failure, skip SecretRef resolution for JSON fallback, and avoid expensive
  metadata scans during config-only status formatting.
- Follow-up Hypura playback fix:
  `extensions/hypura-harness/scripts/voicevox_sequencer.py` now runs playback
  off the FastAPI event loop and bounds playback thread joins with
  `HYPURA_VOICE_PLAYBACK_TIMEOUT_SEC` (default 10 seconds). `/voice/test-say`
  and `/voice/turn` now call playback through `asyncio.to_thread`.
- Latest VOICEVOX direct proof confirmed speaker id `8` is
  `春日部つむぎ / ノーマル`, and `/synthesis` returned HTTP 200 with a
  65068-byte WAV for `はくあです。`.
- Latest Hypura live proof after daemon restart: `/status` returned HTTP 200
  with `voicevox_alive=true`; `/voice/test-say` with speaker 8 returned HTTP
  200 success for `はくあです。` in 4173ms; a follow-up `/status` returned
  HTTP 200 in 1153ms, proving voice playback no longer blocks the daemon event
  loop.
- Latest channel status proof: source-level
  `channelsStatusCommand({ json: true, timeout: "1000" })` returned config-only
  JSON with `discord`, `line`, `slack`, and `telegram` in about 10.4 seconds
  including TypeScript import time. After `pnpm build`, built
  `node openclaw.mjs channels status --json --timeout 1000` exits successfully
  with the same config-only JSON instead of hanging on a second gateway
  SecretRef wait; the remaining 21.4 second runtime is full CLI startup plus
  unavailable-gateway fallback cost.
- Latest focused tests passed:
  `extensions/local-voice/voicevox-speech-provider.test.ts` and
  `extensions/live2d-companion/renderer/lip-sync.test.ts` passed 2 tests;
  channel command/config-only tests passed 10 tests; CLI SecretRef tests passed
  27 tests; read-only channel plugin discovery tests passed 23 tests; Hypura
  daemon/bridge/voice Python tests passed 35 tests; `pnpm build` and
  `git diff --check` passed.
- Local Voice now has its own agent-readable operating skill at
  `extensions/local-voice/skills/local-voice/SKILL.md`, and
  `extensions/local-voice/openclaw.plugin.json` registers `skills: ["./skills"]`.
  The skill documents the Local Voice command path, STT consent boundary,
  VOICEVOX endpoint/speaker config, Kasukabe Tsumugi speaker 8 default, and
  troubleshooting for mechanical voice fallback.
- Desktop Companion avatar speech-state reporting now lives in
  `extensions/live2d-companion/renderer/avatar-state.ts`. The renderer uses the
  same helper for speech and emotion state, so Live2D reports Live2D
  motion/expression ids while VRM/FBX report native expression names and
  procedural motion names during AI speech.
- Local Voice manifest skill proof passed with
  `extensions/local-voice/manifest-skills.test.ts` plus the VOICEVOX provider
  regression. The combined skill proof also passed for Desktop Companion,
  Hypura Harness, Local Voice, LINE, and Telegram. A follow-up `pnpm build`
  copied the Local Voice skill into
  `dist/extensions/local-voice/skills/local-voice/SKILL.md`, and `rg` confirmed
  the built skill contains `Kasukabe Tsumugi`, `/voice-assistant start`, and
  `vvSpeakerId`.
- Latest Desktop Companion speech-state regression passed: 4 files and 9 tests
  covered `avatar-state`, emotion mapping, VOICEVOX no-web-speech fallback, and
  plugin skill registration. The new avatar-state tests prove AI speech state
  reports Live2D `TapBody`/`exp_happy`, VRM `happy` motion/expression, and FBX
  `surprised` motion/expression with populated `lastSpeechAt`.
- Desktop Companion `pnpm --dir extensions/live2d-companion build` passed after
  adding `renderer/avatar-state.ts`, generating the runtime
  `renderer/avatar-state.js` and refreshing `renderer/app.js`.
- Latest VOICEVOX direct proof reconfirmed speaker id 8 is Kasukabe Tsumugi /
  Normal and synthesis produced a 65068-byte WAV. A first `/speakers` probe
  timed out with a 5 second client timeout, but `/version` returned 0.25.2 and
  the longer local API proof succeeded.
- The referenced `deep-research-report (3).md` was reviewed as companion UX,
  renderer, desktop shell, IPC security, and testing context. The implemented
  pass kept the current goal narrower than the full oshikoi-style roadmap:
  channel recovery, local VOICEVOX/STT, Desktop Companion animation/capture,
  and harness skills/tools.
- Current repo asset inventory initially found local FBX assets only:
  `apps/macos/Packaging/NFD/Hakua/FBX/FBX/Hakua.fbx`,
  `Hakua_Kisekae.fbx`, and `Hakua_Head_ForMARUBODY.fbx`. A follow-up live VRM
  proof used the official `@pixiv/three-vrm` release example model
  `VRM1_Constraint_Twist_Sample.vrm` from
  `packages/three-vrm/examples/models/` as a local-only proof asset. The
  `pixiv/three-vrm` repository license file is MIT; the downloaded file was
  kept under `.openclaw-desktop/proof-assets/` and imported with
  `remoteUploadForbidden=true`.
- Latest Desktop Companion restart proof loaded `Hakua.fbx`, kept
  `ttsProvider="voicevox"`, reported STT available through
  `local-voice-whisper`, and after `speak` with `emotion="happy"` reported
  `avatar.lastAction="speak"`, `lastEmotion="happy"`,
  `lastExpression="happy"`, `lastMotion="happy"`, `lastMotionIndex=0`, and a
  fresh `lastSpeechAt`.
- Desktop Companion `window_capture` was hardened again after a restart exposed
  a stale timeout path. The final path tries a renderer canvas/status capture in
  one bounded renderer execution, then on Windows falls back to a 1 second GDI
  crop of the Companion window. The latest proof returned a 380x480 PNG from
  `desktop-companion-renderer-canvas` with 58099 bytes and refreshed
  `_docs/2026-05-17_desktop-companion-renderer-window-capture.png`.
- Live VRM proof now passes. The local proof asset
  `VRM1_Constraint_Twist_Sample.vrm` was imported with `importMode="local-copy"`,
  `assetType="vrm"`, `rightsAcknowledged=true`, SHA-256
  `12c2b97e95e700783a6a550dc0eee2d7880aeedccef9ae67bc4c5a2f0f2631a2`, then
  activated in Desktop Companion. Direct `speak` with
  `ttsProvider="voicevox"` and `emotion="happy"` reported active
  `VRM1_Constraint_Twist_Sample.vrm` and updated `state.avatar` to
  `lastAction="speak"`, `lastEmotion="happy"`, `lastExpression="happy"`,
  `lastMotion="happy"`, `lastMotionIndex=0`, and a fresh `lastSpeechAt`.
- Hypura Harness VRM proof now also passes through `/companion/control`.
  `action="speak"`, `emotion="surprised"`, and `tts_provider="voicevox"`
  returned `success=true`, `ok=true`, and `speechState.avatar` plus follow-up
  `status.state.avatar` both reported active VRM speech state with
  `lastExpression="surprised"` and `lastMotion="surprised"`.
- Desktop Companion main now records an optimistic avatar command state before
  sending the renderer command. This prevents `control_companion` and
  `hypura_harness_companion` from returning stale state when the renderer
  command ack is delayed; renderer-reported updates can still refine the state
  afterward. The logic is covered by
  `extensions/live2d-companion/avatar-command-state.test.ts`.
- Latest STT consent smoke passed without printing local audio contents:
  `permission(mic=granted)` -> `mic enabled=true` -> `input_snapshot` ->
  `mic enabled=false` all returned `ok=true`; no transcript was expected because
  no operator phrase was spoken during this smoke.
- Latest channel status proof: built `node openclaw.mjs channels status --json
--timeout 1000` exited 0 in about 14.6-16.9 seconds with config-only JSON;
  `gatewayReachable=false`, `configOnly=true`, and `configuredChannels`
  contained `discord`, `line`, `slack`, and `telegram`.
- Latest Hypura/VOICEVOX proof: `/status` returned HTTP 200 with
  `voicevox_alive=true`; `/voice/test-say` accepted the Kasukabe Tsumugi phrase
  with `speaker=8` and returned `success=true`; VOICEVOX `/speakers` confirmed
  speaker id 8 is `春日部つむぎ / ノーマル`.
- Latest Hypura STT proof: a generated VOICEVOX speaker 8 proof WAV
  `.openclaw-desktop/proof-assets/voicevox-tsumugi-stt-proof.wav` was 196652
  bytes, and posting it to `/voice/transcribe` returned `success=true` with
  Japanese transcript text. Whisper recognized the content imperfectly
  (`春日部つむぎ` was rendered phonetically and `音声入力` as a near homophone), but
  the current path proved VOICEVOX-generated Japanese audio can flow through
  Hypura STT and produce a transcript.
- Latest Desktop Companion focused tests passed: 8 files and 22 tests covered
  plugin speech tooling, manifest skills, renderer UI state, avatar factory,
  optimistic avatar command state, avatar speech-state reporting, VRM/FBX
  emotion mapping, and the VOICEVOX no-Web-Speech fallback.
- Latest Hypura bridge tests passed: 35 tests covering daemon, companion bridge,
  and voice bridge behavior.
- Latest build/static proof passed after the capture hardening:
  `pnpm --dir extensions/live2d-companion build`,
  `node scripts/build-all.mjs gatewayWatch`, `node --check` on the touched
  runtime files and built plugin entries, `git diff --check`, and built-asset
  `rg` checks for `control_companion`, `hypura_harness_companion`,
  `Kasukabe Tsumugi`, `line-channel`, `telegram-channel`, `tts_provider`, and
  `state.avatar`.
- Latest LINE/Telegram skill closeout: the bundled channel skills now separate
  credential/webhook proof from live roundtrip proof, require a real LINE
  recipient or Telegram chat id before outbound live proof, and instruct agents
  not to print raw routing identifiers in shared logs. The focused LINE and
  Telegram manifest skill tests both passed. `node scripts/build-all.mjs
gatewayWatch` refreshed the runtime overlay, `rg` confirmed the updated
  `line-channel` and `telegram-channel` skill sections under `dist/extensions`,
  and `git diff --check` passed.
- Final current-state audit rechecked built `channels status --json --timeout
1000`: the gateway was closed, but the command still exited with config-only
  JSON listing `discord`, `line`, `slack`, and `telegram`. Hypura
  `/voice/transcribe` was re-run against the generated speaker 8 WAV and
  returned `success=true` with a non-empty transcript. Local LINE config was
  inspected without printing secrets or routing ids; it has LINE config present
  but no concrete `userId`, `groupId`, `roomId`, `to`, or LINE-shaped group key.
- Hypura Harness now exposes channel readiness through
  `hypura_harness_channel_readiness` and daemon `GET /channels/readiness`.
  The diagnostic reads the active OpenClaw config plus local channel
  `allowFrom` stores, reports credential presence and target candidate counts,
  and never returns tokens or raw routing ids. Focused Python tests covered
  missing targets, JSONC config parsing, allowFrom-store target discovery, and
  endpoint redaction; focused TS tests covered OpenClaw tool wiring and prompt
  context. After restarting the repo-local harness process, live HTTP
  `/channels/readiness` returned `success=true`; the active environment config
  has LINE and Telegram credentials present but no live target candidates, so
  both channels still need one real inbound message or explicit target before
  final live roundtrip proof. Latest verification for this slice:
  Hypura Python readiness/daemon tests passed 31 tests, Hypura TS tool/manifest
  tests passed 10 tests, `node scripts/build-all.mjs gatewayWatch` refreshed
  `dist/extensions/hypura-harness`, `node --check dist/extensions/hypura-harness/index.js`
  passed, Python syntax compilation passed, live HTTP `/channels/readiness`
  returned `success=true`, and `git diff --check` passed.
- Follow-up readiness hardening now also counts recent Telegram
  `.telegram-sent-messages.json` runtime history as redacted target
  candidates. Focused tests cover the history path without exposing the chat
  id, and repo-local `.openclaw-desktop` readiness now reports Telegram
  `directChats=1` and `liveRoundtripReady=true`; the active daemon environment
  still reports no Telegram target candidate because its current config/state
  has no chat history.
- Follow-up readiness hardening also counts structured session-route target
  fields for LINE and Telegram without printing raw ids. The active daemon
  environment now reports LINE credentials present, one group target candidate,
  and `line.liveRoundtripReady=true`.
- Final LINE/TG live closeout passed with the rebuilt `dist` runtime and
  `NODE_OPTIONS=--use-system-ca`: LINE direct runtime send used the
  session-route target and returned `messageIdPresent=true` and
  `chatIdPresent=true`; Telegram direct runtime send used the repo-local
  `TELEGRAM_CHAT_ID` target and env-template-resolved bot token and returned
  `messageIdPresent=true` and `chatIdPresent=true`. A second Telegram send
  against the global OpenClaw state also returned success with a message id.
- LINE send regression proof passed: 2 files and 14 tests, including lowercase
  real LINE group id normalization before push.
- Telegram token regression proof passed: 2 files and 26 tests, with 1
  Windows symlink-specific test skipped. The new coverage proves
  `${TELEGRAM_BOT_TOKEN}` resolves from `process.env` and unresolved templates
  are not treated as plaintext tokens.
- `node scripts/build-all.mjs gatewayWatch` passed after the LINE/TG fixes and
  refreshed `dist`; built runtime syntax checks passed for LINE runtime API,
  Telegram runtime API, Telegram API, and Hypura Harness.

## Residual risks

- Live mic capture now starts and stops, and a synthetic VOICEVOX speaker 8 WAV
  transcribed successfully through Hypura STT. A full operator-microphone
  transcript still needs an intentional spoken phrase.
- The Companion window proof is a still renderer capture, not a video proof of
  continuous animation.
- VRM live proof now covers active asset state and speech animation state
  through both Desktop Companion and Hypura Harness. The VRM WebGL screenshot
  path can still return `null` on this Windows/Electron stack when the renderer
  is busy; FBX has the stronger post-speech renderer-canvas PNG proof.
- LINE live outbound now has a direct runtime proof against the active
  session-route target. Future fresh states still need one inbound LINE message
  or an explicit target before the readiness tool can report a candidate.
- Telegram live outbound now has direct runtime proofs for both repo-local and
  global OpenClaw state using an explicit target. The active Hypura daemon
  readiness endpoint can still report no Telegram target when that same daemon
  state has no inbound update, allowFrom entry, or sent-message history for the
  target; this is a state-population gap, not the token/runtime bug fixed here.
- Full `openclaw.mjs channels status --json --timeout 1000` still spends about
  21 seconds in full CLI startup plus unavailable-gateway fallback on this
  checkout. It now exits with config-only JSON instead of hanging, but a
  broader CLI-startup optimization is outside this pass.
- The worktree already contained unrelated VRChat relay tracked and untracked
  changes. This pass preserved them and did not include them in the
  implementation scope.

## Recommended next actions

- Run one explicit live mic capture after operator consent, then verify
  transcript flow through `input_snapshot` and
  `hypura_harness_companion_voice_turn`.
- Capture a short video proof if the result needs reviewable continuous
  animation rather than a still renderer artifact.
