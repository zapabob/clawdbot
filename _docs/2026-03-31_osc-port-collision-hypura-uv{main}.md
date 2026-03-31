# 2026-03-31 OSC Port Collision + Hypura UV Log

- Date: 2026-03-31T16:20:21+09:00
- Branch: `main`
- Scope: VRChat OSC 9000/9001 運用整理、9001 競合耐性、Hypura/relay の Python 実行を uv 優先へ統一

## 変更内容

1. 9001 競合 (`EADDRINUSE`) の非致命ハンドリング
   - `extensions/vrchat-relay/src/osc/client.ts`
     - listener error で `EADDRINUSE` を検知した場合、スタックを吐かず警告ログ化し、ローカル bind を閉じて継続。
     - `lastListenerError` と `getLastListenerError()` を追加。
   - `extensions/vrchat-relay/src/tools/listener.ts`
     - `EADDRINUSE` 状態を「既存 listener を利用する」扱いにして成功応答（warning 付き）で返却。
   - `extensions/vrchat-relay/index.ts`
     - autostart 時、9001 競合は `console.warn` で明示しつつ継続。

2. 9000/9001 の役割明文化（後方互換維持）
   - `extensions/vrchat-relay/openclaw.plugin.json`
     - `outgoingPort`: `sendPort` として VRChat 受信側（通常 9000）へ送信する説明に変更。
     - `incomingPort`: `listenPort` として VRChat 送信を受ける側（通常 9001）と明記。
   - `extensions/vrchat-relay/index.ts`
     - 起動時ログで `sendPort`/`listenPort` を明示出力。

3. Python 実行経路の uv 優先化
   - `extensions/vrchat-relay/src/tools/chatbox-enhanced.ts`
     - `uv run --project <repo-root> python ...` を第一候補に変更。
     - uv 実行失敗時のみ `py -3` をフォールバック。
   - `scripts/launchers/Start-Hypura-Harness.ps1`
     - `uv run --project $ProjectDir harness_daemon.py` に統一。
   - `scripts/launchers/README.md`
     - uv 優先 + fallback 方針に合わせて説明更新。

## 検証

- `pnpm build` 実行で以下を確認:
  - 以前の `scripts/osc_chatbox.py` 不在エラーは再発なし。
  - relay の chatbox 送信は成功（`[vrchat-relay] Chatbox sent ...`）。
  - この実行では `EADDRINUSE:9001` は再現せず（少なくとも build 中の新規退行はなし）。
- `scripts/launchers/README.md` の markdown lint warning を解消済み。

## MCP 日時取得

- MCP 経由取得を再試行:
  - server: `plugin-meta-quest-agentic-tools-hzdb`
  - tool: `hex_to_datetime`
  - result: `Not connected`
- 接続不可のため、時刻はローカル `Get-Date` を採用。
