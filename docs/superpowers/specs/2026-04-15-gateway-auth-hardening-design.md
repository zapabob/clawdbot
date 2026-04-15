# Design: Gateway Auth Hardening and Python Execution Clarification

**Date**: 2026-04-15
**Status**: Approved

---

## Overview

This design removes gateway token auto-auth from browser URLs, hardens the
desktop and wizard gateway defaults, and clarifies that local Python execution
in this workspace should use local `exec` or the Hypura harness `/run` path
rather than remote `code_execution`.

The immediate problem is that several launcher, CLI, and setup flows still
generate Control UI URLs with `#token=` or `?token=`. That behavior is outdated
for this environment because the token is already available to trusted local
processes through `OPENCLAW_GATEWAY_TOKEN` or `gateway.auth.token`, while
putting the token in a browser URL expands the exposure surface. At the same
time, quickstart setup still seeds a relaxed Control UI auth default, which
conflicts with the desired hardened gateway posture.

This design keeps local process-to-gateway auth working, removes new tokenized
browser links, preserves temporary UI fallback compatibility for existing deep
links, and aligns launcher and harness messaging around local Python execution.

---

## Goals

- Stop generating Control UI URLs that contain gateway auth tokens.
- Keep `OPENCLAW_GATEWAY_TOKEN` and `gateway.auth.token` as the canonical token
  sources for trusted local processes.
- Make gateway startup defaults as hardened as practical for this desktop stack.
- Preserve backward compatibility for previously generated tokenized links long
  enough to avoid a breaking transition.
- Clarify that Python execution for this environment uses local `exec` or the
  Hypura harness `POST /run` flow backed by `uv run --script`.

## Non-Goals

- Redesign the Control UI login UX.
- Remove URL token parsing from the UI in this change.
- Change existing model naming conventions such as `qwen-hakua-core`.
- Replace the Hypura harness execution model, which already uses local `uv`.
- Change sandbox, ngrok, or firewall architecture beyond auth-default
  hardening.

---

## Current State

### Browser token generation

The current workspace still generates tokenized Control UI URLs in multiple
places:

- `scripts/launchers/openclaw-desktop/launch-desktop-stack.ps1`
- `scripts/launchers/openclaw-desktop/Sovereign-Portal.ps1`
- `src/commands/dashboard.ts`
- `src/commands/onboard-helpers.ts`
- `src/wizard/setup.finalize.ts`

Those flows currently produce either `#token=<token>` or `?token=<token>` and
then open or print those URLs.

### Relaxed quickstart auth default

`src/wizard/setup.gateway-config.ts` currently sets
`gateway.controlUi.allowInsecureAuth = true` during quickstart when the gateway
bind is loopback and the setting is otherwise undefined. That default is too
permissive for the desired launcher posture.

### UI fallback behavior

`ui/src/ui/app-settings.ts` already supports hydrating `token` from query or
hash parameters and then removing the token from the URL with
`window.history.replaceState`. This is useful as a compatibility bridge and
does not require immediate removal.

### Python execution path

`extensions/hypura-harness/scripts/code_runner.py` already generates Python and
executes it locally with:

```text
uv run --script <generated-file>
```

`extensions/hypura-harness/index.ts` already exposes this through the harness
`POST /run` route. The remaining gap is not execution capability but product
messaging and prompt direction so that operators do not confuse local execution
with remote `code_execution`.

---

## Proposed Design

### 1. Auth surface: stop generating tokenized browser URLs

All launcher, CLI, and setup flows in this workspace will stop generating
browser-facing Control UI URLs that include `token` in either the query string
or the fragment.

#### Rules

- The browser opens a clean Control UI URL only.
- Gateway tokens remain available to trusted local processes through
  `OPENCLAW_GATEWAY_TOKEN` and `gateway.auth.token`.
- TUI, gateway, launcher helpers, and ngrok-related local processes may keep
  using env/config token inputs.
- Browser auto-auth via URL token is removed as a generated behavior.

#### Affected surfaces

- Desktop launcher browser open path:
  - `scripts/launchers/openclaw-desktop/launch-desktop-stack.ps1`
  - `scripts/launchers/browser-wait-and-open.ps1`
- Legacy desktop portal path:
  - `scripts/launchers/openclaw-desktop/Sovereign-Portal.ps1`
- CLI and setup output:
  - `src/commands/dashboard.ts`
  - `src/commands/onboard-helpers.ts`
  - `src/wizard/setup.finalize.ts`

#### Result

- Clipboard output, browser launch, and terminal hints will show only the clean
  Control UI URL.
- SSH forwarding hints will no longer print an alternate authed URL.
- Existing UI support for incoming tokenized URLs remains in place for backward
  compatibility, but the workspace stops minting new ones.

### 2. Gateway defaults: prefer hardened Control UI auth

Gateway quickstart and desktop launcher defaults will favor the strict side.

#### Rules

- Do not automatically set `gateway.controlUi.allowInsecureAuth = true`.
- Do not automatically set
  `gateway.controlUi.dangerouslyDisableDeviceAuth = true`.
- Keep loopback binding as the default local exposure posture where applicable.
- Keep `allowedOrigins` limited to the minimum needed for local usage and any
  explicitly configured non-loopback cases.
- Do not treat ngrok or firewall monitoring as justification for weaker Control
  UI auth defaults.

#### Result

- Hardened defaults become the baseline.
- Dangerous flags remain opt-in and operator-driven.
- Security audit and startup-log behavior continue to reflect dangerous flags
  when the operator explicitly sets them, but launcher and wizard defaults no
  longer inject those states.

### 3. Python execution semantics: clarify local execution

This workspace will document and reinforce a single message:

- Local OpenClaw Python execution should use local `exec`, or
- Hypura harness `POST /run`, which already uses `uv run --script`.

This change does not need to redesign the harness. Instead, it aligns launcher
and product text so operators do not mistake xAI remote `code_execution` for
the supported local path in this environment.

#### Result

- Existing model-name conventions remain unchanged.
- Hypura harness remains the central local Python execution path.
- If prompt wording in `code_runner.py` needs tightening, it should only
  reinforce "return Python source for local execution" rather than change the
  runtime contract.

---

## Compatibility Strategy

This design intentionally separates generation from parsing.

- Generation of tokenized Control UI URLs stops immediately.
- UI parsing of `?token=` and `#token=` remains temporarily supported.
- Existing saved or copied deep links can still be opened during the transition.
- A later cleanup may remove UI-side token parsing after downstream surfaces and
  operator habits have fully migrated.

This reduces migration risk while still shrinking the default exposure surface
now.

---

## File Plan

### Primary implementation targets

- `scripts/launchers/openclaw-desktop/launch-desktop-stack.ps1`
  - Remove `#token=` browser URL generation.
- `scripts/launchers/openclaw-desktop/Sovereign-Portal.ps1`
  - Remove legacy `?token=` browser URL generation.
- `scripts/launchers/browser-wait-and-open.ps1`
  - Keep it as a wait-and-open helper for clean URLs.
- `src/commands/dashboard.ts`
  - Stop printing and opening tokenized dashboard URLs.
- `src/commands/onboard-helpers.ts`
  - Stop generating authed SSH/forwarding URLs.
- `src/wizard/setup.finalize.ts`
  - Stop presenting tokenized Control UI URLs during setup completion.
- `src/wizard/setup.gateway-config.ts`
  - Remove the quickstart auto-default that enables insecure Control UI auth.
- `extensions/hypura-harness/scripts/code_runner.py`
  - Optional prompt tightening only if needed to reinforce local execution.
- `extensions/hypura-harness/index.ts`
  - Keep the `/run` description aligned with local `uv` execution semantics if
    wording updates are needed.

### Primary verification targets

- `src/commands/dashboard.links.test.ts`
- `src/wizard/setup.gateway-config.test.ts`
- Any tests covering setup-finalize URL output or launcher-facing URL behavior
- Existing UI token-hydration tests such as:
  - `ui/src/ui/app-settings.test.ts`
  - `ui/src/ui/navigation.browser.test.ts`

---

## Testing Strategy

### Unit and integration expectations

- Update tests that currently expect `#token=` or `?token=` in generated
  browser-facing URLs.
- Add or update tests to prove quickstart no longer auto-enables
  `allowInsecureAuth`.
- Keep UI token parsing tests passing to preserve backward compatibility.
- Keep any security audit tests focused on explicit dangerous config, not on
  launcher defaults.

### Manual verification expectations

- Desktop launcher opens `http://127.0.0.1:<port>/...` without token suffixes.
- `openclaw dashboard` copies and opens a clean URL.
- Setup completion messages show a clean Control UI URL.
- Hypura harness documentation and descriptions still point to local `uv`
  execution.

---

## Risks and Mitigations

### Risk: browser no longer auto-authenticates

Removing tokenized URLs means browser sessions may require manual auth or other
existing UI-side auth flows.

**Mitigation:** This is an explicit product decision in this design. The browser
path becomes clean and non-auto-authing by default.

### Risk: older docs or operator habits still expect tokenized URLs

Some docs, scripts, or terminal habits may still assume copied URLs include
tokens.

**Mitigation:** Keep UI-side token parsing for now, and update affected local
docs and launcher-facing text during implementation.

### Risk: hardened defaults change quickstart expectations

Some local-only quickstart users may have relied on relaxed defaults without
realizing it.

**Mitigation:** Keep the hardening limited to defaults. Operators can still set
dangerous flags explicitly if they knowingly need them.

---

## Open Questions Resolved

- **Should the browser keep auto-login?**
  - No. Browser URL auto-auth is removed.
- **Should token handling move to environment variables?**
  - Yes. Environment/config remains the token source of truth for trusted local
    processes.
- **Should this change be narrow or product-wide?**
  - Product-wide across launcher, browser, dashboard, wizard, and gateway
    defaults.
- **Should Python execution rely on remote `code_execution`?**
  - No. Local `exec` and harness-backed local `uv` execution are the intended
    paths for this environment.

---

## Implementation Handoff

After this design is reviewed, the next step is to write a detailed
implementation plan that:

- breaks the work into test-first tasks,
- sequences auth-surface changes before hardening cleanup,
- records doc and launcher wording updates explicitly, and
- includes verification for both compatibility and hardened defaults.
