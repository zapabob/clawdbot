# 2026-02-21 Avatar Visibility Fix

## Overview

Fixed a regression where the 3D avatar model was invisible due to a JavaScript syntax error in the `animate` loop.

## Changes

### `scripts/avatar-window.html`

- Removed an undefined variable `t` that was being incremented in the `animate` function (`t += delta;`).
- Verified that the `idleTime` variable remains correctly declared and used for procedural breathing animations.
- Confirmed that the `AnimationMixer` and `QuaternionKeyframeTrack` pose system is intact and correctly exposed via `window.playPose`.

## Technical Details

- **Error:** `ReferenceError: t is not defined` halted the execution of the Three.js render loop.
- **Resolution:** Deleted the stray line left from a previous refactor.
- **Verification:** The model visibility should be restored, and procedural animations (Spine, Head, Hair) should function as expected during idle state.

## Next Steps

- User to verify visibility in the UI.
- Test `window.playPose('wave')` in console to confirm pose animations work without deformation issues.
