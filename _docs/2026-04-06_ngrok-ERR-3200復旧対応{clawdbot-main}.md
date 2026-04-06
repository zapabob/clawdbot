# ngrok ERR_NGROK_3200 復旧対応ログ

- 実施日時 (UTC, MCP取得): `2026-04-06T08:54:16+00:00`
- 対象エンドポイント: `https://remedial-joline-unrash.ngrok-free.dev`
- 事象: `ERR_NGROK_3200 The endpoint ... is offline`

## 観測結果

1. `http://127.0.0.1:4040/api/tunnels` からはトンネル自体は見えていた。
2. そのトンネルの upstream は `http://127.0.0.1:8787`。
3. `8787` 側の待受が無く、`repair-ngrok-and-telegram-webhook.ps1` も `Upstream port :8787 did not become ready` で失敗。
4. つまり「ngrok URLは残っているが、上流アプリが死んでいる」状態。

## 根本原因（今回の切り分け）

- `.env` の `NGROK_UPSTREAM_URL=http://127.0.0.1:8787` が使われていた。
- 現在の実行状態では `:8787` リスナーが不在。
- そのため外部から見た endpoint は offline 扱いになりうる。

## 復旧手順（推奨）

1. まず Gateway を起動:
   - `powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/launchers/Start-Gateway.ps1" -Port 18789`
2. ngrok upstream を Gateway に合わせる:
   - 一時対応: `$env:NGROK_UPSTREAM_URL="http://127.0.0.1:18789"`
   - 恒久対応: `.env` の `NGROK_UPSTREAM_URL` を `http://127.0.0.1:18789` に更新
3. ngrok 再起動:
   - `powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/launchers/start_ngrok.ps1" -Port 18789 -ForceRestart`
4. Telegram webhook 再同期:
   - `powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/launchers/repair-ngrok-and-telegram-webhook.ps1" -Port 18789 -SkipGatewayStart`

## 備考

- 既存 URL が無料枠で変わる場合があるため、`4040/api/tunnels` で最新 `public_url` を確認して webhook を同期する。
- `Start-Gateway.ps1` が長時間戻らない場合は、`pnpm openclaw gateway run --port 18789 --bind loopback --force --allow-unconfigured` で直接起動ログ確認が有効。
