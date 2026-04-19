# Telegram Workspace Template Repair

Date: 2026-04-19
Author: Codex

## Context

Investigated why Telegram AI replies were not working in the desktop-stack profile.

## Findings

1. The local desktop gateway Scheduled Task was missing, so desktop launches were not keeping the gateway alive.
2. Telegram Bot API health was fine: `getMe` and `getWebhookInfo` both succeeded.
3. Direct gateway health with the desktop config also showed Telegram as configured and probeable.
4. A reproducible repo bug remained in workspace bootstrap:

```text
Missing workspace template: IDENTITY.md (...\\docs\\reference\\templates\\IDENTITY.md)
```

This matched earlier Telegram dispatch failures in gateway logs.

## Change

Added the missing standard workspace templates:

- `docs/reference/templates/IDENTITY.md`
- `docs/reference/templates/USER.md`

These are the non-dev counterparts to the existing `*.dev.md` templates and unblock `ensureAgentWorkspace(... ensureBootstrapFiles: true)` for channel/agent workspaces.

## Verification Plan

- Run a direct `ensureAgentWorkspace` bootstrap smoke.
- Run `src/agents/workspace.test.ts`.
- Repair the local desktop gateway Scheduled Task and re-check gateway health in the desktop profile.
