# 2026-02-21 Avatar Material Fix

## Overview

Fixed an issue where the 3D avatar's face was rendering as pure white (blown out) and difficult to see.

## Changes

### `scripts/avatar-window.html`

- **Lighting Adjustments:**
  - Precisely balanced the lights so front-facing surfaces never exceed 1.0 intensity (Ambient 0.55 + Key 0.45). This prevents blowouts mathematically without altering colors.
  - Ambient Light: `0.4` -> `0.55` (base shadow level).
  - Directional Key Light: `0.8` -> `0.45`.
  - Fill Light: `0.4` -> `0.1`.
  - Rim Light: `0.5` -> `0.15`.
- **Tone Mapping:**
  - Enforced `THREE.NoToneMapping` on the `WebGLRenderer`. This prevents the engine from desaturating bright colors, preserving the vivid, saturated look of anime textures.
- **Material Emissive Logic (The Core Anime Look):**
  - Read the `mat.map` from the original FBX material and assigned it to `toonMat.emissiveMap`.
  - Set `toonMat.emissive = new THREE.Color(0xffffff)` and `toonMat.emissiveIntensity = 0.35` for textured materials. This is the crucial step that makes the painted texture colors glow vividly, preventing them from being washed out by white light or crushed by dark shadows.
  - Preserved original FBX `transparent` and `alphaTest` values to fix issues with hair and eyelashes.

## Next Steps

- Verify the avatar rendering visually by opening the `HakuaAvatar.lnk` shortcut.
- Confirm that the face features (eyes, nose shadows) are distinct and not washed out.
