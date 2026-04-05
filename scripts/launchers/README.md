# launchers/

Sovereign 用 Windows 起動スクリプト。

## デスクトップ

**デスクトップには `OpenClaw.lnk` 1 本だけ**を置く（フルスタック = `launch-desktop-stack.ps1` 相当）。

- 生成: **`scripts/installers/create-desktop-shortcut.ps1`** または **`scripts/launchers/ASI-Manifest-Sovereign.ps1`** または  
  `scripts\launchers\Install-OpenClawDesktopShortcuts.ps1 -Force -PreferPwsh`（ルートの `.ps1` は **シム**で、実体は下記フォルダ）。

## `openclaw-desktop/`（本体 PS1）

次の実装は **`scripts/launchers/openclaw-desktop/`** に集約:

| ファイル | 役割 |
|----------|------|
| `launch-desktop-stack.ps1` | デスクトップ・フルスタック起動（VOICEVOX / Hypura / ngrok / Gateway / TUI / Companion / Browser） |
| `Sovereign-Portal.ps1` | メニューから段階起動。`Full` は Gateway 待機後に TUI。 |
| `ASI-Hakua-Portal.ps1` | `Sovereign-Portal.ps1` への薄いラッパー |
| `Install-OpenClawDesktopShortcuts.ps1` | `OpenClaw.lnk` のみ作成し、旧複数 `.lnk` を削除 |
| `ASI-Manifest-Sovereign.ps1` | 上記インストーラを `-Force` で実行 |

**ルートの同名 `.ps1`**（`launch-desktop-stack.ps1` 等）は互換のため **`openclaw-desktop\*.ps1` へ委譲するシム**。`OPENCLAW_DESKTOP_LAUNCHER=scripts/launchers/launch-desktop-stack.ps1` はそのまま有効。

手動例: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\launchers\openclaw-desktop\Install-OpenClawDesktopShortcuts.ps1 -Force -PreferPwsh`

### ngrok (`start_ngrok.ps1`)

- **LINE Developers に登録する Webhook URL** はゲートウェイ実装どおり **`{公開URL}/line/webhook`**（`extensions/line/src/monitor.ts` の既定）。旧 **`/hooks/line`** は誤りで 404 になる。
- **Telegram**（`channels.telegram.webhookUrl` を使う webhook モード）は **別プロセスの HTTP サーバー**（既定パス **`/telegram-webhook`**、既定ポート **8787**）。`start_ngrok.ps1` の上流は通常 **Gateway ポート**なので、Telegram webhook を ngrok 越しに使う場合は `.env` に **`NGROK_UPSTREAM_URL=http://127.0.0.1:8787`** を設定する。**1 本の ngrok は 1 上流だけ**なので、同時に「Gateway 越しの LINE」と「8787 の Telegram webhook」は共用できない。両方使うなら **Telegram はポーリング**（`webhookUrl` 未設定）にして ngrok→Gateway で LINE だけ、または ngrok を 2 本立てる。
- `Sync-NgrokPublicUrlToEnv` が `.env` に書く **`TELEGRAM_WEBHOOK_URL` / `LINE_WEBHOOK_URL`** は上記パスと一致。
- 起動前に **上流の HTTP 応答**を待ち、**ERR_NGROK_8012** を減らす。
- 既に **127.0.0.1:Port 向けのトンネル**が 4040 API に載っている場合は **再利用**して `.env` 同期のみ行い終了（`-ForceRestart` で従来どおり作り直し）。

| スクリプト                  | 役割                                                                                                                                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw-desktop\Sovereign-Portal.ps1` | メニューから Gateway / TUI / Harness / ngrok を段階起動。`Full` は Gateway 待機後に TUI を起動。Gateway 待ちで止まる場合は `OPENCLAW_SKIP_GATEWAY_WAIT=1`、厳格に落としたいときは `-StrictGatewayWait`。 |
| `openclaw-desktop\ASI-Hakua-Portal.ps1` | 上記へのラッパー（ショートカット互換）。                                                                                                                                                                 |
| `Start-Gateway.ps1`         | `OPENCLAW_CONFIG_PATH` + `.env` マージ後に `node scripts/run-node.mjs gateway`（子プロセスに `pnpm` が無い問題を回避）。                                                                                 |
| `Start-TUI.ps1`             | 同上で `node scripts/run-node.mjs tui`。                                                                                                                                                                 |
| `Start-Hypura-Harness.ps1`  | `uv run --project <repo-root> harness_daemon.py` を最優先（失敗時は venv / `py -3` フォールバック）。                                                                                                    |
| `start_ngrok.ps1`           | **リポジトリ内**の `bin\ngrok.exe` 等のみ使用（PATH のグローバル ngrok は使わない）。別場所なら `.env` に `NGROK_EXE=C:\full\path\ngrok.exe`。404 ポーリング → `.env` 更新。                             |
| `start-voicevox-engine.ps1` | `run.exe --host/--port` で ENGINE 起動 → `scripts/tools/verify_voicevox.py` で確認（`VOICEVOX_ENGINE_PATH`）。                                                                                           |
| `env-tools.ps1`             | `.env` と `.env.local` の読み書き・マージ（`Merge-OpenClawEnvToProcess`）。                                                                                                                              |
