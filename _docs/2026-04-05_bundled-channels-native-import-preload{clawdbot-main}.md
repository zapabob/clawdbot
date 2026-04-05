# 実装ログ: バンドルチャンネル jiti 回避 + 起動時プリロード

**日付**: 2026-04-05  
**ワークツリー**: clawdbot-main

## 概要

- `dist/extensions/**` のビルド済み `*.js` / `*.mjs` エントリは `pathToFileURL` 経由の素の動的 `import` で読み込み、jiti の変換パイプラインに載せない（AJV 系の深い生成コードでのスタック枯渇回避）。
- `ensureBundledChannelPluginsLoaded()` でキャッシュを構築。`startGatewayServer` 先頭と CLI 経路（`run-main` / `route`）、Vitest `test/setup.shared.ts` で先に `await`。
- `minimalEmpty` / `VITEST` + `OPENCLAW_TEST_MINIMAL_GATEWAY` では空レジストリをキャッシュ。
- `clearBootstrapChannelPluginCache` から `clearBundledChannelPluginsCache` を呼び、bootstrap と bundled の不整合を防ぐ。
- モジュール評価時に `listBootstrapChannelPlugins()` を踏んでいた **`markdown-tables` の `DEFAULT_TABLE_MODES` 定数**と **`SECRET_TARGET_REGISTRY` 定数**を遅延初期化（`getDefaultTableModes` / `getSecretTargetRegistry` + `target-registry-query` の遅延インデックス）に変更。

## 検証メモ

- 関連 Vitest と `pnpm check` をローカルで実行すること。
- `shouldUseNativeImportForBundledChannelEntry` を `bundled.ts` からエクスポートし、`bundled-native-import.test.ts` でパス分岐（`dist/extensions` + `.js`/`.mjs`）を単体検証。
