# 実装ログ: LINE config warning fix

- 実施日時: 2026-03-24 22:27:31+09:00
- 対象: `.openclaw-desktop/openclaw.json`
- 目的: LINE チャンネル設定の未定義環境変数警告を解消

## 変更内容

`channels.line` の以下を修正。

- `webhookPath`: `${LINE_WEBHOOK_PATH}` -> `/line/webhook`
- `webhookServerUrl`: 設定項目を削除（未定義 env var 参照を除去）
- `dmPolicy`: `${LINE_DM_POLICY}` -> `pairing`

## 検証

- `.openclaw-desktop/openclaw.json` 内で `LINE_WEBHOOK_PATH` / `LINE_WEBHOOK_URL` / `LINE_DM_POLICY` の参照が残っていないことを確認。

## 備考

- `channelAccessToken` / `channelSecret` は引き続き `LINE_CHANNEL_ACCESS_TOKEN` / `LINE_CHANNEL_SECRET` の環境変数参照を使用。
- LINE webhook のデフォルトパスはプラグイン実装上 `/line/webhook`。
