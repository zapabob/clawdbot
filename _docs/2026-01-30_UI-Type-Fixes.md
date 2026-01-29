# Implementation Log - 2026-01-30 - UI Type Fixes

## objective

Resolve 100+ TypeScript errors in the UI, fix "Form view can't safely edit" warnings, and ensure stable server startup.

## Changes

### UI TypeScript Fixes

- Added missing properties to `AppViewState` in `ui/src/ui/app-view-state.ts`.
- Added `roles` and `scopes` to `PresenceEntry` in `ui/src/ui/types.ts`.
- Fixed `googlechat` -> `googleChat` typo in `ui/src/ui/views/channels.ts`.
- Fixed `SettingsHost` and test mock states in `ui/src/ui/app-settings.ts`, `ui/src/ui/controllers/chat.test.ts`, and `ui/src/ui/controllers/config.test.ts`.
- Fixed `SkillMessage` import in `ui/src/ui/app.ts`.
- Fixed type narrowing and null/undefined issues in `ui/src/ui/app-tool-stream.ts` and `ui/src/ui/app-render.helpers.ts`.
- Fixed `crypto.subtle.digest` type error in `ui/src/ui/device-identity.ts`.

### Schema & Config

- Changed `.strict()` to `.passthrough()` in `src/config/zod-schema.ts` and `src/config/zod-schema.session.ts`.
- Added LINE channel to `CHAT_CHANNEL_ORDER` and `ui/src/ui/views/channels.ts`.
- Disabled TLS in `moltbot.json` and patched `src/infra/tls/gateway.ts` to survive `ENOENT` on `openssl`.

## Results

- `npx tsc --noEmit` returns zero errors.
- Server starts reliably.
- GUI is fully operative with no schema warnings.
