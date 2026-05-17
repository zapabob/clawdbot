# Hermes Agent deepresearch for OpenClaw

Date: 2026-05-18
Branch: `codex/hermes-agent-deepresearch`
Hermes source snapshot: `NousResearch/hermes-agent` at `f36c89c` (depth-1 clone)
OpenClaw base: `origin/main` at `0c51c0c8235`

## Objective

Identify Hermes Agent advantages worth adopting in OpenClaw without importing
Hermes wholesale, weakening OpenClaw's plugin/core boundaries, or trusting
foreign runtime state automatically.

## Primary sources checked

- Hermes GitHub README:
  https://github.com/NousResearch/hermes-agent
- Hermes docs: Skills System:
  https://hermes-agent.nousresearch.com/docs/user-guide/features/skills
- Hermes docs: Curator:
  https://hermes-agent.nousresearch.com/docs/user-guide/features/curator
- Hermes docs: Cron:
  https://hermes-agent.nousresearch.com/docs/user-guide/features/cron
- Hermes docs: Persistent Memory:
  https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/memory.md
- Hermes GitHub SECURITY.md:
  https://github.com/NousResearch/hermes-agent/security
- Hermes release notes in the cloned repo:
  `RELEASE_v0.12.0.md`, `RELEASE_v0.13.0.md`, `RELEASE_v0.14.0.md`

## Findings

Hermes' strongest product ideas are not raw tools; OpenClaw already has many of
those. The durable advantages are lifecycle behaviors around skills, scheduled
work, continuity, and security framing.

1. Skill lifecycle: Hermes documents skills as progressive-disclosure
   AgentSkills-compatible procedural memory, with agent-managed skill creation
   and support files under `references/`, `templates/`, `scripts/`, and
   `assets/`. Its v0.12 release notes also call out background review handling
   of `references/` and `templates/`.

2. Curator: Hermes has a background maintenance pass for agent-created skills:
   usage telemetry, stale/archive transitions, pinning, dry-run, reports, and
   backup/rollback. OpenClaw has Skill Workshop plus memory dreaming, but not a
   skill-specific curator yet.

3. Script-only cron: Hermes `no_agent` jobs run scripts without touching the
   inference layer. Empty stdout is silent, stdout is delivered directly, and
   failures alert. This is a useful watchdog pattern. OpenClaw has isolated
   cron with tool allowlists and delivery controls, but does not yet expose a
   script-only cron payload.

4. Security posture: Hermes explicitly treats sandbox containment as the
   load-bearing boundary, while approval gates, redaction, and skill scanners
   are defense-in-depth. This matches the direction OpenClaw should keep:
   scanner results are review aids unless paired with a real execution
   boundary.

5. Gateway continuity: Hermes release notes emphasize auto-resume after gateway
   restart, per-platform allowlists, restart status clarity, and platform
   circuit breakers. OpenClaw already has strong gateway/session infrastructure,
   so this is a regression-test and UX checklist rather than a direct port.

6. Persistent memory: Hermes separates bounded always-in-context memory files
   (`MEMORY.md` and `USER.md`) from session search over SQLite FTS5 and optional
   external providers. The valuable idea for OpenClaw is not importing Hermes'
   store shape; it is keeping memory, skills, curator reports, and cron as
   separate lifecycle surfaces while letting the agent inspect memory health.

## Integration decision

The safest first OpenClaw change is to improve Skill Workshop's reviewer so it
can propose support-file updates, not only `SKILL.md` create/append/replace
updates. This imports one concrete Hermes advantage while staying inside
OpenClaw's existing plugin-owned workspace-skill model:

- no core imports from plugins
- no third-party code execution
- no new dependency
- no automatic trust of Hermes state
- same scanner/quarantine/approval path as existing Skill Workshop proposals

Implemented changes:

- Added `write_file` proposal support to Skill Workshop changes.
- Allowed the LLM reviewer to emit `write_file` proposals with `relativePath`.
- Reused the existing path-checked support-file write surface for proposals.
- Added a Skill Workshop `curator_report` action that is dry-run/report-only:
  it counts skills, support files, proposal states, and read-only maintenance
  recommendations without writing, archiving, or deleting anything.
- Added script-only cron payloads (`kind: "script"`) as the OpenClaw analogue
  of Hermes `no_agent` jobs: argv execution without an agent/model turn, silent
  empty stdout, stdout summaries, timeout support, run-log diagnostics, and
  existing cron delivery/failure surfaces.
- Added gateway restart continuity regression coverage for script-only jobs so
  overdue startup runs are deferred and interrupted runs are marked failed
  rather than replayed after restart.
- Added `openclaw memory report` as a persistent-memory dry-run/report-only
  surface. It reads existing OpenClaw memory files and returns hygiene
  recommendations for duplicate entries, large root memory, old daily notes,
  key/value conflict candidates, and source-sparse root memory without writing
  or promoting anything.
- Documented reviewer support-file proposals in `docs/plugins/skill-workshop.md`.
- Documented `curator_report`, script-only cron usage, and memory report usage.
- Added deterministic tests for support-file apply, path rejection, and reviewer
  proposal parsing.

## Recommended next slices

1. Skill curator MVP:
   - track workspace skill view/use/patch counts in a plugin-owned state file
   - support `pin`, `status`, `dry-run`, and report-only stale detection first
   - do not archive/delete until there is backup/rollback and owner review

2. Script-only cron RFC:
   - add a `script` payload kind instead of overloading `agentTurn`
   - require an explicit script root under the OpenClaw state/workspace boundary
   - deliver trimmed stdout, suppress empty stdout, and alert on non-zero exit
   - reuse existing failure destination and run-log surfaces

3. Gateway continuity audit:
   - add a checklist against auto-resume, per-platform allowlists, native
     approval UI, circuit breakers, and restart status
   - convert any gaps into targeted regression tests before behavior changes

4. Persistent memory report refinement:
   - keep the first pass read-only
   - add richer contradiction/source detection only with explicit evidence
   - do not auto-delete, auto-overwrite, or auto-promote memory from the report
   - keep fact/preference memory separate from procedural Skill Workshop skills

5. Security docs alignment:
   - keep language clear that scanners, approval prompts, and redaction are
     defense-in-depth
   - keep sandbox/container/runtime policy as the execution boundary

## Non-goals

- Do not vendor Hermes Python code into OpenClaw core.
- Do not trust or execute Hermes skill/plugin/cron state during migration.
- Do not add a skill auto-deletion curator without backup, dry-run, and pinning.
- Do not expose script-only cron before the path, sandbox, and failure-delivery
  contract is explicit.
- Do not migrate Hermes persistent-memory provider state directly into OpenClaw
  memory, skills, or agent state.
- Do not add automatic memory deletion, overwrites, or promotion from
  `memory report`.
