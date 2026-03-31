# Desktop shortcut unification

- Date: 2026-03-31
- Branch: `main`

## Summary

Consolidated multiple desktop shortcuts (`ASI-ngrok`, `ASI-Gateway`, `ASI-TUI`, `ASI-Hypura-Harness`, `ASI-VOICEVOX`, legacy `ASI-Hakua-Sovereign`, `Sovereign-Portal`) into a **single** shortcut:

- **`OpenClaw-Sovereign.lnk`** → `powershell.exe` → `scripts/launchers/ASI-Hakua-Portal.ps1` with `-Mode Full -UseDesktopLauncher` (and `-WindowStyle Maximized` where applicable).

Full stack (ngrok, Gateway, TUI, Harness, VOICEVOX, browser) remains orchestrated by `Sovereign-Portal.ps1` via the wrapper.

## Files touched

- `scripts/launchers/ASI-Manifest-Sovereign.ps1`
- `scripts/launchers/Sovereign-Portal.ps1`
- `scripts/launchers/README.md`

## User action

Run once: `scripts/launchers/ASI-Manifest-Sovereign.ps1` to create/update `OpenClaw-Sovereign.lnk` and remove legacy `.lnk` files on the desktop.
