# 実装ログ: Status型整合 バッチ計画 完了

- 実施日: `2026-04-06`
- worktree: `clawdbot-main`
- MCP現在日時(UTC): `2026-04-06T21:40:41+00:00`
- 実施ブランチ: `main`

## 実施内容

1. Batch A: `TableRenderer` / `TableColumn` 契約整合
   - `src/commands/status-all/text-report.ts`
   - `src/commands/status-all/report-tables.ts`
   - `src/commands/status.command.ts`
   - `src/commands/status.command-report-data.ts`

2. Batch B: `SummaryLike` / `MemoryLike` / `AgentStatusLike` 現行型追従
   - `src/commands/status.command-report-data.ts` の入力型を現行の `StatusSummary` / `MemoryStatusSnapshot` / `MemoryPluginStatus` / `AgentLocalStatus` 等に合わせて更新
   - `securityAudit` が未取得時のフォールバックを追加
   - `src/commands/status-all/report-data.ts` の `callOverrides` と `snap` nullability を修正

3. Batch C: status 系テスト fixture 追従
   - `src/commands/status.command-report-data.test.ts`
   - `src/commands/status.gateway-connection.test.ts`
   - `src/commands/status.scan-execute.test.ts`
   - `src/commands/status-json-payload.test.ts`

4. Batch D: 非 status 単発エラー修正
   - `extensions/discord/src/proxy-request-client.ts` の古い options フィールドを削除
   - `src/commands/health.command.coverage.test.ts` のモック関数シグネチャ調整
   - `src/gateway/sessions-history-http.test.ts` の transcript content 型修正
   - `src/infra/run-node.test.ts` の `withTempDir` 呼び出し引数を現行シグネチャへ修正
   - `src/security/audit-install-metadata.test.ts` / `src/security/audit-node-command-findings.test.ts` の判定分岐を union 安全化

## 検証

- 実行: `pnpm tsgo`
- 結果: **PASS**

## 備考

- 依頼された To-do 5件はすべて完了。
- 計画ファイル本体 (`status-type-alignment-batches_78e32b95.plan.md`) は未編集。
