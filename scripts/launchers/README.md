# launchers/

Sovereign 用 Windows 起動スクリプト。ショートカットは `ASI-Manifest-Sovereign.ps1` がデスクトップに生成します。

| スクリプト                 | 役割                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| `Sovereign-Portal.ps1`     | メニューから Gateway / TUI / Harness / ngrok を段階起動。                                    |
| `ASI-Hakua-Portal.ps1`     | 上記へのラッパー（ショートカット互換）。                                                     |
| `Start-Gateway.ps1`        | `OPENCLAW_CONFIG_PATH` + `.env` マージ後に `pnpm openclaw gateway`。                         |
| `Start-TUI.ps1`            | 同上のうえ `pnpm openclaw tui`。                                                             |
| `Start-Hypura-Harness.ps1` | `extensions/hypura-harness/scripts` で `uv run harness_daemon.py`（または venv / `py -3`）。 |
| `start_ngrok.ps1`          | 404 API ポーリング → `.env` とプロセス env へ `OPENCLAW_PUBLIC_URL` 等。                     |
| `env-tools.ps1`            | `.env` と `.env.local` の読み書き・マージ（`Merge-OpenClawEnvToProcess`）。                  |
