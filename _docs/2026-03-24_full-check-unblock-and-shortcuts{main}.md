# Full Check Unblock and Shortcut Update Log

## Scope (2026-03-23 to 2026-03-24)

- Recovered CLI startup failure caused by missing runtime dependency resolution for `@anthropic-ai/vertex-sdk`.
- Implemented permanent runtime dependency preflight checks and integrated them into quality gates.
- Unblocked `pnpm check` by aligning extension code with current plugin SDK typing and tool contracts.
- Improved desktop shortcut behavior for day-to-day launch usage.

## Dependency Recovery and Hardening

- Re-synced dependencies with `pnpm install` and confirmed CLI boot path.
- Added `scripts/check-runtime-required-deps.mjs` for explicit runtime-required package presence checks.
- Wired runtime-required dependency validation into:
  - `scripts/run-node.mjs` (pre-run early exit with actionable message)
  - `package.json` `check` pipeline (`check:runtime-required-deps`)
- Regenerated `src/plugins/bundled-plugin-metadata.generated.ts` to satisfy generated artifact consistency checks.

## Type/API Compatibility Work

- Addressed TypeScript/API compatibility blockers across custom extension surfaces and tests:
  - Added missing `details` payload handling for tool results where required.
  - Updated plugin/tool registration compatibility points for current SDK contract behavior.
  - Resolved strict typing breakages in ACPX fixture config usage.
  - Fixed gateway VRChat error code usage (`UNAVAILABLE`) and nullable error message handling.
  - Fixed async stream typing mismatch in `src/agents/ollama-stream.test.ts`.
- Fixed lint boundary violations for extension imports by removing direct `src/**` dependency paths in extension production files.

## Desktop Shortcut Improvements

- Continued launcher migration to `scripts/launchers/launch-desktop-stack.ps1`.
- Updated `scripts/installers/create-desktop-shortcut.ps1`:
  - Corrected launcher reference description from legacy `clawdbot-master.ps1`.
  - Updated companion shortcut behavior to skip Hypura auto-start prompt by default:
    - Added `-SkipHypura` to `Hakua Companion.lnk` argument template.

## Operational Notes

- `pnpm check` was repeatedly executed to identify and eliminate blockers in sequence (format, type, lint, generated artifact checks).
- Non-essential local/runtime artifacts were intentionally excluded from commit scope (session/debug/history noise).

## Commit Intent

- Keep commit content focused on:
  - runtime dependency recovery/hardening,
  - SDK compatibility unblock changes,
  - VRChat relay/gateway compatibility updates,
  - shortcut launch UX improvements,
  - required generated metadata and lockfile updates.
