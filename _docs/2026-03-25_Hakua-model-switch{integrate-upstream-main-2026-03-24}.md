# Hakua model switch implementation log

- Timestamp: 2026-03-25 00:20:39+09:00
- Branch: `integrate/upstream-main-2026-03-24`
- Requested change:
  - core: `ollama/qwen-Hakua-core`
  - sub: `ollama/qwen-Hakua-core-lite`

## Changes applied

1. Updated agent primary model:
   - `.openclaw-desktop/openclaw.json` `agents.defaults.model.primary`
2. Updated default fallback order to start from core model:
   - `.openclaw-desktop/openclaw.json` `agents.defaults.model.fallbacks[0]`
3. Updated subagent default model:
   - `.openclaw-desktop/openclaw.json` `agents.defaults.subagents.model`

## Notes

- Existing fallback entries were preserved after the requested primary model switch.
- No other runtime/channel/plugin settings were modified.
