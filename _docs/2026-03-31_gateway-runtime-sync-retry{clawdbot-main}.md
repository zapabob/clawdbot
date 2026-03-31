# Gateway 起動失敗（ランタイム成果物同期）対応

**日付**: 2026-03-31  
**ワークツリー**: clawdbot-main

## 現象

`logs/launcher/gateway-*.log` に以下が出て Gateway が即終了（exit 1）。

- `[openclaw] Building TypeScript (dist is stale).`
- `Failed to write runtime build artifacts: EPIPE, The process cannot access the file because it is being used by another process.`  
  例: `dist/extensions/open-prose/.../*.prose`

## 原因（仮説→検証）

1. **仮説**: `dist` のビルドスタンプよりソースが新しく、`run-node.mjs` が起動時に `tsdown` でビルド → 直後の `runRuntimePostBuild()` が `dist` へ大量コピー。Windows ではアンチウイルス・インデクサ・別の Node（watch）が同一ファイルを掴むと `EPIPE` / `EBUSY` 相当で失敗しうる。
2. **検証**: 最新ログで上記メッセージと対象パスを確認。コード上 `syncRuntimeArtifacts` は単発 `try/catch` で即失敗していた。

## 対応

- `scripts/run-node.mjs` の `syncRuntimeArtifacts` を **非同期化**し、`runRuntimePostBuild` 失敗時に **最大 6 回・バックオフ付き再試行**（`EPIPE` / `EPERM` / `EBUSY` および「being used by another process」メッセージを一時エラーとして扱う）。
- 単体テスト: `pnpm exec vitest run src/infra/run-node.test.ts` — 通過。

## 運用上の補足（ユーザー向け）

- 起動前に **`pnpm build`** を一度走らせて `dist` を最新にしておくと、ランタイムビルド経路に入りにくくなる。
- 同じリポジトリで **複数の Gateway / `pnpm dev` / watch** を同時に動かすとロックが再発しやすい。

## 参照

- `scripts/launchers/Start-Gateway.ps1` — ログ出力先 `logs/launcher/`（`OPENCLAW_USE_REPO_LAUNCHER=0` のときは `.openclaw-desktop/logs`）。
