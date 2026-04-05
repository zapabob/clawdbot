# scripts/hypura/

This directory is **not** the canonical Hypura harness tree. The daemon and Python package live under **`extensions/hypura-harness/scripts/`**.

## What lives here

- **`tests/`** — Pytest modules that import `harness_daemon` and other modules from the extension scripts directory (same source files as the running daemon).
- **`generated/`** — Harness-generated scripts (often gitignored or ephemeral).

Do **not** expect `harness_daemon.py` at this path; start the daemon from the extension directory or use [scripts/launchers/Start-Hypura-Harness.ps1](../launchers/Start-Hypura-Harness.ps1).

## Running pytest

Tests resolve `harness_daemon` when the extension scripts directory is on `PYTHONPATH`. From repository root (PowerShell):

```powershell
$env:PYTHONPATH = "extensions\hypura-harness\scripts"
py -3 -m pytest scripts\hypura\tests -q
```

From a Unix-like shell:

```bash
PYTHONPATH=extensions/hypura-harness/scripts py -3 -m pytest scripts/hypura/tests -q
```

Alternatively, run pytest from `extensions/hypura-harness/scripts` with the test path pointed at this tree (ensure the same `PYTHONPATH` if imports fail).

## See also

- [extensions/hypura-harness/README.md](../../extensions/hypura-harness/README.md)
- [_docs/2026-04-05_OpenClaw-layout-Sovereign-overlay_clawdbot-main.md](../../_docs/2026-04-05_OpenClaw-layout-Sovereign-overlay_clawdbot-main.md)
