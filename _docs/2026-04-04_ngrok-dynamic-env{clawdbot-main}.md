# 実装ログ: ngrok 新URLと動的環境注入（desktop-stack）

- **日時**: 2026-04-04（UTC `py -3`: `2026-04-04T12:54:52+00:00`）
- **worktree**: `clawdbot-main`

## 目的

`launch-desktop-stack.ps1` で ngrok を起動した直後に TUI / Companion / Browser が **古い `OPENCLAW_PUBLIC_URL` なしの `$processEnv`** のまま走る問題を解消する。毎回 **新トンネル（`-ForceRestart`）** をデフォルトにし、親プロセスが **404 をポーリングして `.env` 同期後に `Get-MergedEnvMap` で `$processEnv` を再構築**してから後続を起動する。

## 変更ファイル

| ファイル                                     | 内容                                                                                                                                                                                                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scripts/launchers/env-tools.ps1`            | `Apply-NgrokWebhookEnvToFiles`: 同上キーを書く。Webhook パスは実装に合わせ **`/line/webhook`**（LINE）と **`/telegram-webhook`**（Telegram 既定）。旧 **`/hooks/line` / `/hooks/telegram` は誤り**（2026-04-04 修正）。                                                  |
| `scripts/launchers/start_ngrok.ps1`          | 上記ヘルパーに統一（再利用パス・新規トンネル確定後の両方）。                                                                                                                                                                                                             |
| `scripts/launchers/launch-desktop-stack.ps1` | `[switch]$NgrokReuse`（既定は新トンネル＝`-ForceRestart`）。ngrok 起動後 `Sync-NgrokPublicUrlToEnv -MaxWaitSeconds 90`、`Merge-OpenClawEnvToProcess`、`Build-DesktopStackProcessEnvTable` → `Apply-DesktopStackProcessEnvToCurrentSession` の順で **TUI より前**に注入。 |

## 使い方

- **毎回新しい ngrok URL（既定）**: そのまま `launch-desktop-stack.ps1` を実行。
- **既存トンネル再利用**: `-NgrokReuse` を付与（`start_ngrok.ps1` に `-ForceRestart` を渡さない）。

## CoTメモ（仮説→検証）

- **仮説**: 子の `start_ngrok.ps1` が `.env` を更新しても、親が既に組んだ `hashtable` は更新されない。
- **検証**: 親で `Sync-NgrokPublicUrlToEnv`（404 API）＋`Get-MergedEnvMap` 再読込で `OPENCLAW_PUBLIC_URL` が `processEnv` に乗ることを確認する設計。

## なんJ風一行

正直ここまでやるなら「URL出るまで待ってから TUI 投げろ」って話なんだけど、毎回フル URL 出し直すの地味に神だろ（小並感）
