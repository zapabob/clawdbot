---
name: line-channel
description: Use the OpenClaw LINE channel safely for webhook setup, group routing, rich replies, and runtime diagnosis.
user-invocable: false
---

# LINE Channel

Use this skill when the user asks an agent to configure, diagnose, or operate the bundled LINE plugin.

## Operating rules

- Keep credentials in config, env, or secret files. Do not print channel access tokens or channel secrets.
- Use the gateway-owned LINE webhook path. Do not start a separate ad hoc LINE server.
- For multi-account LINE setups, keep each account id, webhook path, token, secret, and group policy explicit.
- Treat group routing as allowlist-first unless the user intentionally requests open group behavior.

## Normal proof path

1. Check config shape and account selection with `openclaw channels status line`.
2. Confirm the webhook path matches the LINE Developers console URL.
3. Verify credentials with `openclaw channels status --channel line --probe --json` or the
   official webhook test endpoint. Report success/failure without printing the token.
4. For a live roundtrip, require a real LINE `userId`, `groupId`, or `roomId`.
   Do not invent a recipient. If no recipient is available, ask the operator to
   send one inbound message to the configured webhook, then use the resulting
   conversation id for the explicit `--to` proof.
5. For code changes, prefer focused tests first:

```text
node scripts/run-vitest.mjs run --config test/vitest/vitest.extension-line.config.ts extensions/line/src/gateway.lifecycle.test.ts extensions/line/src/monitor.lifecycle.test.ts
```

6. For reply or group behavior, add the smallest matching `extensions/line/src/*.test.ts` file.

## Recipient and roundtrip handling

- Treat LINE user, group, and room ids as private routing identifiers. Do not
  print raw ids in shared logs unless the user explicitly asks for the target.
- A direct proof needs `line:user:<userId>` or the raw `U...` id. Group and
  room proofs need `line:group:<groupId>` or `line:room:<roomId>`.
- The webhook handler records inbound activity and routes by the source
  conversation id; the outbound proof must use that same id with an explicit
  `--to` target.
- In groups, confirm whether `requireMention` is expected. If mention gating is
  on, a plain group message should stay quiet and does not prove a broken bot.

## Common tasks

- Webhook lifecycle: inspect `extensions/line/src/gateway.ts` and `extensions/line/src/monitor.ts`.
- Signature and raw-body behavior: inspect `extensions/line/src/webhook-node.ts` and `extensions/line/src/webhook-utils.ts`.
- Group admission and mention behavior: inspect `extensions/line/src/group-policy.ts`, `extensions/line/src/group-keys.ts`, and `extensions/line/src/bot-handlers.ts`.
- Rich card delivery: use the `card` command or helpers under `extensions/line/src/flex-templates.ts`.

## Troubleshooting

- Startup exits immediately: confirm `startAccount` stays pending until the gateway abort signal and that `monitor.stop()` runs on abort only.
- Webhook returns 401: verify the raw request bytes and `X-Line-Signature` against the account secret.
- Group messages are quiet: verify the group id, group config, and whether mention gating is expected.
- Replies fail after a delay: LINE reply tokens expire quickly; check push fallback behavior.
- Live proof is blocked: confirm the local state actually contains a LINE
  recipient id. Credential and webhook tests prove setup, but not a user
  message/reply roundtrip.
