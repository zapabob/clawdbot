# 開発・運用ログ: 起動シーケンスの非同期化とLINEボットWebhook修正

- **日付**: 2026-03-04
- **実装AI名**: Antigravity
- **対象機能**: `hakua-init.ps1` の起動シーケンス、OpenClawコアモデル設定、LINEボットWebhook連動

## 概要

OpenClawのデスクトップ起動時におけるクラッシュ問題の解決、Ollama GPUモデル（`qwen3.5:9b`）のコア適用、およびLINEボットのメッセージ返信が機能しない問題の修正を行いました。

## 修正内容

### 1. LINE ボットの Webhook 動的注入

LINEのメッセージリプライが適切にフックされていなかった原因は、`hakua-init.ps1` が ngrok のURLを `.env`（`WEBHOOK_BASE_URL`）にしか出力しておらず、V2026.3以降の `openclaw.json` (channels.line.webhookServerUrl) に反映されていなかったためです。

- **実装**: `hakua-init.ps1` の処理にJSONパースを追加し、起動時に取得したngrok URLを `openclaw.json` の `channels.line.webhookServerUrl` に直接・動的に上書き注入するロジックを実装しました。これによりLINEリプライが正常に届くようになりました。

### 2. コアAIモデルの変更 (qwen3.5:9b GPU仕様)

- **実装**: `~/.openclaw/openclaw.json` を編集し、プライマリモデルおよび自律ハートビートモデルを `ollama/qwen3.5:9b` に変更。Ollamaに搭載されているためGPUで推論処理が実行される構成に移行完了しました。

### 3. CLIおよびBrowser (Canvas)の非同期・待機起動

「デスクトップショートカットを押しても反応しない」「CLIとブラウザを同時起動すると落ちる」問題を解決しました。

- **原因**: `package.json` の `start` に引数が不足していたこと、および起動時にバックグラウンドGatewayとUIプロセスが同一ポート・プロセス競合を引き起こしていたため。
- **実装**:
  - `start` コマンドを `node scripts/run-node.mjs gateway` に適正化。
  - `hakua-init.ps1` にて、Gatewayを裏で立ち上げたのち、別プロセスのHidden PowerShellを使って「2秒後にCLI (tui)を立ち上げ」「さらに3秒後にブラウザ (Canvas)を立ち上げる」**非同期デタッチジョブ**を実行しました。
  - これによりメインのPowerShellは即座に終了し、ユーザーの待ち時間をゼロにしつつ、クラッシュを防ぎ両UIが遅延起動する設計としました。

## 特記事項・申し送り

- `SOUL.md` の要求（Oversight、Parental Protection、動的同期、LINE優先対応）に準拠した構成。
- `ACOPEX` (acpx) プラグインは `openclaw.json` 上では有効（allow/entries）になっており、今回CLI/Browserの連動により手動でも制御可能です。追加のセットアップが必要な場合は、次回セッションでの引き継ぎ作業とします。

**ログ保存**: ガイドラインに則り完了。
**安全確認**: 危険なシェルコマンド排除済、ログ出力遵守。
ASI_ACCEL.
