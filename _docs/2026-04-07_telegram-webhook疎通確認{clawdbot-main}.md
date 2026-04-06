# Telegram Webhook 疎通確認ログ

- 実施日時(UTC, MCP): 2026-04-06T15:49:52+00:00
- 対象ワークツリー: `clawdbot-main`
- 対象 URL:
  - `https://remedial-joline-unrash.ngrok-free.dev/telegram-webhook`
  - `http://127.0.0.1:8787/telegram-webhook`

## チェック結果

- `GET` (ngrok): `404`
- `GET` (local): `404`
- `POST` (secret なし, ngrok): `401`
- `POST` (secret なし, local): `401`
- `POST` (secret あり, ngrok): `400`
- `POST` (secret あり, local): `400`

## 判定

- ngrok 経路とローカル経路の両方で同一傾向を確認できたため、ルーティング/到達性は正常。
- `401` は secret ヘッダー必須の想定どおり。
- `400` は secret まで通過後にペイロード検証で弾かれた状態で、認証関門と経路自体は生存。

## 補足

- 実運用の最終確認は Telegram 側の `setWebhook/getWebhookInfo` と実メッセージ受信で行う。

## 最終疎通テスト (本番同等 getUpdates 形式)

- 実施日時(UTC, MCP): 2026-04-06T15:54:14+00:00
- 生成方法: `py -3` で Telegram `Update` 互換 JSON を作成し、`curl --data-binary` で送信
- 送信ペイロード要点:
  - `update_id`
  - `message.message_id`
  - `message.date`
  - `message.chat` (`id`, `type`, `first_name`)
  - `message.from` (`id`, `is_bot`, `first_name`, `language_code`)
  - `message.text`
- 結果:
  - `POST` (secret あり, local): `200`
  - `POST` (secret あり, ngrok): `200`

=> `400` は経路問題ではなく、先行テスト時の送信 JSON 形式/送信方法起因。最終疎通は正常。
