# Implementation Log

**Date**: 2026-04-16
**Task / Title**: Telegram webhook startup fix
**Implementation ID**: Codex

## Overview
Restored gateway startup past the previous sidecar stall, updated the Telegram bot credentials, re-enabled repo-local webhook mode, and completed ngrok plus Telegram webhook repair so the gateway now serves both `127.0.0.1:18789` and `127.0.0.1:8787`.

## Background / Requirements
- User requested restoring Telegram webhook mode end-to-end.
- Earlier gateway runs stopped before Telegram webhook repair because startup stalled during sidecar initialization.
- Repo policy required minimal safe changes, focused verification, and an `_docs` implementation log.

## Assumptions / Decisions
- Startup model warmup is best-effort and should never block channel startup.
- Skipping startup maintenance for unconfigured channel plugins is safer than running plugin-specific maintenance across inactive channels.
- Telegram webhook repair requires both a valid bot token and enough startup time for the bundled plugin scan and channel bootstrap to finish; earlier short waits made startup look hung when it was still progressing.

## Changed Files
- `C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\src\channels\plugins\lifecycle-startup.ts`
- `C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\src\channels\plugins\lifecycle-startup.test.ts`
- `C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\src\gateway\server-startup.ts`
- `C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\src\gateway\server-startup.test.ts`
- `C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\.openclaw-desktop\openclaw.json`
- `C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\.openclaw-desktop\.env`
- `C:\Users\downl\.openclaw\openclaw.json`
- `C:\Users\downl\.openclaw\.env`
- `C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\scripts\launchers\repair-ngrok-and-telegram-webhook.ps1`

## Implementation Details
- Added a configuration gate in `lifecycle-startup.ts` so startup maintenance only runs for configured channel plugins.
- Updated gateway startup warmup so configured primary-model warmup runs in the background instead of blocking `startChannels()`.
- Kept the 5 second warmup warning path so stuck warmup still surfaces in logs.
- Removed temporary startup marker diagnostics after verification.
- Enabled repo-local Telegram webhook settings:
  - refreshed `webhookUrl` and `webhookSecret` in local config to match the active ngrok tunnel and Telegram registration
  - `webhookPath=/telegram-webhook`
  - `webhookPort=8787`
- Replaced the invalid Telegram bot token in both repo-local and user-level OpenClaw config/env files with the valid bot token provided by the user.
- Verified from direct gateway logs that startup now completes on this machine:
  - Gateway HTTP listener binds first on `127.0.0.1:18789`
  - Telegram provider starts afterward
  - Telegram webhook local listener binds on `127.0.0.1:8787`
  - Telegram advertises the webhook to the active ngrok `/telegram-webhook` endpoint
- Ran the dedicated repair script with `-SkipGatewayStart` after both local ports were live, which restarted ngrok and refreshed the Telegram webhook registration.
- Hardened the repair script defaults after observing real cold-start timing on this machine:
  - increased default `GatewayWaitSeconds` from `45` to `180`
  - added an explicit wait-status line that shows both the gateway port and upstream webhook port
  - expanded the timeout failure message so it explains that cold Telegram webhook startup can take around 2 minutes locally

## Commands Run
```text
pnpm test -- src/gateway/server-startup.test.ts
pnpm test -- src/channels/plugins/lifecycle-startup.test.ts
pnpm test -- src/gateway/server-startup.test.ts src/channels/plugins/lifecycle-startup.test.ts
pnpm build
node scripts/tsdown-build.mjs --no-clean
powershell -File scripts/launchers/Start-Gateway.ps1
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 18789,8787 }
node openclaw.mjs channels status --json
Invoke-RestMethod -Method Get -Uri https://api.telegram.org/bot<token>/getMe
scripts\launchers\repair-ngrok-and-telegram-webhook.ps1 -Port 18789 -SkipGatewayStart
Invoke-RestMethod -Method Get -Uri http://127.0.0.1:4040/api/tunnels
```

## Test / Verification Results
- `pnpm test -- src/gateway/server-startup.test.ts`
  - Passed, 4 tests.
- `pnpm test -- src/channels/plugins/lifecycle-startup.test.ts`
  - Passed, 2 tests.
- `pnpm test -- src/gateway/server-startup.test.ts src/channels/plugins/lifecycle-startup.test.ts`
  - Passed, 6 tests.
- `pnpm build`
  - Failed due to a pre-existing missing A2UI source / bundle: `src\canvas-host\a2ui\a2ui.bundle.js`.
- `node scripts/tsdown-build.mjs --no-clean`
  - Passed, used to refresh dist/runtime for local verification after temporary CLI instrumentation.
- Runtime verification:
  - Gateway now binds `127.0.0.1:18789`.
  - Telegram webhook listener binds `127.0.0.1:8787`.
  - Gateway stderr shows `startup model warmup exceeded 5000ms; continuing startup without waiting`.
  - Telegram `getMe` succeeds with the updated token.
  - `repair-ngrok-and-telegram-webhook.ps1 -Port 18789 -SkipGatewayStart` returned `SUCCESS`.
  - Repair script reported populated `OPENCLAW_PUBLIC_URL` and `TELEGRAM_WEBHOOK_URL`, with empty `Telegram last_error_message`
  - ngrok API confirms the live tunnel now targets `http://127.0.0.1:8787`.

## Residual Risks
- Gateway logs also show unrelated plugin/runtime noise:
  - `acpx-runtime` plugin service failure on unknown config key `codexHarness`
  - repeated bonjour advertiser probing/restarts
  - existing Telegram `/tts` command name conflict
- Gateway startup is slower than it first appeared during debugging because:
  - importing the bundled gateway server tree takes roughly 20 to 25 seconds on this machine
  - full channel bootstrap, including Telegram webhook listener bind, took roughly 117 seconds from process spawn in the successful manual run

## Recommended Next Actions
- Keep the currently running gateway process if webhook mode should remain live immediately.
- If you restart later, keep using the repo-local config / launcher so the same webhook settings are preserved.
- If desired, separately triage the `acpx-runtime` config warning and the Telegram `/tts` command conflict.
