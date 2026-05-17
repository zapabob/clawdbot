---
name: telegram-channel
description: Use the OpenClaw Telegram channel safely for polling or webhook setup, group routing, mention gating, and runtime diagnosis.
user-invocable: false
---

# Telegram Channel

Use this skill when the user asks an agent to configure, diagnose, or operate the bundled Telegram plugin.

## Operating rules

- Keep bot tokens in config, env, or secret files. Do not print tokens.
- Default to long polling unless the user explicitly wants webhook mode.
- In groups, separate group ids from user ids: negative `-100...` chat ids belong under `channels.telegram.groups`, while user ids belong in `allowFrom` or `groupAllowFrom`.
- Keep `requireMention` explicit for group behavior. Plain group messages are expected to stay quiet when mention gating is enabled.

## Normal proof path

1. Inspect current status with `openclaw channels status telegram`.
2. For webhook mode, verify `getWebhookInfo`, the configured path, and the webhook secret header.
3. Verify bot credentials with `openclaw channels status --channel telegram --probe --json`
   or Telegram `getMe`. Report the bot identity only after redacting token
   material.
4. For a live roundtrip, require a real chat id. Do not reuse a group id as a
   user allowlist entry, and do not invent a chat id. If no target is present,
   ask the operator to send one message to the bot and inspect the resulting
   update metadata locally.
5. For code changes, prefer focused tests first:

```text
node scripts/run-vitest.mjs run --config test/vitest/vitest.extension-telegram.config.ts extensions/telegram/src/bot-message-context.require-mention.test.ts extensions/telegram/src/webhook-status.test.ts
```

6. For startup or polling behavior, add the smallest matching file under `extensions/telegram/src`.

## Target and roundtrip handling

- Treat Telegram chat ids and user ids as private routing identifiers in shared
  logs. Report presence, shape, and success state unless the user explicitly
  needs the raw id.
- Direct messages use the user chat id. Supergroups usually use negative
  `-100...` chat ids under group config.
- In groups, `requireMention` controls whether plain messages are ignored. A
  quiet plain message can be the expected secure behavior.
- A complete live proof is credential probe plus one inbound update plus one
  outbound send or reply to the same chat id.

## Common tasks

- Mention gating and group text: inspect `extensions/telegram/src/bot-message-context.body.ts` and `extensions/telegram/src/group-policy.ts`.
- Webhook ingress: inspect `extensions/telegram/src/webhook.ts` and `extensions/telegram/src/monitor.ts`.
- Polling conflicts: inspect `extensions/telegram/src/polling-session.ts`, `extensions/telegram/src/polling-lease.ts`, and `extensions/telegram/src/polling-liveness.ts`.
- Delivery and reply threading: inspect `extensions/telegram/src/bot/delivery.ts` and `extensions/telegram/src/bot/reply-threading.ts`.

## Troubleshooting

- Bot is silent in a group: check privacy mode, bot admin status, group allowlist, sender allowlist, and `requireMention`.
- Webhook is healthy but no messages arrive: confirm Telegram is delivering updates and that `pending_update_count` is not the only signal being checked.
- `getUpdates` reports 409: another poller or gateway owns the same token.
- Startup reports 401: fix the token first; do not treat auth errors as harmless webhook cleanup failures.
- Live proof is blocked: confirm a real chat id or inbound update exists before
  treating the channel as unverified.
