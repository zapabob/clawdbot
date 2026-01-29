# TypeScript 型定義エラー修正 (2026-01-29)

## 概要

`tsc --noEmit` で発生していたTypeScriptの型エラーを全て解消し、ビルドが正常に完了するようにした。

## 修正されたエラー

### 1. 型定義ファイルの更新 (`src/types.d.ts`)

- `chokidar` の `FSWatcher` 型をエクスポート
- `@clack/prompts` の `select` と `multiselect` をジェネリックに変更
- `isCancel` を型ガード関数に変更

### 2. 暗黙的 `any` 型エラーの修正

| ファイル                            | 行                         | 修正内容                        |
| ----------------------------------- | -------------------------- | ------------------------------- |
| `src/commands/reset.ts`             | 34, 101                    | `opt: any`, `scope!` 非null断言 |
| `src/commands/uninstall.ts`         | 34                         | `opt: any`                      |
| `src/commands/models/scan.ts`       | 22                         | `opt: any`                      |
| `src/commands/models/auth.ts`       | 46, 88, 131, 171, 203, 216 | `opt: any`, `value: any`        |
| `src/commands/doctor-prompter.ts`   | 56, 60, 75, 86             | `p: any`, `opt: any`            |
| `src/commands/configure.wizard.ts`  | 360, 482                   | `value: any`                    |
| `src/commands/configure.gateway.ts` | 24, 70, 76, 185            | `value: any`, `part: any`       |
| `src/commands/configure.shared.ts`  | 74                         | `opt: any`                      |
| `src/cli/update-cli.ts`             | 505                        | `opt: any`                      |
| `src/canvas-host/server.ts`         | 291                        | `err: unknown`                  |
| `src/agents/skills/refresh.ts`      | 159-162                    | `p: string`, `err: unknown`     |
| `src/gateway/config-reload.ts`      | 352                        | `err: unknown`                  |

### 3. 不足エクスポートの追加

| ファイル                | 追加した関数                                      |
| ----------------------- | ------------------------------------------------- |
| `src/logging/redact.ts` | `redactToolDetail`                                |
| `src/line/webhook.ts`   | `createLineWebhookMiddleware`, `startLineWebhook` |

## 検証結果

```bash
npx tsc --noEmit
# Exit code: 0 (成功)
# エラー数: 0
```

## 影響範囲

- 型定義のみの変更
- ランタイム動作に影響なし
- 機能は維持したまま型安全性を向上

## 関連ファイル

- `src/types.d.ts`
- `src/commands/*.ts`
- `src/agents/*.ts`
- `src/logging/redact.ts`
- `src/line/*.ts`
