# Overview

Created the detailed implementation plan for the approved gateway auth
hardening design before any production code changes were started.

# Background / requirements

- The approved spec requires clean Control UI URLs, hardened gateway defaults,
  and clarified local Python execution semantics.
- The user explicitly asked for careful planning before implementation.
- The workspace planning workflow required a written implementation plan after
  spec approval.

# Assumptions / decisions

- Wrote the plan in the existing workspace because repo policy forbids creating
  worktrees without explicit chat approval.
- Structured the work into six tasks so each change surface can be verified and
  committed independently.
- Added a final task for `_docs`, targeted tests, and repo gates so the plan
  ends with evidence, not just code edits.

# Changed files

- `docs/superpowers/plans/2026-04-15-gateway-auth-hardening.md`
- `_docs/2026-04-15_gateway-auth-hardening-implementation-plan{clawdbot-main}.md`

# Implementation details

- Mapped all files touched by the approved design.
- Broke the work into task-sized chunks for:
  - dashboard/helper clean URLs,
  - setup-finalize clean URLs,
  - quickstart hardening,
  - launcher cleanup,
  - Hypura wording,
  - final verification and logging.
- Included concrete code snippets and exact commands for each step.

# Commands run

```powershell
Get-ChildItem -Path 'docs/superpowers/plans'
Get-Content -Path 'docs/superpowers/plans/2026-03-25-hypura-python-harness.md' -TotalCount 320
Get-Content -Path 'src/commands/dashboard.links.test.ts' -TotalCount 260
Get-Content -Path 'src/commands/onboard-helpers.test.ts' -TotalCount 260
Get-Content -Path 'src/wizard/setup.finalize.test.ts' -TotalCount 260
Get-Content -Path 'extensions/hypura-harness/scripts/tests/test_code_runner.py' -TotalCount 260
```

# Test / verification results

- Verified the targeted source files and existing tests needed to write a
  concrete implementation plan.
- No automated runtime tests were executed in this planning-only step.

# Residual risks

- The plan has not yet been executed, so runtime behavior is unchanged.
- Launcher smoke coverage still depends on implementation-time verification.

# Recommended next actions

- Review the implementation plan.
- Choose whether to execute it inline or through subagent-driven task dispatch.
