# 実装ログ: Telegram 優先 ngrok 同期（worktree: clawdbot-main）

- **UTC 時刻（Python）**: `2026-04-05T02:52:38.744934+00:00`
- **目的**: `NGROK_UPSTREAM_URL=http://127.0.0.1:8787`（Telegram webhook リスナー）のとき、トンネル再利用判定を **8787** で行い、`.env` 同期で **`LINE_WEBHOOK_URL` を誤上書きしない**。

## 変更ファイル

| ファイル                                                      | 内容                                                                                                                                                                                                                     |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scripts/launchers/env-tools.ps1`                             | `Get-NgrokUpstreamTunnelMatchPort`, `Get-OpenClawTelegramWebhookListenPort`, `Test-NgrokSyncTelegramWebhookOnly`, `Build-NgrokWebhookEnvValues` を追加。`Sync-NgrokPublicUrlToEnv` に `-GatewayPort`、上記ビルダー利用。 |
| `scripts/launchers/start_ngrok.ps1`                           | 再利用・新規トンネル時とも `Build-NgrokWebhookEnvValues` を使用。`Get-ExistingNgrokPublicUrl` は上流ポートに合わせる。                                                                                                   |
| `scripts/launchers/openclaw-desktop/launch-desktop-stack.ps1` | 上流ポート ≠ Gateway のとき **120s** で TCP LISTEN 待ち。`Sync-NgrokPublicUrlToEnv -GatewayPort`。                                                                                                                       |
| `scripts/launchers/openclaw-desktop/Sovereign-Portal.ps1`     | 同上の待機 + `Sync-NgrokPublicUrlToEnv -GatewayPort`。                                                                                                                                                                   |
| `scripts/launchers/Start-Gateway.ps1`                         | `Sync-NgrokPublicUrlToEnv -GatewayPort $Port`。                                                                                                                                                                          |
| `.env.example` / `scripts/launchers/README.md`                | Telegram-first 時は LINE を同期しない旨を追記。                                                                                                                                                                          |

## ローカル設定（ユーザー作業）

- `.env` / `.openclaw-desktop\.env`: `NGROK_UPSTREAM_URL=http://127.0.0.1:8787`（Telegram 優先）— 反映済み。
- ngrok 認証: `%LOCALAPPDATA%\ngrok\ngrok.yml` に authtoken を保存済み（`ngrok config check` で検証）。トークンはコミットしない。

## 検証

- PowerShell で `NGROK_UPSTREAM_URL=8787` かつ `Build-NgrokWebhookEnvValues` が `LINE_WEBHOOK_URL` を含まないことを確認済み。
