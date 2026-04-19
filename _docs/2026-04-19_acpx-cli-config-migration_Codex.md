# ACPX CLI Config Migration Fix

## Overview
- Fixed the desktop CLI startup path so legacy `plugins.entries.acpx.config.codexHarness` no longer makes `.openclaw-desktop/openclaw.json` invalid during config load.
- Wired plugin-owned setup migrations into config read/load before validation and added ACPX-specific legacy coverage.
- Updated source-shadow `.js` files that the local repo runtime still uses so tests and local source repros follow the same logic as the TypeScript sources.

## Background / Requirements
- The local desktop launch path was failing before command startup because ACPX legacy config keys were being validated before plugin-owned migration could strip them.
- The repo is running in a hybrid source/shadow/built layout, so fixes had to work for:
  - source-path config reads used by tests and scripts
  - built CLI validation via `node openclaw.mjs`
  - plugin doctor contract discovery in source checkouts

## Assumptions / Decisions
- Kept the fix generic at the plugin seam instead of adding ACPX-specific core special cases.
- Preserved legacy reporting: `codexHarness` still appears in `legacyIssues`, but no longer blocks validation after migration.
- Added source fallback for plugin doctor contract loading because bundled plugin metadata is often rooted at `dist-runtime/extensions/*` while contract files may only exist in source during local development.

## Changed Files
- `src/config/io.ts`
- `src/config/io.js`
- `src/config/acpx-legacy-config.test.ts`
- `src/plugins/doctor-contract-registry.ts`
- `src/plugins/doctor-contract-registry.js`
- `extensions/acpx/setup-api.ts`
- `extensions/acpx/config-api.ts`
- `extensions/acpx/config-api.test.ts`
- `extensions/acpx/contract-api.ts`
- `extensions/acpx/src/config.test.ts`

## Implementation Details
- Added `applyPluginSetupConfigMigrationsForRead()` to config ingest so plugin-owned setup migrations run before `validateConfigObjectWithPlugins()`.
- Scoped the setup migration workspace lookup to `agents.defaults.workspace` when present.
- Added ACPX migration logic that strips the legacy `codexHarness` key while keeping the rest of the ACPX config intact.
- Exposed ACPX legacy config doctor rules from `contract-api.ts` and added source fallback loading in the plugin doctor contract registry.
- Mirrored the same behavior into the local `src/**/*.js` shadow files because the local test/runtime path still imports those files directly.

## Commands Run
- `node scripts/tsdown-build.mjs`
- `node scripts/runtime-postbuild.mjs`
- `Remove-Item Env:OPENCLAW_CONFIG_PATH -ErrorAction SilentlyContinue; pnpm test -- extensions/acpx/config-api.test.ts extensions/acpx/src/config.test.ts src/config/acpx-legacy-config.test.ts`
- `node openclaw.mjs config validate --json` with `OPENCLAW_CONFIG_PATH=.openclaw-desktop/openclaw.json`
- PTY smoke of `node openclaw.mjs --help` with desktop config

## Test / Verification Results
- `pnpm test -- extensions/acpx/config-api.test.ts extensions/acpx/src/config.test.ts src/config/acpx-legacy-config.test.ts`
  - Passed: `3 files / 8 tests`
- `node scripts/tsdown-build.mjs`
  - Passed
- `node openclaw.mjs config validate --json`
  - Returned `{"valid":true,"path":"...\\.openclaw-desktop\\openclaw.json"}`
- PTY smoke of `node openclaw.mjs --help`
  - No `RangeError` or ACPX invalid-config message was observed in the captured startup output window before timeout/kill
- `node scripts/runtime-postbuild.mjs`
  - Failed in unrelated bundled runtime dependency staging for `amazon-bedrock` (`npm install failed`)

## Residual Risks
- The repo still has pre-existing legacy-config snapshot expectations outside ACPX, for example the existing `voice-call` legacy provider-shape path still validates as invalid in local repros.
- `runtime-postbuild` is not fully green because `amazon-bedrock` bundled runtime dependency staging failed; the ACPX config validation fix was still verified through `dist` CLI validation.
- The original `styleText` stack overflow was not cleanly reproducible after the config blocker was removed, so this change is high-confidence for the ACPX startup blocker but not a proven root-cause fix for every possible terminal rendering crash.

## Recommended Next Actions
- Triage why `runtime-postbuild` is failing for `amazon-bedrock` runtime deps so the full bundled runtime staging path is green again.
- Separately audit the broader legacy-config snapshot expectations for plugin-owned auto-migrations such as `voice-call`.
- If the user still sees a terminal rendering crash after this fix, capture a fresh PTY repro now that ACPX config validation is no longer short-circuiting startup.
