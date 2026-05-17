# Desktop Companion VRM-first renderer alignment

Date: 2026-05-17
Agent: Codex

## Scope

Aligned the local Desktop Companion renderer selection with the oshikoi-style
companion implementation plan: VRM/FBX are the preferred open 3D paths and
Live2D remains an explicit compatibility path.

## Changes

- Updated `extensions/live2d-companion/renderer/avatar-factory.ts` and the
  checked-in runtime JS peer so `avatarType: "auto"` and unknown model paths
  fall back to the VRM/Three.js renderer instead of Live2D.
- Added `extensions/live2d-companion/renderer/avatar-factory.test.ts` to lock
  VRM/FBX inference, explicit Live2D model detection, and the auto/unknown VRM
  fallback.
- Narrowed the plugin SDK facade type for `speakWithCompanion` so the existing
  emotion and TTS-provider payload fields are reflected in the public surface.
- Added a Windows GDI fallback behind the existing renderer-canvas,
  `webContents.capturePage`, and `desktopCapturer` paths so live visual proof
  still has a local-only last resort on Windows.
- Updated platform docs so Windows and Linux describe the current source
  Desktop Companion overlay separately from the still-planned packaged native
  companion apps.
- Added the Desktop Companion overlay to the OpenClaw end-to-end next-step links.
- Added strict-local character profile persistence in
  `extensions/live2d-companion/companion-profile.ts`, backed by
  `.openclaw-desktop/companion_profile.json`.
- Exposed `getCompanionProfile` and `updateCompanionProfile` through the
  `live2d-companion` runtime API and plugin SDK facade.
- Added `control_companion({ action: "profile" })` for agents to read or update
  display name, character prompt, greeting, mood, voice profile, and relationship
  state without inventing transient companion identity.
- Updated the renderer dock to show the current local character name and mood.
- Added a Character profile card to the companion setup panel so local users can
  edit display name, mood, greeting, persona prompt, voice profile, and
  relationship state without going through an agent tool.
- Connected saved local character profiles to the plugin `before_prompt_build`
  hook. The hook reads `.openclaw-desktop/companion_profile.json` directly and
  appends a bounded Desktop Companion Profile section to system context when the
  user has customized the profile, so companion turns can use the saved name,
  mood, greeting, voice profile, relationship label, and persona notes even when
  the Electron overlay is not running.

## Verification

- `node --check extensions\live2d-companion\renderer\avatar-factory.js`
- `git diff --check -- extensions/live2d-companion/renderer/avatar-factory.ts extensions/live2d-companion/renderer/avatar-factory.js extensions/live2d-companion/renderer/avatar-factory.test.ts src/plugin-sdk/live2d-companion.ts`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extensions.config.ts extensions/live2d-companion/renderer/avatar-factory.test.ts --reporter=verbose`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extensions.config.ts extensions/live2d-companion/renderer/avatar-state.test.ts extensions/live2d-companion/renderer/emotion-mapper.test.ts extensions/live2d-companion/renderer/avatar-factory.test.ts --reporter=verbose`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.agents-tools.config.ts src/agents/tools/companion-control-tool.test.ts --reporter=verbose`
- `pnpm --dir extensions/live2d-companion build`
- `node --check extensions\live2d-companion\electron\main.js`
- `git diff --check -- docs/platforms/index.md docs/platforms/windows.md docs/platforms/linux.md docs/start/openclaw.md _docs/2026-05-17_desktop-companion-vrm-first_Codex.md extensions/live2d-companion/renderer/avatar-factory.ts extensions/live2d-companion/renderer/avatar-factory.js extensions/live2d-companion/renderer/avatar-factory.test.ts extensions/live2d-companion/electron/main.ts extensions/live2d-companion/electron/main.js src/plugin-sdk/live2d-companion.ts`
- `pnpm docs:list`
- `pnpm --dir extensions/live2d-companion build`
- `node --check extensions\live2d-companion\companion-profile.js`
- `node --check extensions\live2d-companion\runtime-api.js`
- `node --check extensions\live2d-companion\electron\main.js`
- `node --check src\plugin-sdk\live2d-companion.js`
- `node --check extensions\live2d-companion\electron\preload.js`
- `node --check extensions\live2d-companion\renderer\app.js`
- `node --check extensions\live2d-companion\renderer\ui-state.js`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extensions.config.ts extensions/live2d-companion/companion-profile.test.ts extensions/live2d-companion/renderer-ui-state.test.ts extensions/live2d-companion/renderer/avatar-factory.test.ts --reporter=verbose`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.agents-tools.config.ts src/agents/tools/companion-control-tool.test.ts --reporter=verbose`
- `pnpm plugin-sdk:api:gen`
- `pnpm plugin-sdk:api:check`
- `pnpm plugin-sdk:check-exports`
- `pnpm docs:list`
- `pnpm exec oxfmt --write --threads=1 extensions/live2d-companion/companion-profile.ts extensions/live2d-companion/companion-profile.test.ts extensions/live2d-companion/index.ts extensions/live2d-companion/index.test.ts`
- `pnpm --dir extensions/live2d-companion build`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extensions.config.ts extensions/live2d-companion/index.test.ts extensions/live2d-companion/companion-profile.test.ts extensions/live2d-companion/renderer-ui-state.test.ts extensions/live2d-companion/renderer/avatar-factory.test.ts --reporter=verbose`
- `node --check extensions\live2d-companion\index.js`
- `node --check extensions\live2d-companion\companion-profile.js`
- `node --check extensions\live2d-companion\renderer\app.js`
- `node --check extensions\live2d-companion\runtime-api.js`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.agents-tools.config.ts src/agents/tools/companion-control-tool.test.ts --reporter=verbose`
- `pnpm docs:list`
- `git diff --check -- docs/platforms/index.md docs/platforms/windows.md docs/platforms/linux.md docs/start/openclaw.md _docs/2026-05-17_desktop-companion-vrm-first_Codex.md extensions/live2d-companion/companion-profile.ts extensions/live2d-companion/companion-profile.js extensions/live2d-companion/companion-profile.test.ts extensions/live2d-companion/index.ts extensions/live2d-companion/index.js extensions/live2d-companion/index.test.ts extensions/live2d-companion/renderer-ui-state.test.ts extensions/live2d-companion/renderer/avatar-factory.test.ts src/agents/tools/companion-control-tool.ts src/agents/tools/companion-control-tool.test.ts src/plugin-sdk/live2d-companion.ts src/plugin-sdk/live2d-companion.js docs/.generated/plugin-sdk-api-baseline.sha256`

## Live smoke

The running local Desktop Companion was restarted after the runtime JS update.
IPC returned state successfully:

- `visible: true`
- `ttsProvider: voicevox`
- active asset: `Hakua.fbx` with asset type `fbx`
- latest avatar state included `lastAction: speak`, `lastEmotion: happy`,
  `lastExpression: happy`, `lastMotion: happy`, and a `lastLookAt` vector.

`request-window-capture` returned a 380x480 `image/png` from
`desktop-companion-renderer-canvas` with a PNG base64 payload. The proof artifact
was written to `_docs/2026-05-17_desktop-companion-renderer-window-capture-live.png`.

The running local Desktop Companion was restarted again after adding the
character profile IPC/runtime changes. A live IPC smoke verified:

- `get-profile` returned the existing local character profile.
- `update-profile` accepted display name `Hakua`, mood `happy`, and relationship
  `{ level: 42, label: "familiar" }`.
- `get-state` returned the same profile under `state.profile`, proving the
  renderer-facing runtime state and IPC profile store agree.

After the profile editor UI/preload update, the running companion was restarted
again and a live IPC smoke updated the profile to:

- display name: `Hakua`
- mood: `focused`
- voice profile: `VOICEVOX:8`
- relationship: `{ level: 64, label: "trusted" }`

The same smoke confirmed `get-state.profile` matched the updated profile and
`request-window-capture` returned a 380x480 `image/png` from
`desktop-companion-renderer-canvas`. The proof artifact was written to
`_docs/2026-05-17_desktop-companion-profile-editor-window-capture-live.png`.

Prompt integration proof was covered by `extensions/live2d-companion/index.test.ts`.
The test writes a strict-local profile with display name `Hakua`, mood
`focused`, greeting `Welcome back.`, voice profile `VOICEVOX:8`, relationship
`trusted (64/100)`, and persona notes, then confirms the registered
`before_prompt_build` hook appends those fields to system context.

## Documentation

The public platform docs now distinguish between:

- the current source-level Desktop Companion overlay in the bundled
  `live2d-companion` plugin, usable for local VRM/FBX avatar workflows, local
  character profile state, and `control_companion` visual proof; and
- the still-planned packaged native Windows and Linux companion apps.

Touched docs:

- `docs/platforms/index.md`
- `docs/platforms/windows.md`
- `docs/platforms/linux.md`
- `docs/start/openclaw.md`
