# _artifacts/

Captured files that were deliberately relocated out of the canonical root layout.

Use this directory for:

- `root-captured/`: loose root files that should not stay at repository root.
- `legacy-desktop/`: historical desktop-only helpers that are no longer canonical.
- `legacy-workspaces/`: preserved workspace overlays such as the old `brain/` tree.
- `runtime-captured/`: tracked runtime payloads moved out of `.openclaw-desktop/`.
- `vendor-imports/`: captured nested-repo state kept before converting to real submodules.
- `repo-layout/`: manifests describing root realignment moves.

This directory is a relocation target, not a new working root.
