# Codex channel reply stabilization implementation log

Date: 2026-05-17
Commit covered: `6d29d47d770 fix: stabilize codex channel replies`
Repo: `clawdbot-main`

## Goal

Stabilize Telegram and LINE replies and reduce the perceived slowness of `openai-codex/gpt-5.5` with `thinking: low` in TUI and channel-driven runs.

The user-reported failure showed Telegram work queued behind a long active session and then failing before a reply with:

- `queued_behind_active_work`
- `auth refresh request timed out after 10s`
- `Embedded agent failed before reply`

## Root causes

1. Codex app-server `account/chatgptAuthTokens/refresh` could block behind a forced OAuth refresh longer than the app-server request deadline.
2. Tokenless or `oauthRef`-backed `openai-codex` profiles had usable external CLI credentials available, but the refresh path still tried the slow forced-refresh route first.
3. `openai-codex` OAuth API-key resolution called the generic provider formatter even though the bearer `access` token is already the runtime credential. In local measurement this added a long round-trip before falling back to the access token.
4. Windows Node fetches to Telegram and LINE could fail certificate validation unless the process used the system CA store.
5. Auth profile ordering could immediately retry a profile with a newer `lastFailureAt` than `lastUsed`, causing repeated profile rotation and long first-attempt stalls.
6. TUI already passed `thinking: low`; the slowness was caused by auth/profile behavior and a large cached prompt, not by a missing thinking override.

## Implementation

### Codex app-server auth refresh

Updated `extensions/codex/src/app-server/auth-bridge.ts` and `extensions/codex/src/app-server/auth-bridge.test.ts`.

- Added a soft-timeout fallback for app-server ChatGPT token refresh.
- Added cached-token response construction for usable OAuth and token credentials.
- Added a reusable-token fast path for `openai-codex` OAuth profiles backed by non-inline auth.
- Preserved strict forced refresh for profiles that need it, including explicit non-default profile cases.
- Preserved account id and ChatGPT plan metadata when building app-server token responses.

### OAuth and external CLI recovery

Updated `src/agents/auth-profiles/external-cli-sync.ts`, `src/agents/auth-profiles/oauth-manager.ts`, `src/agents/auth-profiles/oauth.ts`, and related tests.

- Allowed managed external Codex CLI credentials to rescue tokenless or expired local `openai-codex` profiles at runtime.
- Kept bootstrap-only external credentials runtime-only unless the existing local credential is safe to replace.
- Reused a fresh cached/effective credential when a forced refresh fails with refresh-token reuse.
- Returned `openai-codex` OAuth bearer access directly instead of waiting on the generic provider formatter.

### Auth profile ordering

Updated `src/agents/auth-profiles/order.ts` and `src/agents/auth-profiles/order.test.ts`.

- Kept normal OAuth/token/API-key ordering.
- Within the same auth mode, moved profiles with unresolved recent failures after healthier peers.
- This prevented every `gpt-5.5 low` run from spending the first attempt on a profile that had just failed authentication.

### Windows channel TLS

Updated `src/bootstrap/node-startup-env.ts`, `src/bootstrap/node-startup-env.test.ts`, and `src/daemon/service-env.test.ts`.

- Defaulted Windows startup/service environments to `NODE_USE_SYSTEM_CA=1`.
- This made Node-based Telegram and LINE probes use the Windows system certificate store.

### TUI thinking proof

Updated `src/tui/embedded-backend.test.ts`.

- Added a regression test proving explicit TUI `thinking` overrides reach `agentCommandFromIngress`.
- Existing command tests also covered configured fast/default thinking behavior.

## Verification

Targeted tests used `--maxWorkers=6` where applicable.

- `node scripts/run-vitest.mjs run --config test/vitest/vitest.extensions.config.ts extensions/codex/src/app-server/auth-bridge.test.ts --maxWorkers=6 --reporter=dot`
  - `39 passed`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.agents-support.config.ts src/agents/auth-profiles/external-oauth.test.ts src/agents/auth-profiles/oauth-manager.test.ts src/agents/auth-profiles/oauth.openai-codex-refresh-fallback.test.ts --maxWorkers=6 --reporter=dot`
  - `38 passed`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui.config.ts src/tui/embedded-backend.test.ts --testNamePattern "thinking overrides" --maxWorkers=6 --reporter=verbose`
  - explicit thinking override test passed
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.commands.config.ts src/commands/agent.test.ts --testNamePattern "passes resolved default thinking level|passes configured fast mode" --maxWorkers=6 --reporter=verbose`
  - `2 passed`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.unit-fast.config.ts src/bootstrap/node-startup-env.test.ts --maxWorkers=6 --reporter=verbose`
  - `6 passed`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.daemon.config.ts src/daemon/service-env.test.ts --maxWorkers=6 --reporter=dot`
  - `84 passed`
- `node scripts/run-vitest.mjs run --config test/vitest/vitest.agents-support.config.ts src/agents/auth-profiles/order.test.ts --testNamePattern "places recently failed" --maxWorkers=6 --reporter=verbose`
  - new ordering regression test passed
- `pnpm build`
  - passed
- `git diff --check`
  - passed

`codex review --uncommitted` was attempted twice and timed out without output. Manual review plus targeted tests, build, channel probes, and live model runs were used as the verification basis.

## Live runtime proof

After rebuilding and restarting the local Gateway on port `18789` with `NODE_USE_SYSTEM_CA=1`:

- `openclaw channels status --probe --json`
  - Telegram probe OK
  - Telegram mode: `polling`
  - Telegram bot: `はくあ` / `hakuawhite_bot`
  - LINE probe OK
  - LINE mode: `webhook`
  - LINE bot: `はくあ` / `@257ulkjd`
  - event loop degraded: `false`

App-server token refresh direct timings after the fix:

- implicit profile: about `7.2s`
- `openai-codex:default`: about `3.2s`
- explicit account profile: about `4.8s`

Final `gpt-5.5 low` channel-equivalent run:

- Command shape: `openclaw agent --agent main --model openai-codex/gpt-5.5 --thinking low --timeout 180 --json`
- Result text: `OK`
- Duration: `25064ms`
- Attempts: one success attempt
- Fallback used: `false`
- Request shaping: `thinking: low`

## Outcome

Telegram and LINE both probed successfully from the local Gateway. The steady-state `gpt-5.5 low` run returned in about 25 seconds without auth rotation or fallback. The previous app-server auth refresh timeout path was removed from the hot path for fresh reusable Codex credentials while preserving forced refresh where it is still required.
