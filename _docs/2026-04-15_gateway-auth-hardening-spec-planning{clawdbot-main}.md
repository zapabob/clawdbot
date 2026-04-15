# Overview

Recorded the approved design for gateway auth hardening and Python execution
clarification in a new spec under `docs/superpowers/specs/`, before any
implementation work begins.

# Background / requirements

- The workspace still generates browser URLs with `#token=` or `?token=` in
  launcher, dashboard, and setup flows.
- Quickstart setup currently defaults `gateway.controlUi.allowInsecureAuth` to
  `true` in one local path.
- The user asked to plan carefully before implementing and approved a broad
  design that spans browser, TUI, gateway, ngrok-facing posture, and Hypura
  execution guidance.
- The brainstorming workflow required a written spec before an implementation
  plan.

# Assumptions / decisions

- Treated this as a design-only step; no runtime code or tests were changed in
  this pass.
- Kept UI token parsing as a compatibility bridge in the design rather than
  removing it immediately.
- Chose `docs/superpowers/specs/2026-04-15-gateway-auth-hardening-design.md`
  as the canonical design document path.

# Changed files

- `docs/superpowers/specs/2026-04-15-gateway-auth-hardening-design.md`
- `_docs/2026-04-15_gateway-auth-hardening-spec-planning{clawdbot-main}.md`

# Implementation details

- Wrote a design spec covering:
  - removal of generated tokenized browser URLs,
  - hardened gateway defaults,
  - local Python execution semantics for OpenClaw and Hypura,
  - compatibility strategy,
  - file targets,
  - testing strategy,
  - risks and mitigations.
- Captured this planning step in `_docs` per workspace logging policy.

# Commands run

```powershell
git status --short
git log -n 8 --oneline -- scripts/launchers/openclaw-desktop src/commands/dashboard.ts src/wizard/setup.finalize.ts extensions/hypura-harness/scripts/code_runner.py
Get-ChildItem -Path 'docs/superpowers/specs'
Get-Content -Path 'docs/superpowers/specs/2026-03-29-sync-openclaw-desktop-design.md' -TotalCount 260
Get-Content -Path 'docs/superpowers/specs/2026-03-25-hypura-python-harness-design.md' -TotalCount 260
```

# Test / verification results

- Verified the relevant launcher, dashboard, wizard, UI, and Hypura source
  files before writing the spec.
- Verified the current token-generation and insecure-default call sites in code.
- No automated tests were run in this step because this was a design-only
  documentation change.

# Residual risks

- The design has not yet been translated into an implementation plan or code
  changes, so runtime behavior is unchanged.
- Some existing docs or tests may still assume tokenized URLs; the exact update
  set will be confirmed in the implementation plan.

# Recommended next actions

- Review the new design spec with the user.
- If approved, create the detailed implementation plan under
  `docs/superpowers/plans/`.
- Only after the plan is accepted should code changes and test updates begin.
