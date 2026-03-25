# 2026-03-25 Hypura harness OpenClaw integration (clawdbot-main)

## Summary

- **Port**: Hypura FastAPI default moved from **18790** to **18794** so it does not collide with OpenClaw **Bridge** (reserved 18790 per `src/browser/profiles.ts`).
- **Extension**: New workspace plugin `extensions/hypura-harness` (`@openclaw/hypura-harness`) exposes `hypura_harness_*` tools that proxy to the harness HTTP API (`fetch`), plus `before_prompt_build` guidance.
- **code_runner**: `harness.config.json` → `openclaw.use_gateway_agent` (default **true**) runs `openclaw agent -m "<prompt>"` before `openclaw run`; optional `agent_extra_args`. Removed unused `agent_endpoint`.
- **Metadata**: Regenerated `src/plugins/bundled-plugin-metadata.generated.ts` via `node scripts/generate-bundled-plugin-metadata.mjs`.
- **Labeler**: `.github/labeler.yml` entry `extensions: hypura-harness`.

## Operator notes

- Align `plugins.entries["hypura-harness"].config.baseUrl` with `scripts/hypura/harness.config.json` `daemon_port` (default `http://127.0.0.1:18794`).
- Gateway must be reachable for `use_gateway_agent`; otherwise fallbacks (`openclaw run`, then `claude` / `codex`) apply.
- **SOUL.md**: Added a **Hypura Python harness** section to [SOUL.md](SOUL.md) and [docs/reference/templates/SOUL.md](docs/reference/templates/SOUL.md) so embedded `SOUL.md` in the system prompt steers the agent to use `hypura_harness_*` tools autonomously (status first, config alignment, gateway note). [skills/hypura-harness/SKILL.md](skills/hypura-harness/SKILL.md) cross-references this.
- **Desktop shortcut autostart hardening**: `scripts/launchers/launch-desktop-stack.ps1` now checks `harness.config.json` for `daemon_port`, probes `GET /status`, avoids duplicate spawn if already alive, and waits for readiness after spawn (`-HypuraHarnessWaitSeconds`, default 45). `scripts/installers/create-desktop-shortcut.ps1` passes this wait option in generated `.lnk` arguments.

## Verification

- `uv run pytest tests/test_code_runner.py` (scripts/hypura): passed.
- `uv run pytest tests/` (scripts/hypura): 43 passed.
- `pnpm exec vitest run extensions/hypura-harness/index.test.ts`: passed.
- `node scripts/generate-bundled-plugin-metadata.mjs --check`: passed.
