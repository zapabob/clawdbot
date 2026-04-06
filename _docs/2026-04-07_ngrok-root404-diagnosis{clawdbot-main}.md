# 実装ログ: ngrok root 404 診断 {clawdbot-main}

## 概要

- 事象: `https://remedial-joline-unrash.ngrok-free.dev/?token=${OPENCLAW_GATEWAY_TOKEN}` で `HTTP 404`
- 結論: トンネル断ではなく、`/` ルートの公開経路と認証URLの使い方が原因

## 実施した確認

1. ngrok プロセス確認
   - `ngrok` は既に起動済み（重複起動なし）

2. `4040/api/tunnels` 整合確認
   - `public_url`: `https://remedial-joline-unrash.ngrok-free.dev`
   - `upstream`: `http://127.0.0.1:8787`
   - `proto`: `https`

3. 疎通確認（HTTPステータス）
   - `http://127.0.0.1:18789/` → `200`
   - `http://127.0.0.1:18789/healthz` → `200`
   - `https://remedial-joline-unrash.ngrok-free.dev/` → `404`
   - `https://remedial-joline-unrash.ngrok-free.dev/healthz` → `200`

## 判断

- `public_healthz=200` のため、ngrok トンネル自体は正常
- `public_root=404` のため、公開ルート `/` は現在の upstream 構成では対象外
- `?token=${OPENCLAW_GATEWAY_TOKEN}` はプレースホルダ文字列のままなので使用不可

## 推奨運用

- ダッシュボードURLは手打ちせず、`pnpm openclaw dashboard --no-open` の出力を使用
- トークンは `?token=` ではなく `#token=` を優先
- 健全性確認は `https://<ngrok-host>/healthz` を基準にする

## Caption (English)

**Figure:** ngrok tunnel health is normal (`/healthz=200`) while public root returns `404`, indicating route mismatch rather than tunnel outage.
