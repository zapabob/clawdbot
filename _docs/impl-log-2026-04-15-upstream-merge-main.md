# 2026-04-15 Upstream Merge Dry-Run Completion Log

## Summary

- Goal: finish the upstream merge follow-up so the merge tooling reaches `dry-run-ok` while preserving fork-specific behavior.
- Working branch during implementation: `integrate/upstream-main-2026-04-09-latest-604777e`
- Final upstream `main` verified in this session: `6f1d321aababd96e7b67e4b8dc7fdd5d9c1a554b`
- Final dry-run report: `_docs/merge-reports/upstream-merge-20260415T023238Z.json`
- Final result: `blocked_paths = 0`, `result = dry-run-ok`

## What Was Changed

### Merge tooling classification updates

Updated `scripts/tools/merge-conflict-strategies.custom-first.json` so the remaining overlap-only files move from pending follow-up buckets into explicit `preserve_custom` where the current fork implementation is already the reviewed, test-backed end state.

The final pass covered these groups:

- channel/plugin loader surfaces
  - `src/channels/plugins/bootstrap-registry.ts`
  - `src/channels/plugins/bundled.ts`
- LINE / memory-core extension entrypoints
  - `extensions/line/src/card-command.ts`
  - `extensions/memory-core/index.ts`
- agent/runtime surfaces
  - `src/agents/model-fallback.ts`
  - `src/agents/openclaw-tools.ts`
  - `src/agents/pi-project-settings.ts`
  - `src/agents/pi-settings.ts`
  - `src/agents/system-prompt.ts`
  - `src/agents/tools/chat-history-text.ts`
  - `src/agents/pi-embedded-runner/compact.ts`
  - `src/agents/pi-embedded-runner/run/attempt.ts`
- regression tests tied to the current fork contract
  - `src/agents/system-prompt.test.ts`
  - `src/agents/pi-embedded-runner/compact.hooks.test.ts`
  - multiple channel/plugin and Matrix test files
- Matrix runtime/plugin-owned migration and approval surfaces
  - `extensions/matrix/runtime-heavy-api.ts`
  - `extensions/matrix/src/approval-native.ts`
  - `extensions/matrix/src/exec-approval-resolver.ts`
  - `extensions/matrix/src/exec-approvals-handler.ts`
  - `extensions/matrix/src/legacy-crypto-inspector-availability.ts`
  - `extensions/matrix/src/legacy-crypto.ts`
  - `extensions/matrix/src/matrix-migration.runtime.ts`
  - `extensions/matrix/src/matrix/client/config.ts`
  - `extensions/matrix/src/matrix/client/migration-snapshot.runtime.ts`
  - `extensions/matrix/src/matrix/monitor/allowlist.ts`
  - `extensions/matrix/src/matrix/monitor/handler.ts`
  - `extensions/matrix/src/matrix/monitor/reaction-events.ts`
  - `extensions/matrix/src/migration-snapshot-backup.ts`
  - `extensions/matrix/src/migration-snapshot.ts`
  - `extensions/matrix/src/runtime-heavy-api.ts`
- WhatsApp monitor runtime
  - `extensions/whatsapp/src/auto-reply/monitor.ts`
- latest-upstream hook drift
  - `.pre-commit-config.yaml`

### Tooling test coverage updates

Updated `scripts/tools/tests/test_upstream_merge_tooling.py` so the strategy expectations assert the new exact classifications above, including the final latest-upstream `.pre-commit-config.yaml` case.

### Latest pin alignment

Updated `scripts/tools/upstream_merge_policy.py` and the strategy payload so the default pinned upstream SHA now matches the verified latest upstream `main` commit:

- `6f1d321aababd96e7b67e4b8dc7fdd5d9c1a554b`

### Regression expectation refresh

Adjusted stale test expectations to match the current, already-implemented behavior:

- `src/agents/system-prompt.test.ts`
  - updated the SOUL guidance expectation to the new identity-directory wording
- `src/agents/pi-embedded-runner/compact.hooks.test.ts`
  - updated expectations for normalized workspace paths and current `applyExtraParamsToAgent(...)` arguments

## Verification Run

### Merge tooling

- `py -3 -m unittest scripts.tools.tests.test_upstream_merge_tooling`

### Channel / extension verification

- `pnpm test -- src/channels/plugins/bundled.shape-guard.test.ts src/channels/plugins/bundled-dist-runtime-path.test.ts src/channels/plugins/bundled-native-import.test.ts src/channels/plugins/contracts/plugin.registry-backed.contract.test.ts src/channels/plugins/contracts/plugins-core.loader.contract.test.ts extensions/line/src/message-cards.test.ts extensions/line/src/send.test.ts extensions/memory-core/index.test.ts`

### Agent/runtime verification

- `pnpm test -- src/agents/pi-project-settings.test.ts src/agents/pi-settings.test.ts src/agents/tools/sessions.test.ts src/agents/model-fallback.test.ts src/agents/model-fallback.probe.test.ts`
- `pnpm test -- src/agents/openclaw-tools.agents.test.ts src/agents/openclaw-tools.session-status.test.ts src/agents/openclaw-tools.sessions.test.ts src/agents/openclaw-tools.plugin-context.test.ts src/agents/openclaw-tools.update-plan.test.ts src/agents/system-prompt.test.ts src/agents/system-prompt-stability.test.ts src/agents/system-prompt-cache-boundary.test.ts src/agents/system-prompt-params.test.ts src/agents/pi-embedded-runner/compact.hooks.test.ts src/agents/pi-embedded-runner/compaction-runtime-context.test.ts src/agents/pi-embedded-runner/context-engine-maintenance.test.ts src/agents/pi-embedded-runner/run/attempt.test.ts`

### Matrix verification

- `pnpm test -- extensions/matrix/src/approval-native.test.ts extensions/matrix/src/exec-approval-resolver.test.ts extensions/matrix/src/exec-approvals-handler.test.ts extensions/matrix/src/legacy-crypto.test.ts extensions/matrix/src/matrix/client.test.ts extensions/matrix/src/matrix/monitor/allowlist.test.ts extensions/matrix/src/matrix/monitor/handler.test.ts extensions/matrix/src/matrix/monitor/reaction-events.test.ts extensions/matrix/src/migration-snapshot.test.ts`

### WhatsApp verification

- `pnpm test -- extensions/whatsapp/src/auto-reply/monitor/inbound-dispatch.test.ts extensions/whatsapp/src/auto-reply/web-auto-reply-monitor.test.ts`

### Dry-run completion checks

Pinned 2026-04-14 upstream verification:

- `py -3 scripts/tools/upstream_merge.py --target integrate/upstream-main-2026-04-09-latest-604777e --upstream-ref upstream/main --pinned-upstream-sha 54cf4cd8575b75f654121aee6ea43883e60b1d18 --skip-fetch --dry-run`

Latest upstream `main` verification after fetch:

- `git fetch upstream main`
- `py -3 scripts/tools/upstream_merge.py --target integrate/upstream-main-2026-04-09-latest-604777e --upstream-ref upstream/main --pinned-upstream-sha 6f1d321aababd96e7b67e4b8dc7fdd5d9c1a554b --skip-fetch --dry-run`

Outcome:

- report: `_docs/merge-reports/upstream-merge-20260415T023238Z.json`
- `resolved_upstream_sha = 6f1d321aababd96e7b67e4b8dc7fdd5d9c1a554b`
- `result = dry-run-ok`
- `blocked_paths = []`

## Notes

- This log records only the final reviewed/touched surfaces from this completion pass.
- The worktree also contained unrelated user/other-agent edits; those were left intact.
