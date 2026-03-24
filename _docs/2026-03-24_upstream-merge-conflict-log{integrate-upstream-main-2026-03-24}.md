# Upstream merge conflict resolution log

- Branch: `integrate/upstream-main-2026-03-24`
- Merge target: `upstream/main`
- Merge mode: `git merge --no-ff --no-commit upstream/main`

## Conflict summary

1. `extensions/line/runtime-api.ts` (content conflict)
2. `pnpm-lock.yaml` (content conflict)

## Resolution decisions

### 1) `extensions/line/runtime-api.ts`

- Decision: **hybrid (upstream + fork-safe)**
- Kept upstream pre-export block and `openclaw/plugin-sdk/line-runtime` re-export.
- Removed conflict markers and preserved existing local extension exports.
- Reason:
  - Upstream block prevents jiti duplicate export property definition failures.
  - Keeping local exports preserves extension compatibility with custom runtime imports.

### 2) `pnpm-lock.yaml`

- Decision: **regenerate**
- Action: `pnpm install --lockfile-only`
- Reason:
  - Deterministic lock regeneration is safer than hand-merging lockfile hunks.
  - Ensures workspace-wide dependency graph integrity after large upstream merge.

## Domain pass status

- Base/build domain: resolved (`pnpm-lock.yaml`)
- Channel domain: resolved (`extensions/line/runtime-api.ts`)
- UI domain: no direct conflict markers encountered in this merge
