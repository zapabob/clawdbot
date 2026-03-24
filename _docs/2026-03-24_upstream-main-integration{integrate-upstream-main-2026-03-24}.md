# upstream/main integration execution log

- Timestamp: 2026-03-24 23:29:17+09:00
- Base branch: `main`
- Integration branch: `integrate/upstream-main-2026-03-24`
- Upstream target: `upstream/main`

## Work completed

1. Diff inventory and preservation map generation
   - Added `scripts/upstream_diff_inventory.py`
   - Generated:
     - `_docs/upstream-main-diff-inventory.json`
     - `_docs/upstream-main-diff-inventory.md`

2. Upstream merge execution and conflict handling
   - Ran `git merge --no-ff --no-commit upstream/main`
   - Resolved conflicts:
     - `extensions/line/runtime-api.ts`
     - `pnpm-lock.yaml` (via `pnpm install --lockfile-only`)
   - Logged conflict policy:
     - `_docs/2026-03-24_upstream-merge-conflict-log{integrate-upstream-main-2026-03-24}.md`

3. API delta audit (`py -3`)
   - Added `scripts/api_delta_audit.py`
   - Generated:
     - `_docs/upstream-api-delta-audit.json`
     - `_docs/upstream-api-delta-audit.md`

4. Compatibility refactor during integration
   - Updated `extensions/line/runtime-api.ts`:
     - kept upstream pre-export strategy for jiti `_exportNames` behavior
     - removed duplicate symbol export block to clear TS duplicate identifier errors

5. Validation gates run
   - `pnpm build`: passed
   - `pnpm tsgo`: passed
   - `pnpm check`: blocked at lint executable launch
     - `@oxlint-tsgolint/win32-x64/tsgolint.exe` spawn EPERM (Windows execution permission issue)
   - `pnpm test`: executed and reproduced multiple failures; key failures captured below

## Validation blockers observed

### Environment-level blockers

- `pnpm install` repeatedly hit EPERM on:
  - `node_modules/koffi/build/koffi/win32_x64/koffi.node`
- `pnpm lint` / `pnpm check` blocked by EPERM on:
  - `node_modules/@oxlint-tsgolint/win32-x64/tsgolint.exe`

### Test failures reproduced

- `src/memory/qmd-manager.test.ts`
  - symlink creation failed with EPERM on Windows temp directory
- `src/node-host/invoke-system-run.test.ts`
  - assertion mismatch in strictInlineEval allow-always persistence scenario
- `src/cli/update-cli.test.ts`
  - expected portable Git PATH prefix not present in merged behavior
- `src/cli/config-cli.test.ts` targeted run
  - downstream parser saw unexpected option `--strictJson` in this invocation path

## Added integration helper artifacts

- `scripts/upstream_diff_inventory.py`
- `scripts/api_delta_audit.py`
- `src/types/ambient-missing-modules.d.ts`

## Current status

- Upstream merge is applied in the integration branch and explicit merge conflicts are resolved.
- Core build/type gates pass.
- Full `check` and clean test pass are blocked by Windows EPERM execution restrictions and selected runtime/test regressions requiring follow-up.
