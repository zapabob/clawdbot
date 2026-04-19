# Telegram Reply Recovery

## Overview
- Recovered Telegram AI replies for the `desktop-stack` profile by repairing the desktop agent auth/state and updating the desktop profile model fallback chain.
- Re-authenticated the repo-local `openai-codex` desktop credential after confirming the previous refresh token had been rotated elsewhere and was no longer usable.

## Background / Requirements
- Telegram inbound delivery was working, but replies failed before the assistant response could be sent.
- The active desktop profile used `ollama/qwen-hakua-core2-ctx128k` with a 60 second timeout and `opencode/*` fallbacks.
- The repo-local desktop agent auth store was empty, so `opencode/*` fallback attempts always failed on auth.

## Assumptions / Decisions
- Recovery priority was restoring Telegram replies for the user's existing desktop stack without changing core code paths.
- The repo-local desktop agent auth store was empty, so syncing the existing legacy desktop auth store was acceptable as a local state repair.
- The fix remained local to `.openclaw-desktop` state and was not prepared for commit.

## Changed Files
- `C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\.openclaw-desktop\openclaw.json`
- `C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\.openclaw-desktop\agents\main\agent\auth-profiles.json`

## Implementation Details
- Copied the existing legacy desktop agent auth store into the repo-local desktop agent directory because the destination store contained no profiles.
- Updated `.openclaw-desktop/openclaw.json`:
- Switched `agents.defaults.model.primary` from `ollama/qwen-hakua-core2-ctx128k` to `openai-codex/gpt-5.4-mini`
- Replaced broken `opencode/*` fallbacks with:
- `openai-codex/gpt-5.4`
- `ollama/qwen-hakua-core2-ctx128k`
- Increased `agents.defaults.timeoutSeconds` from `60` to `120`
- Confirmed the stale desktop `openai-codex` refresh token now failed with `refresh_token_reused`, which meant the stored credential had been superseded and could not be recovered by retrying refresh.
- Ran a fresh local ChatGPT OAuth browser flow against the repo-local desktop agent store and wrote the new `access` / `refresh` / `expires` / `accountId` values back into `.openclaw-desktop/agents/main/agent/auth-profiles.json`.
- Cleared transient cooldown fields for `openai-codex:default` in the desktop auth profile after the new OAuth credential was stored.
- Restarted the desktop gateway and re-exercised the Telegram webhook path.

## Commands Run
- `Get-Content C:\tmp\openclaw\openclaw-2026-04-19.log -Tail ...`
- `ollama` HTTP generate probes for:
- `qwen-hakua-core2-ctx128k`
- `qwen-hakua-core-lite`
- `qwen-Hakua-core2`
- `Copy-Item` legacy desktop auth store into repo-local desktop agent dir
- `node` probe calling `@mariozechner/pi-ai/oauth.refreshOpenAICodexToken()` against the stale desktop refresh token
- `node` local browser OAuth flow calling `@mariozechner/pi-ai/oauth.loginOpenAICodex()` and rewriting the desktop auth store
- Started `.openclaw-desktop\gateway.cmd`
- Posted test Telegram webhook payloads to `http://127.0.0.1:8787/telegram-webhook`
- Read appended log chunks from `C:\tmp\openclaw\openclaw-2026-04-19.log`

## Test / Verification Results
- Confirmed gateway restart picked up the new primary model:
- `agent model: openai-codex/gpt-5.4-mini`
- Confirmed Telegram inbound created a fresh embedded Telegram session:
- `sessionKey=agent:main:telegram:direct:7201110294`
- Confirmed Telegram reply was sent successfully:
- `telegram sendMessage ok chat=7201110294 message=1387`
- Confirmed the original `opencode/*` auth failure path no longer blocked replies.
- Confirmed the stale `openai-codex` refresh token failed with:
- `refresh_token_reused`
- Confirmed the fresh desktop `openai-codex` credential can now refresh successfully:
- `{"ok":true,"expires":"2026-04-29T02:10:45.005Z","accountId":"79b617a5-17ba-48fb-82e6-5243569a2f5e"}`
- Confirmed the restarted gateway is back on the intended primary model:
- `agent model: openai-codex/gpt-5.4-mini`
- Confirmed there were no new `OAuth token refresh failed for openai-codex` or model-fallback entries after the re-authenticated gateway restart.

## Residual Risks
- The local webhook replay after re-auth used noisy shared gateway logs, so the last verification is strongest on the auth refresh path itself rather than a clean single-run Telegram transcript.
- If a future desktop launcher or manual run points at a different state dir, the fresh credential will not follow automatically.

## Recommended Next Actions
- If desired, run one clean human Telegram DM smoke after the current gateway session to confirm the faster `openai-codex` path is what users see in practice.
- If local-only behavior is preferred later, consider making `ollama/qwen-hakua-core2-ctx128k` primary again while keeping the longer timeout.
