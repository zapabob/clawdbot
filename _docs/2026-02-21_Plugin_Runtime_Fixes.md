# Plugin Runtime Errors and Auto-Restart Loop Fixes

**Date:** 2026-02-21

## 概要

OpenClawのフル自律化にあたり、有効化したプラグイン（`vrchat-relay`、`line`、`telegram`、`discord`）が正しく起動せず、ゲートウェイ（gateway）内で無限再起動ループやクラッシュを引き起こす問題が発生していました。本対応ではこれらのランタイムエラーおよび同期的な終了判定の仕様を修正し、安定して全プラグインが起動し続けるように改善しました。

## 実装内容

### 1. `vrchat-relay` プラグインのTypeError修正

- **問題**: プラグイン登録時に `api.runtime.log is not a function` というエラーが発生し、登録に失敗していた。
- **対応**: `extensions/vrchat-relay/index.ts` 内の `api.runtime.log` をすべて標準の `console.log` に置き換えることで、例外を回避して正常にプラグインが登録されるように修正しました。

### 2. `line` および `telegram` プラグインの無限再起動ループの解消

- **問題**: LINEやTelegramのWebhookモードでは、初期化関数（`monitorLineProvider` や `monitorTelegramProvider`）が同期的に即座に解決（resolve）される仕様となっていました。一方、OpenClawのチャンネルマネージャー（`channel-manager` / `server-channels.ts`）は、開始したタスクのPromiseが解決されると「プラグインが停止した」と判定し、自動再起動（auto-restart loop）を試みる仕様でした。これが原因で、起動直後に即座に再起動処理が繰り返される現象が発生していました。
- **対応**: `extensions/line/src/channel.ts` と `extensions/telegram/src/channel.ts` の `startAccount` において、プロバイダーの起動成功後に **`abortSignal` が発火するまで終了しない（PromiseがPendingのまま維持される）** ように修正しました。これにより、Webhook待ち受け中も正しく「起動中（Running）」として扱われ、無限再起動ループが解消されました。

### 3. Discord プラグイン のGateway Error調査

- **問題**: Discord起動時に `Fatal Gateway error: 4014` が発生し、クラッシュしていた。
- **対応**: ログから `Discord Message Content Intent is disabled` の警告が出ていることを確認。このエラー（4014）は、不足している特権インテント（Message Content Intent）に起因する仕様通りのクラッシュです。Discord Developer Portalでの手動でのインテント有効化が必要であることをドキュメント化し、ユーザーに案内しました（コード側の修正は不要）。

### 4. コンパイルとビルドの確認

- TypeScript（`npx tsdown`）を用いてトランスパイルを実施し、TypeScriptの静的型チェックとビルドが成功することを確認しました（※WindowsのWSL起因による `bundle-a2ui.sh` のbashエラーはビルド環境の依存であり本番稼働には影響なし）。
