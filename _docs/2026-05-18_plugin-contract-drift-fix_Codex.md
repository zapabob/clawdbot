# 2026-05-18 Plugin Contract Drift Fix

## Scope

- Fixed the `test/official-channel-catalog.test.ts` parse blocker and refreshed pinned catalog expectations.
- Brought the plugin contract suite back to green by aligning current plugin surfaces with the active contract classifications.
- Left unrelated pre-existing workspace changes untouched.

## Changes

- Removed the forbidden core `plugin-sdk/ollama` facade from SDK exports, entrypoint metadata, and docs.
- Classified current `runtime-api.ts` barrels for BlueBubbles, Desktop Companion, and Local Voice.
- Declared current production tool owners in affected plugin manifests.
- Declared plugin-local runtime dependencies for Auto Agent, Hypura Harness, Desktop Companion, and VRChat Relay.
- Moved Hypura Provider and llama.cpp provider from the deprecated `discovery` hook to `catalog`.
- Added transitional config API compatibility filtering for existing legacy files tracked by the deprecated config API guard.
- Hardened session attachment delivery when the mocked sender returns no result, and made symlink/chmod-sensitive contract cases pass on Windows.
- Updated channel catalog expectations for WeCom, Yuanbao, and WhatsApp ClawHub metadata.

## Verification

- `node scripts/run-vitest.mjs --config test/vitest/vitest.tooling.config.ts run test/official-channel-catalog.test.ts --reporter=verbose`
- `node scripts/run-vitest.mjs --config test/vitest/vitest.contracts-plugin.config.ts run --reporter=verbose`
- `node scripts/run-vitest.mjs --config test/vitest/vitest.extensions.config.ts run extensions/llama-cpp/index.test.ts --reporter=verbose`
- `.\node_modules\.bin\oxfmt.CMD --check --threads=1 ...`
- `git diff --check`
- JSON parse sanity over touched plugin manifests and package manifests.

## Notes

- The contract suite reports one skipped test on Windows for unreadable MIME probe behavior because Windows does not reliably enforce POSIX-style `chmod(0)` unreadability.
- The first `pnpm exec oxfmt` invocation triggered pnpm's workspace dependency reconciliation before the local formatter binary was used directly.
