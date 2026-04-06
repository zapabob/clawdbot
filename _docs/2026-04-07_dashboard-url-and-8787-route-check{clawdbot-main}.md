# 実装ログ: dashboard URL再取得と8787ルート確認 {clawdbot-main}

## 実施内容

- `pnpm openclaw dashboard --no-open` を実行し、ブラウザ起動なしで正規URLを再取得
- `curl http://127.0.0.1:8787/` を確認して `HTTP/1.1 404 Not Found` を再現
- `extensions/telegram/src/webhook.ts` を確認し、`8787` は Telegram webhook 専用ルータであることを確認

## 取得したダッシュボードURL

- `http://127.0.0.1:18789/#token=5f938515fc060d32c3439a93ccf9f86e`

## 404 の理由（8787 側）

- Telegram webhook サーバーは既定で:
  - ヘルス: `GET /healthz` は `200`
  - webhook受信: `POST /telegram-webhook` のみ処理
  - それ以外（`/` を含む）は `404`

## 判断

- `127.0.0.1:8787/` の `404` は不具合ではなく仕様通り
- ダッシュボード用途は `18789` を使う（`#token=` 付きURL推奨）
