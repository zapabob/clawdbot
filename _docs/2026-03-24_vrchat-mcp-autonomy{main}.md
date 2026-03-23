# VRChat MCP Autonomous Control Implementation Log

- Date (local): 2026-03-24
- Worktree: `main`
- MCP-derived timestamp: `2026-03-23T15:53:09Z` (from `user-github.list_issues` latest `updated_at`)

## Scope

Implemented the attached plan for VRChat MCP autonomous control by combining `vrchat-mcp-osc` bootstrap, `vrchat-relay` topology split, avatar parameter registry, and reactive behavior automation.

## Completed Work

1. Topology and collision-avoidance policy
   - Added topology config (`relay-primary` / `mcp-primary`) to `vrchat-relay`.
   - Added relay autostart controls:
     - `topology.autoStartOscListener`
     - `topology.autoStartGuardianPulse`
   - Updated runtime behavior to skip relay-side autostarts when `mcp-primary` is active.

2. MCP relay bootstrap and verification
   - Cloned `vrchat-mcp-osc` into repo workspace.
   - Installed dependencies and built packages.
   - Verified start-up of relay and MCP server paths, confirmed WebSocket/OSC startup logs.
   - Captured known issue: `pnpm -r dev` has ESM path mismatch in upstream repo on Windows (`relay-server.js` resolution).

3. Avatar expression parameter registry
   - Added registry template in extension docs.
   - Added project-level registry document for Hakua expression and locomotion mapping.

4. Autonomous rules with safety guards
   - Added reactive module for conversation-driven control.
   - Implemented emotion keyword mapping:
     - joy -> `FX_Smile`
     - love -> `FX_Love`
     - angry -> `FX_Angry`
     - sad -> `FX_Sad`
     - surprised -> `FX_Surprised`
   - Implemented follow-intent detection and movement trigger.
   - Added cooldown guards:
     - emotion cooldown: 1800ms
     - movement cooldown: 4500ms
   - Added tool: `vrchat_autonomy_react` (`PRO` guard).

5. Validation and hardening
   - Added unit tests for reactive manifest behavior.
   - Ran targeted tests successfully.
   - Build caveat on Windows host: root `pnpm build` fails due bash dependency (`scripts/bundle-a2ui.sh`) not available in this shell.

## Files Added/Updated

- Updated
  - `.openclaw-desktop/openclaw.json`
  - `extensions/vrchat-relay/index.ts`
  - `extensions/vrchat-relay/openclaw.plugin.json`
  - `extensions/vrchat-relay/README.md`
- Added
  - `extensions/vrchat-relay/src/autonomy/reactive-manifest.ts`
  - `extensions/vrchat-relay/src/test/reactive-manifest.test.ts`
  - `extensions/vrchat-relay/docs/avatar-parameter-registry.template.md`
  - `_docs/vrchat_avatar_parameter_registry.md`

## Validation Commands

- `pnpm test -- extensions/vrchat-relay/src/test/reactive-manifest.test.ts` -> pass
- `pnpm build` (repo root) -> fail in this environment (`bash` not available on Windows shell)
- `pnpm -r start` in `vrchat-mcp-osc` -> relay startup confirmed
