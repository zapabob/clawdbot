# 実装ログ: Gateway Windows dist-runtime パス解決（clawdbot-main）

- **UTC**: 2026-04-05T14:38:39+00:00（`py -3` で取得）
- **現象**: `gateway-20260405-233121.log` でバンドルチャンネル大量ロード失敗 → `RangeError: Maximum call stack size exceeded` → code 1
- **なんJ風メモ**: ログ見たらテレグラムとか全部スタック吹っ飛びワロタ、てか `dist-runtime` の薄皮indexがjiti経由だと地獄る説ガチだったわ
- **CoT（仮説→検証）**:
  1. 仮説: `resolveCompiledBundledModulePath` が `path.sep` 固定置換で、混在スラッシュだと `dist` に直せず **ラッパー** を読む
  2. 検証: `dist-runtime/extensions/*/index.js` が `export * from "../../../dist/..."` 形式であることを確認
  3. 結論: 区切り非依存の `([\\/])dist-runtime([\\/])` 置換に変更し、常に `dist` 実体を jiti が食うようにする
- **変更**: `src/channels/plugins/bundled-dist-runtime-path.ts` 追加、`bundled.ts` から利用、`bundled-dist-runtime-path.test.ts` で回帰テスト
- **ゲート**: `pnpm test -- src/channels/plugins/bundled-dist-runtime-path.test.ts` 緑

Rust ビルド: 本件未使用（TypeScript のみ）。
