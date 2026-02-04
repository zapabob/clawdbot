# 2026-02-02 Tailscale経由LINE双方向通信（OpenClaw Gateway）

## 目的
- OpenClaw Gateway を Tailscale 上で公開し、LINE から Codex / GeminiCLI / Opencode / OpenClaw に双方向通信できるようにする。

## 方針
- OpenClaw Gateway を Tailscale の `serve` で HTTPS 公開。
- LINE Webhook を Tailscale の公開 URL に設定。
- 送信は OpenClaw 経由で実施（LINE送信 API を OpenClaw が代理）。

## 実施状況
- Gateway のオンライン確認：LINE: ok（`openclaw health`）
- MagicDNS: `downl.taile4f666.ts.net`
- `tailscale serve --bg http://127.0.0.1:18789` を実行し、公開開始
- 公開URL: `https://downl.taile4f666.ts.net/`
- HTTPS 200 応答を確認
- `tailscale funnel --bg http://127.0.0.1:18789` を実行し、インターネット公開を有効化

## 未完了（要対応）
- LINE Webhook を `https://downl.taile4f666.ts.net/webhooks/line` に設定

## 次のアクション
- LINE Webhook URL を更新
- `openclaw channels status --probe` で疎通確認
