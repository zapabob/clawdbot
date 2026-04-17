# Overview

Fixed a stale import in `src/commands/channel-test-registry.ts` that was pulling
`listBundledChannelPluginIds` from `src/channels/plugins/bundled.ts` after the
bundled channel ID helper moved to `src/channels/plugins/bundled-ids.ts`.

# Background / requirements

- The TypeScript build reported a missing export warning for
  `listBundledChannelPluginIds`.
- The channel/plugin boundary already treats `bundled-ids.ts` as the canonical
  helper seam for bundled channel IDs.
- The fix needed to be minimal, avoid new special cases, and leave a regression
  guard behind.

# Assumptions / decisions

- Treated this as import drift after an earlier seam split rather than a reason
  to re-export the helper from `bundled.ts`.
- Added a shape-guard regression because the failure was specifically about the
  file crossing the wrong seam.
- Kept runtime-related imports in `channel-test-registry.ts` unchanged.

# Changed files

- `src/commands/channel-test-registry.ts`
- `src/channels/plugins/bundled.shape-guard.test.ts`
- `_docs/2026-04-15_channel-test-registry-import-fix{clawdbot-main}.md`

# Implementation details

- Switched `channel-test-registry.ts` to import
  `listBundledChannelPluginIds` from `../channels/plugins/bundled-ids.js`.
- Added a shape-guard test that asserts the command file stays on the bundled
  channel ID helper seam and does not re-import that helper from `bundled.js`.

# Commands run

```powershell
pnpm test -- src/channels/plugins/bundled.shape-guard.test.ts -t "keeps the channel test registry on the bundled channel id helper seam"
pnpm build
node scripts/tsdown-build.mjs
git diff -- src/commands/channel-test-registry.ts src/channels/plugins/bundled.shape-guard.test.ts
```

# Test / verification results

- `pnpm test -- src/channels/plugins/bundled.shape-guard.test.ts -t "keeps the channel test registry on the bundled channel id helper seam"`
  - Failed first before the code fix, then passed after the import change.
- `node scripts/tsdown-build.mjs`
  - Passed.
- `pnpm build`
  - Failed before the TypeScript stage on an existing workspace precondition:
    missing `src/canvas-host/a2ui/a2ui.bundle.js`.

# Residual risks

- Full repo build remains blocked until the A2UI bundle precondition is
  restored, so I could not fully re-validate the complete `pnpm build` chain in
  this workspace.
- The added regression is a shape guard; it protects the seam choice directly
  but does not exercise the full runtime path.

# Recommended next actions

- Restore or regenerate `src/canvas-host/a2ui/a2ui.bundle.js` if a full
  `pnpm build` gate is needed in this workspace.
- If this seam is likely to drift again, consider adding a broader SDK/testing
  surface contract check around `src/plugin-sdk/testing.ts`.
