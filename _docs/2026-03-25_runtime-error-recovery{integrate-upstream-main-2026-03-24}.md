# Runtime Error Recovery Log (LINE/Ollama/Anthropic)

- Timestamp: 2026-03-25 00:17:22+09:00
- Branch: `integrate/upstream-main-2026-03-24`
- Scope: LINE env warnings, Ollama discover failure, Anthropic auth profile missing

## Changes

1. Restored `.openclaw-desktop/openclaw.json` skeleton
   - Reintroduced `wizard`, `browser`, `agents.defaults`, `messages`, `channels`, `mcp`, `plugins`.
   - Restored `models.providers.ollama` with local base URL `http://127.0.0.1:11434`.
   - Kept `models.providers.openai` env-key style.

2. Fixed LINE warning-causing config
   - `channels.line.webhookPath` set to `/line/webhook` (no env indirection).
   - `channels.line.dmPolicy` set to `open`.
   - Removed unresolved refs to `LINE_WEBHOOK_PATH`, `LINE_WEBHOOK_URL`, `LINE_DM_POLICY`.

3. Added Anthropic auth profile for main agent
   - Updated `.openclaw-desktop/agents/main/agent/auth-profiles.json`.
   - Added profile `anthropic:default` with `keyRef` to env var `ANTHROPIC_API_KEY`.
   - Set `lastGood.anthropic` to `anthropic:default`.

4. Added Python audit automation (`py -3`)
   - New script: `scripts/runtime_config_audit.py`
   - Output:
     - `_docs/runtime-config-audit.json`
     - `_docs/runtime-config-audit.md`

## Validation

- JSON parse validation passed for:
  - `.openclaw-desktop/openclaw.json`
  - `.openclaw-desktop/agents/main/agent/auth-profiles.json`
- LINE unresolved env refs (`LINE_WEBHOOK_PATH`, `LINE_WEBHOOK_URL`, `LINE_DM_POLICY`) not found.
- Ollama probe:
  - `http://127.0.0.1:11434/api/tags` returned HTTP `200`.

## Remaining Action Required

- `ANTHROPIC_API_KEY` is currently missing in environment.
- Anthropic provider requests will still fail until the env var is set.
