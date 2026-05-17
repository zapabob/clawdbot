# Plugin Terminology Alignment

Date: 2026-05-18
Owner: Codex
Repo: openclaw/openclaw fork checkout

## Goal

Align user-visible wording with the official OpenClaw policy that product,
docs, UI, and changelog surfaces say "plugin/plugins", while `extensions/`
remains the internal package tree and `openclaw.extensions` remains the
compatible manifest field.

## Scope

- Updated CLI, config help, UI metadata, security audit findings, payload smoke
  checks, doctor repair diagnostics, docs, and test labels that exposed
  "extension" terminology for plugin surfaces.
- Kept compatibility identifiers and internal structure where they are part of
  existing contracts, including `extensions/`, `openclaw.extensions`, and
  selected historical contract file names.
- Left unrelated pre-existing dirty files untouched, including heartbeat,
  auth-profile, doctor-auth, PI helper, auto-reply, and local state changes.

## Notable Code Changes

- `src/plugins/package-entry-resolution.ts` now reports plugin entry labels for
  package entry validation errors.
- `src/cli/update-cli/plugin-payload-validation.ts` now uses
  `missing-plugin-entry` for payload smoke-check failures and plugin entry
  wording in diagnostics.
- `src/security/audit-extra.async.ts` and
  `src/security/audit-plugins-trust.ts` now describe plugin entrypoints, plugin
  roots, and plugin allowlist/tool policy issues.
- `src/config/schema.help.ts` and UI section metadata now describe plugin
  management without extension wording.

## Docs Updated

Docs were adjusted across plugin architecture, CLI channels/pairing, testing,
CI, release validation, security audit checks, PI hooks, model providers,
session compaction, and tool overview pages so user-facing copy consistently
uses plugin terminology.

## Verification

Passed:

- `rg -n -i "...extension terminology patterns..." docs src ui`
- `pnpm docs:list`
- `git diff --check`
- `pnpm exec oxfmt --check --threads=1 ...focused changed TS files...`
- `node scripts/run-vitest.mjs --config test/vitest/vitest.runtime-config.config.ts run src/config/schema.help.quality.test.ts`
- `node scripts/run-vitest.mjs --config test/vitest/vitest.cli.config.ts run src/cli/update-cli/plugin-payload-validation.test.ts --testNamePattern "TypeScript plugin entry|openclaw.extensions"`
- `node scripts/run-vitest.mjs --config test/vitest/vitest.cli.config.ts run src/cli/update-cli.test.ts --testNamePattern "post-core resume mode uses the parent install records snapshot for missing payload warnings|detects missing plugin payloads"`
- `node scripts/run-vitest.mjs --config test/vitest/vitest.unit-fast.config.ts run src/security/audit-extra.async.test.ts src/security/audit-plugins-trust.test.ts --testNamePattern "plugin entry|plugin tool reachability|installed plugin roots"`
- `node scripts/run-vitest.mjs --config test/vitest/vitest.plugins.config.ts run src/plugins/install.test.ts src/plugins/discovery.test.ts src/plugins/copy-bundled-plugin-metadata.test.ts src/plugins/loader.git-path-regression.test.ts src/plugins/uninstall.test.ts --testNamePattern "plugin entry|runtime plugin entry|runtime plugin entries|inferred runtime plugin entry|openclaw.extensions|runtimeExtensions"`
- `node scripts/run-vitest.mjs --config test/vitest/vitest.commands.config.ts run src/commands/doctor/shared/missing-configured-plugin-install.test.ts --testNamePattern "plugin entry"`
- `node ..\scripts\run-vitest.mjs --config vitest.config.ts run src/ui/views/config-form.render.node.test.ts --project unit-node`

Blocked or unrelated failures observed:

- Full root `node scripts/run-vitest.mjs ...` without a scoped config stalled
  because the multi-project root config was too broad for this focused run.
- Full `src/plugins/install.test.ts` has unrelated Windows path separator
  expectation failures in package scan assertions.
- Full `plugin-payload-validation.test.ts` has an unrelated Windows symlink
  permission failure: `EPERM` on `fs.symlink`.
- `pnpm exec playwright install chromium` failed with
  `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, so browser tests requiring Playwright
  Chromium could not run.
- `pnpm format:docs:check` hit an existing script bug:
  `TypeError: Cannot read properties of undefined (reading 'trim')`.
- Full `pnpm format:check` is blocked by an unrelated syntax issue in
  `test/official-channel-catalog.test.ts`.
- Plugin contract guardrails are currently red on unrelated allowlist and SDK
  classification drift involving local plugin packages such as
  `live2d-companion`, `vrchat-relay`, `local-voice`, and `ollama`.

## Follow-up Notes

- If this branch is prepared for landing, rerun broader gates after the local
  Playwright browser cache and existing contract/catalog drift are repaired.
- Keep future docs and UI copy on "plugin/plugins" unless referring to the
  literal internal `extensions/` path or the compatible `openclaw.extensions`
  manifest field.
