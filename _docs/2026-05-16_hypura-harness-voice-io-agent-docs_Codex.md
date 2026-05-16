# Hypura Harness voice I/O agent docs

## Overview

Added OpenClaw-facing tool wrappers and agent-readable Markdown guidance for
the existing Hypura Harness voice input/output endpoints.

## Background / requirements

- Put voice output and voice input into the OpenClaw harness surface.
- Place Markdown guidance in the harness extension format so AI agents can use
  the feature without guessing raw HTTP routes.
- Preserve existing local changes in the dirty worktree.
- Follow the project `AGENTS.md`, scoped extension/docs rules, SOP baseline,
  and MILSPEC-style traceability discipline.

## Assumptions / decisions

- The existing Python endpoints under `extensions/hypura-harness/scripts` are
  the canonical daemon surface for local mic, WAV transcription, VOICEVOX
  playback, and Desktop Companion transcript turns.
- The bundled extension format is `extensions/hypura-harness/index.ts` for
  OpenClaw tool registration plus `extensions/hypura-harness/skills/*/SKILL.md`
  for agent-operable Markdown instructions.
- Microphone capture remains explicit: the agent-facing skill tells agents to
  inspect devices first and not start live mic recording unless the user or
  operator requested it.

## Changed files

- `extensions/hypura-harness/index.ts`
- `extensions/hypura-harness/index.test.ts`
- `extensions/hypura-harness/README.md`
- `extensions/hypura-harness/openclaw.plugin.json`
- `extensions/hypura-harness/package.json`
- `extensions/hypura-harness/skills/voice-io/SKILL.md`
- `_docs/2026-05-16_hypura-harness-voice-io-agent-docs_Codex.md`

## Implementation details

- Registered six OpenClaw tools for the existing voice endpoints:
  `hypura_harness_voice_devices`, `hypura_harness_voice_test_say`,
  `hypura_harness_voice_transcribe`, `hypura_harness_voice_turn`,
  `hypura_harness_companion_mic`, and
  `hypura_harness_companion_voice_turn`.
- Added parameter filtering helpers for optional string, finite number,
  finite-number-array, and boolean request fields before proxying to the daemon.
- Extended the Hypura before-prompt context so agents see the preferred voice
  workflow and tool names.
- Added the `hypura-voice-io` skill under the extension `skills/` tree with
  quickstart, tool map, Companion transcript flow, and troubleshooting notes.
- Updated extension README and plugin metadata to advertise local voice I/O.

## Commands run

- `pnpm exec oxfmt --write --threads=1 extensions/hypura-harness/index.ts extensions/hypura-harness/index.test.ts`
- `git diff --check -- extensions/hypura-harness/index.ts extensions/hypura-harness/index.test.ts extensions/hypura-harness/README.md extensions/hypura-harness/openclaw.plugin.json extensions/hypura-harness/package.json extensions/hypura-harness/skills/voice-io/SKILL.md`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extensions.config.ts --maxWorkers=1`
- `uv run pytest tests/test_harness_daemon.py -q`
- `uv run pytest tests/test_harness_daemon.py -q -p no:randomly`

## Test / verification results

- Format: `oxfmt` completed successfully on the touched TypeScript files.
- Whitespace: `git diff --check` completed successfully for the touched tracked
  files.
- TypeScript plugin test: passed with 1 file and 5 tests via
  `OPENCLAW_VITEST_INCLUDE_FILE` targeting
  `extensions/hypura-harness/index.test.ts`.
- Python daemon endpoint test: the first pytest run failed before test bodies
  because host `pytest-randomly` reseeded numpy with an invalid seed. Re-running
  the same file with `-p no:randomly` passed: 17 tests passed.

## Residual risks

- No live microphone, whisper.cpp, VOICEVOX, VB-Cable, or Desktop Companion
  hardware smoke was run in this pass. The change verifies tool registration
  and daemon endpoint tests, not physical audio devices.
- The surrounding worktree already contains unrelated local modifications and
  untracked voice files. This pass did not attempt to classify, revert, or
  commit those unrelated changes.

## Recommended next actions

- Run a live operator smoke with `hypura_harness_voice_devices`, then
  `hypura_harness_voice_test_say`, then one short `hypura_harness_voice_turn`
  after the harness, VOICEVOX, and audio devices are intentionally active.
- If Python pytest keeps loading host-level `pytest-randomly`, add a local
  pytest config decision rather than relying on ad hoc command flags.
