# 2026-03-31 Build Error Fix Log

- Date: 2026-03-31T16:06:14+09:00
- Branch: `main`
- Scope: `pnpm build` 実行時に発生した VRChat OSC ブリッジ参照エラーと memory-evolution 初期化エラーの修正

## 実装内容

1. VRChat OSC Python ブリッジパスの堅牢化
   - `src/metaverse/vrchat-core.ts`
   - `scripts/osc_chatbox.py` と `scripts/tools/osc_chatbox.py` の両方を探索する `resolveOscScriptPath()` を追加。
   - 既存のハードコードパス参照を上記ヘルパーへ置換。

2. ステータス表示整合性の修正
   - `src/gateway/server-methods/vrchat.ts`
   - `vrchat.status` の `bridge` 表示を `scripts/tools/osc_chatbox.py` に更新。

3. vrchat-relay 側スクリプト探索の強化
   - `extensions/vrchat-relay/src/tools/chatbox-enhanced.ts`
   - src/dist/cwd それぞれで `scripts/tools/osc_chatbox.py` 優先、旧 `scripts/osc_chatbox.py` を後方互換フォールバックに変更。

4. memory-evolution 初期化ガード
   - `extensions/memory-evolution/index.ts`
   - `api.runtime?.config?.loadConfig` を安全呼び出し化し、未提供時は `process.cwd()` へフォールバック。
   - `register` 時の `Cannot read properties of undefined (reading 'loadConfig')` クラッシュを回避。

## 検証結果

- `pnpm build` を実行し、従来の `scripts/osc_chatbox.py` 不在エラーは再現しないことを確認。
- 実行ログ上で `vrchat-relay` が `Chatbox sent` を出力し、Python 側送信失敗が解消したことを確認。
- `pnpm build` 中に `OSC listener error: EADDRINUSE 0.0.0.0:9001` が発生（ポート競合。今回の修正対象外）。
- 追加確認として `pnpm build:plugin-sdk:dts` は成功。
- 編集対象4ファイルで linter エラーなし。

## MCP日時取得について

- MCP サーバー経由で日時取得を試行:
  - server: `plugin-meta-quest-agentic-tools-hzdb`
  - tool: `hex_to_datetime`
  - result: `Not connected`
- 接続不可のため、ログ記録時刻はローカル環境の `Get-Date` 出力を使用。
