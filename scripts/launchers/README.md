# launchers/

Sovereign 用 Windows 起動スクリプト。デスクトップは **`OpenClaw-Sovereign.lnk` 1本**に統一（`ASI-Manifest-Sovereign.ps1` で生成・古い ASI-\* 個別ショートカットは削除）。ポータル実行後も `Sovereign-Portal.ps1` が同じ `.lnk` を欠けていれば補完します。

| スクリプト                  | 役割                                                                                                                                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Sovereign-Portal.ps1`      | メニューから Gateway / TUI / Harness / ngrok を段階起動。`Full` は Gateway 待機後に TUI を起動。Gateway 待ちで止まる場合は `OPENCLAW_SKIP_GATEWAY_WAIT=1`、厳格に落としたいときは `-StrictGatewayWait`。 |
| `ASI-Hakua-Portal.ps1`      | 上記へのラッパー（ショートカット互換）。                                                                                                                                                                 |
| `Start-Gateway.ps1`         | `OPENCLAW_CONFIG_PATH` + `.env` マージ後に `node scripts/run-node.mjs gateway`（子プロセスに `pnpm` が無い問題を回避）。                                                                                 |
| `Start-TUI.ps1`             | 同上で `node scripts/run-node.mjs tui`。                                                                                                                                                                 |
| `Start-Hypura-Harness.ps1`  | `uv run --project <repo-root> harness_daemon.py` を最優先（失敗時は venv / `py -3` フォールバック）。                                                                                                    |
| `start_ngrok.ps1`           | **リポジトリ内**の `bin\ngrok.exe` 等のみ使用（PATH のグローバル ngrok は使わない）。別場所なら `.env` に `NGROK_EXE=C:\full\path\ngrok.exe`。404 ポーリング → `.env` 更新。                             |
| `start-voicevox-engine.ps1` | `run.exe --host/--port` で ENGINE 起動 → `scripts/tools/verify_voicevox.py` で確認（`VOICEVOX_ENGINE_PATH`）。                                                                                           |
| `env-tools.ps1`             | `.env` と `.env.local` の読み書き・マージ（`Merge-OpenClawEnvToProcess`）。                                                                                                                              |
