# Overview

Fixed the TypeScript errors reported for the OpenClaw core and bundled plugin typecheck lanes.

# Background / Requirements

The reported failures were `TS6133`, `TS6192`, `TS6196`, `TS2440`, `TS2739`, `TS2769`, `TS2307`, `TS2322`, `TS1470`, `TS2345`, `TS7031`, `TS2551`, and related strict-mode errors across `extensions/**` and `src/**`.

# Assumptions / Decisions

- Keep the change focused on type correctness and current local contracts.
- Preserve existing unrelated dirty files: `CHANGELOG.md`, `extensions/codex/src/app-server/auth-bridge.ts`, `extensions/codex/src/app-server/auth-bridge.test.ts`, and `src/tui/embedded-backend.test.ts`.
- Avoid broad runtime behavior changes while cleaning unused declarations.

# Changed Files

- `extensions/auto-agent/index.ts`
- `extensions/bluebubbles/src/accounts.ts`
- `extensions/bluebubbles/src/client.ts`
- `extensions/deepseek/index.ts`
- `extensions/hypura-harness/index.ts`
- `extensions/line/src/push-command.ts`
- `extensions/live2d-companion/bridge/flag-watcher.ts`
- `extensions/live2d-companion/renderer/fbx-controller.ts`
- `extensions/live2d-companion/renderer/lip-sync.ts`
- `extensions/live2d-companion/renderer/vrm-controller.ts`
- `extensions/llama-cpp/models.ts`
- `extensions/local-voice/src/audio-input.ts`
- `extensions/local-voice/voicevox-speech-provider.ts`
- `extensions/matrix/src/exec-approvals-handler.ts`
- `extensions/memory-core/src/memory/provider-adapters.ts`
- `extensions/python-exec/index.ts`
- `extensions/telegram/src/webhook.ts`
- `extensions/vrchat-relay/index.ts`
- `extensions/vrchat-relay/src/tools/audit.ts`
- `extensions/vrchat-relay/src/tools/rate-limiter.ts`
- `src/agents/model-auth.ts`
- `src/commands/doctor-state-integrity.ts`
- `src/hooks/bundled/sovereign-pulse/handler.ts`
- `src/utils/perf.ts`
- `src/utils/stream-optimizer.ts`

# Implementation Details

- Removed or corrected unused imports, fields, and locals.
- Reused the local LINE runtime modules instead of the removed `openclaw/plugin-sdk/line-runtime` facade.
- Aligned `hypura-harness` schema construction to the repo's `typebox` helper family.
- Updated Matrix approval delivery to read message ids and the reaction anchor from the current `MessageReceipt` API.
- Corrected stale dependency specifiers and import names for Python exec and Telegram webhook certificate handling.
- Kept local-voice compatible with CommonJS package output by avoiding `import.meta` in that package.

# Commands Run

- `node scripts/run-tsgo.mjs -p tsconfig.extensions.json --incremental false` - passed
- `node scripts/run-tsgo.mjs -p tsconfig.core.json --incremental false` - passed
- `.\node_modules\.bin\oxfmt.cmd --check --threads=1 <touched files>` - initially found one formatting issue
- `.\node_modules\.bin\oxfmt.cmd --threads=1 extensions/local-voice/voicevox-speech-provider.ts` - formatted
- `.\node_modules\.bin\oxfmt.cmd --check --threads=1 <touched files>` - passed
- `node scripts/run-tsgo.mjs -p tsconfig.core.json --incremental false` - passed after final core cleanup
- `git diff --check` - passed

# Test / Verification Results

Both strict TypeScript lanes are green after the cleanup:

- `tsconfig.extensions.json`
- `tsconfig.core.json`

# Residual Risks

- This was a typecheck cleanup. No channel live tests, plugin runtime E2E tests, or full `pnpm check` run was performed.
- Existing unrelated dirty files were intentionally left untouched.

# Recommended Next Actions

- If this is headed to a PR, run the repository changed-check gate or the corresponding Testbox check for the combined diff before push.
