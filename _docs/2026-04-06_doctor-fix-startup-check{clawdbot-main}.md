# 実装ログ: doctor fix startup check

- 実施日: 2026-04-06
- MCP取得時刻 (UTC): 2026-04-06T16:18:37+00:00
- 対象ワークツリー: `clawdbot-main`

## 実行内容

1. `pnpm openclaw --profile desktop-stack doctor --fix`
2. `pnpm openclaw --profile desktop-stack status`

## 結果

- `doctor --fix` は legacy key の移行を実施し、`~/.openclaw/openclaw.json` を更新
  - `channels.telegram.streaming (scalar) -> channels.telegram.streaming.mode`
  - `channels.discord.streaming (scalar) -> channels.discord.streaming.mode`
  - `channels.slack.streaming (scalar) -> channels.slack.streaming.mode`
  - `channels.slack.nativeStreaming -> channels.slack.streaming.nativeTransport`
- `status` は表示完了まで到達し、`Config invalid (legacy key)` エラーは解消
- ただし gateway は `unauthorized: gateway token mismatch` で未疎通

## 観測した別件

- `scripts/run-node.mjs` 側で `ReferenceError: normalizeCliExitCode is not defined` が発生
  - `doctor --fix` の処理自体は完走後にこの例外で終了コード 1 になる挙動
- `status` は VRChat relay の常駐ログ出力で終了待ちが長引いたため、確認後にプロセス停止

## フォローアップ実施結果

- gateway トークン不一致は解消済み（`desktop-stack` で gateway 再起動後、`status` で `reachable/auth token` を確認）
- `scripts/run-node.mjs` の `normalizeCliExitCode` 参照漏れは修正済み（`doctor --fix` 再実行で `ReferenceError` 非再発）
- 詳細ログ: `_docs/2026-04-07_exitcode-gateway-startup-check{clawdbot-main}.md`
