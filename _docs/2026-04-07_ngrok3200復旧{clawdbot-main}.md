# ngrok ERR_NGROK_3200 復旧ログ

- 実施日時(UTC, MCP): 2026-04-06T15:45:51+00:00
- 対象ワークツリー: `clawdbot-main`
- 事象: `ERR_NGROK_3200` (`remedial-joline-unrash.ngrok-free.dev is offline`)

## 観測

- ngrok ローカル API (`http://127.0.0.1:4040/api/tunnels`) ではトンネル自体は存在。
- 上流は `http://127.0.0.1:8787` に向いていた。
- 失敗ログは「upstream が 90 秒以内に応答しない」状態。

## 実施内容

1. `scripts/launchers/start_ngrok.ps1` と `scripts/launchers/repair-ngrok-and-telegram-webhook.ps1` の動作を確認。
2. `repair-ngrok-and-telegram-webhook.ps1` を実行し、Gateway/Ngrok/Webhook を一括リカバリ。
3. Telegram `setWebhook` / `getWebhookInfo` の成功を確認。
4. 公開 URL への HTTP 応答を確認 (`404` 応答=到達可、offline ではない)。

## 実行コマンド

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/launchers/repair-ngrok-and-telegram-webhook.ps1" -Port 18789 -GatewayWaitSeconds 60 -TunnelWaitSeconds 40
```

## 結果

- `repair` スクリプトは `SUCCESS` で完了。
- `OPENCLAW_PUBLIC_URL` と `TELEGRAM_WEBHOOK_URL` は再同期済み。
- ngrok endpoint は offline ではなく、HTTP 応答あり。

## 再発防止メモ

- Telegram webhook 運用時は `8787` の待受状態を先に確認する。
- 起動順は `Gateway/Telegram listener -> ngrok -> setWebhook` を維持する。
- 失敗時は one-shot で `repair-ngrok-and-telegram-webhook.ps1` を優先実行する。
