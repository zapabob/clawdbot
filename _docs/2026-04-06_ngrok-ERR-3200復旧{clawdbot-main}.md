# ngrok ERR_NGROK_3200 復旧ログ

- 日時 (JST): 2026-04-06
- 対象エンドポイント: `https://remedial-joline-unrash.ngrok-free.dev`
- 事象: `ERR_NGROK_3200` / endpoint offline

## 事実確認

1. `ngrok` プロセスは起動中。
2. `http://127.0.0.1:4040/api/tunnels` でトンネルは存在。
3. トンネル上流は `http://127.0.0.1:8787`。
4. ローカル `POST http://127.0.0.1:8787/telegram-webhook` は `401` 応答を確認 (到達自体は成功)。

## 判定

- `ERR_NGROK_3200` は「URLそのものの永久死」ではなく、次のどちらかで発生しやすい:
  - 一時的に ngrok セッションが切れて endpoint が offline 扱いになった
  - 参照している URL が旧トンネルのもの (再起動で URL が差し替わった)

## 復旧手順 (運用)

1. Gateway 起動確認:
   - `scripts\launchers\Start-Gateway.ps1 -Port 18789`
2. ngrok 再作成:
   - `scripts\launchers\start_ngrok.ps1 -Port 18789 -ForceRestart`
3. 現在URL確認:
   - `Invoke-RestMethod http://127.0.0.1:4040/api/tunnels | ConvertTo-Json -Depth 8`
4. `public_url` を Telegram webhook 設定へ再反映。

## 補足

- `openclaw.json` では Gateway ポートは `18789`。
- Telegram webhook リスナーは `8787` 側で受ける構成になりうるため、ngrok 側の `addr` と実際のリスナーを常に一致させること。

## 固定化 (1発復旧スクリプト)

- 追加: `scripts/launchers/repair-ngrok-and-telegram-webhook.ps1`
- 処理内容:
  1. 必要時のみ Gateway を起動
  2. `start_ngrok.ps1 -ForceRestart` をバックグラウンド起動
  3. `4040/api/tunnels` から `public_url` を取得して `.env` / `.openclaw-desktop/.env` を同期
  4. Telegram `setWebhook` 実行
  5. Telegram `getWebhookInfo` で一致検証

- 実行コマンド:
  - `.\scripts\launchers\repair-ngrok-and-telegram-webhook.ps1 -Port 18789`

- 実測結果:
  - `OPENCLAW_PUBLIC_URL=https://remedial-joline-unrash.ngrok-free.dev`
  - `TELEGRAM_WEBHOOK_URL=https://remedial-joline-unrash.ngrok-free.dev/telegram-webhook`
  - `Telegram last_error_message` は空

## MCP 時刻記録

- MCP (`plugin-meta-quest-agentic-tools-hzdb` の `hex_to_datetime`) 取得 UTC:
  - `2026-04-06T07:38:31+00:00`

## 起動メニュー統合

- `gateway.cmd` に `repair-webhook` サブコマンドを追加。
  - 実行例: `gateway.cmd repair-webhook -NgrokUpstreamWaitSeconds 2`
- `scripts/launchers/openclaw-desktop/Sovereign-Portal.ps1` のメニューへ `7` を追加。
  - `7` 選択で `repair-ngrok-and-telegram-webhook.ps1` を直接実行し、復旧完了後に終了。
- 検証結果:
  - `gateway.cmd repair-webhook` 実行で `SUCCESS` を確認。
  - `Sovereign-Portal.ps1 -Mode RepairWebhook` 実行で `SUCCESS` を確認。

## MCP 時刻記録（メニュー統合後）

- MCP (`plugin-meta-quest-agentic-tools-hzdb` の `hex_to_datetime`) 取得 UTC:
  - `2026-04-06T07:48:50+00:00`
