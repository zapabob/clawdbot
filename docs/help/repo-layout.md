# Repository Layout

This fork keeps an **upstream-first** root layout with a small sanctioned overlay for local identity and desktop runtime entrypoints.

## Official Root

The canonical baseline comes from `upstream/main` and is snapshotted in [`docs/.generated/upstream-root-layout.json`](../.generated/upstream-root-layout.json).

Examples:

- `src/`, `extensions/`, `scripts/`, `docs/`, `ui/`
- official root docs such as `README.md`, `AGENTS.md`, `SECURITY.md`
- official vendor code under `vendor/`

## Sanctioned Overlay

These paths intentionally stay at repository root even though they are fork-specific:

- `.openclaw-desktop/`
- `identity/`
- `memory/`
- `_artifacts/`
- `_docs/`
- `_snapshots/`
- `logs/`
- `state/`
- `tests/`
- `tmp/`
- root bootstrap files `SOUL.md`, `MEMORY.md`, `USER.md`, `IDENTITY.md`, `HEARTBEAT.md`, `TOOLS.md`
- root tooling files such as `.cursor`, `.cursorindexingignore`, `.env.atlas.example`, `docker-compose.override.yml`, `uv.lock`, and the sharded `vitest.*` configs used by this fork

## Legacy Capture

When a file or directory should no longer live at repository root, relocate it instead of deleting it.

Current destinations:

- `_artifacts/root-captured/`
- `_artifacts/legacy-desktop/`
- `_artifacts/legacy-workspaces/`
- `_artifacts/runtime-captured/`
- `_docs/workspace-overlay/`

## Vendor Submodules

External repositories now live under `vendor/submodules/`.

- `vendor/submodules/vrchat-mcp-osc` is the canonical location for the VRChat MCP helper.
- `vendor/submodules/registry.json` declares the approved runner presets.
- Core and Hypura both use the registry-backed `submodule_run` surface instead of exposing raw HTTP `exec`.

## Immutable Files

The following files are treated as immutable for layout migrations:

- `SOUL.md`
- `identity/SOUL.md`

Their recorded hashes live in [`docs/.generated/immutable-overlay-files.json`](../.generated/immutable-overlay-files.json).

## Guard

Run:

```bash
pnpm repo:layout:check
```

The guard rejects:

- unexpected tracked root items outside the official baseline plus sanctioned overlay
- drift in immutable overlay files
