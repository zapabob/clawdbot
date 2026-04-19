# Overview

- Fixed the repeated `skills` warning caused by managed skill mirrors in `.openclaw/skills`.
- Fixed the Telegram `/tts` native command conflict caused by `local-voice` registering the same native name as the built-in TTS command.

# Background / Requirements

- Gateway logs showed `Skipping skill path that resolves outside its configured root.`
- Telegram startup logs showed `Plugin command "/tts" conflicts with an existing Telegram command.`
- The fix needed to be minimal, creator-safe, and compatible with the existing skill-loading and plugin-command architecture.

# Assumptions / Decisions

- `.openclaw/skills` may intentionally mirror `~/.agents/skills` via junctions on Windows.
- Managed skill mirrors should be allowed only for the managed skill source, not for arbitrary workspace/plugin roots.
- `local-voice` should keep its canonical `/tts` command for non-Telegram contexts, but Telegram native surfaces should use a distinct alias.
- The workspace currently contains adjacent generated or stale `.js` files, so the runtime-facing `workspace.js` needed to stay aligned with `workspace.ts`.

# Changed Files

- `src/agents/skills/workspace.ts`
- `src/agents/skills/workspace.js`
- `src/agents/skills/workspace.test.ts`
- `extensions/local-voice/index.ts`
- `extensions/local-voice/index.test.ts`

# Implementation Details

- Added managed-skill extra allowed roots so `openclaw-managed` entries can resolve into the mirrored personal agents skill root without being treated as an escape.
- Derived the allowed mirror roots from both the managed root location and the current home-based `.agents/skills` path so the logic works with custom state-dir layouts and tests.
- Updated `local-voice` so the plugin command keeps `name: "tts"` but advertises `nativeNames.telegram = "voice_tts"`.
- Updated `local-voice` usage text to mention the Telegram-native alias.
- Added a workspace regression test for managed skill junction mirrors.
- Added a `local-voice` regression test that asserts the Telegram alias stays stable.

# Commands Run

- `pnpm test -- src/agents/skills/workspace.test.ts`
- `pnpm test -- src/agents/skills/workspace.test.ts extensions/local-voice/index.test.ts extensions/telegram/src/bot-native-command-menu.test.ts src/plugins/commands.test.ts`
- `node scripts/tsdown-build.mjs`

# Test / Verification Results

- `pnpm test -- src/agents/skills/workspace.test.ts` passed after aligning the runtime-loaded `workspace.js`.
- `pnpm test -- src/agents/skills/workspace.test.ts extensions/local-voice/index.test.ts extensions/telegram/src/bot-native-command-menu.test.ts src/plugins/commands.test.ts` passed: `35 passed`.
- `node scripts/tsdown-build.mjs` passed.

# Residual Risks

- Other stale adjacent `.js` files elsewhere in the workspace may still shadow `.ts` edits if they are not kept aligned.
- This change intentionally allows only the managed mirror path pattern; other escaped skill roots should still warn and be skipped.

# Recommended Next Actions

- Restart the gateway once and confirm the startup log no longer prints the managed-skill escape warning or the Telegram `/tts` conflict.
- If more stale adjacent `.js` files are actively used in this workspace, consider a focused cleanup pass or a guardrail that detects shadowed `.ts` edits earlier.
