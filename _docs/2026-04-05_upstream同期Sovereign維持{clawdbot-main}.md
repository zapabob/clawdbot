# 実装ログ: upstream/main 同期と Sovereign 独自維持（worktree: clawdbot-main）

**日付 (UTC 基準)**: 2026-04-05  
**ブランチ**: `integrate/upstream-main-2026-04-05`（`main` から作成）

## なんJ風サマリ

公式 `openclaw/openclaw` の `upstream/main` をガッツリ取り込んだ。コンフリクトは「公式寄せ」と「はくあ側の魂」を手で煮込み。型検査は `OPENCLAW_LOCAL_CHECK=0` で並列寄り、`pnpm check` まで通した。フル `pnpm build` はこの環境だと `vendor/a2ui/...` 不在で A2UI バンドルがコケるから、そこは「ローカル要因」として切り分けた。コミットは親フラグ `--no-verify` 指定どおり（フックは手動で `pnpm check` 済み）。

## 取り込み範囲

- `git fetch upstream --prune` 後、`main` に対して `git merge upstream/main`（`-X theirs` は使わず衝突を可視化）。
- merge-base 例: `00a49fe8b4...` 付近から `upstream/main` の `78fe96f2d4...` までの公式差分を包含。

## 衝突解決方針

| 領域                             | 方針                                                                                                                                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `merge-conflict-strategies.json` | 今回のパス用ルールを追加（復元ドキュメント、プラグイン/テスト類は `theirs` / `upstream_delete` 等）                                                                                                               |
| `resolve-merge-conflicts.py`     | 実行済み（`tasks.test.ts` で一度 `exit 128` → 手動 `git checkout upstream/main --` で完了）                                                                                                                       |
| `CHANGELOG.md`                   | Breaking / Fixes で **公式 + フォーク独自** の箇条書きを両方残すよう手マージ                                                                                                                                      |
| `AGENTS.md`                      | 上流の Architecture / i18n ガイドを **Ghost Protocol 前** に挿入し、Sovereign 本文は維持                                                                                                                          |
| `src/agents/system-prompt.ts`    | 公式の `sortContextFilesForPrompt` / `buildProjectContextSection` を採用し、SOUL 説明は `buildProjectContextSection` 内の文言を Sovereign 向けに強化                                                              |
| `docs/web/tui.md`                | 上流の表現 + フォークの `chat.history` タイムアウト節を維持                                                                                                                                                       |
| `src/gateway/server-methods.ts`  | **公式版をベース**に `withPluginRuntimeGatewayRequestScope` 等を採用し、**`vrchatHandlers` だけフォークで維持**（browserHandlers は上流で `webHandlers` 側に統合済み）                                            |
| `src/plugins/types.ts`           | merge 由来の **重複 `PluginHookBeforeInstall*` ブロックを削除**                                                                                                                                                   |
| 拡張の追随                       | hypura: `resolveOllamaApiBase` を `../ollama/api.js` へ。LINE push: `openclaw/plugin-sdk/line-runtime` + `accounts`。ACPX: 削除された `codexHarness` 参照を除去。auto-agent: Zen フォールバック配列の型を絞り込み |

## Sovereign ツール表示

- `control_companion` / `trigger_hakua_defense` / `trigger_world_monitor` の **tool-display メタ**を `src/agents/tool-display-config.ts` に追加。
- `pnpm tool-display:write` で `apps/shared/OpenClawKit/.../tool-display.json` を更新。

## 検証コマンド（実施済み）

```powershell
$env:OPENCLAW_LOCAL_CHECK = '0'
$env:GOMAXPROCS = '12'   # ヒント（tsgo/oxlint が並列利用）
pnpm install
pnpm tsgo
pnpm check
pnpm test -- src/agents/opencode-zen-free-rotation.test.ts -t "rotates"
```

- **`pnpm build`**: `pnpm canvas:a2ui:bundle` → `vendor/a2ui/renderers/lit/tsconfig.json` 不在で失敗（リポジトリのオプショナル A2UI ベンダー未チェックアウトと判断）。

## Git

- マージ完了後: `git commit --no-verify` でマージコミット（ユーザー指定）。
- プッシュ先: `origin` の `integrate/upstream-main-2026-04-05` を想定。

## CoT メモ（仮説→検証）

1. **仮説**: `upstream_merge.py` の公式一択だと Sovereign 差分が消える。**検証**: 衝突一覧を見て `resolve-merge-conflicts` + 手動の方が安全と判断。
2. **仮説**: `types.ts` の duplicate は未解決マージ。**検証**: `tsgo` が `Duplicate identifier` → 後段ブロック削除で解消。
3. **仮説**: `server-methods` の `browser.js` は上流リネーム/統合。**検証**: `upstream/main` のファイルを見て `webHandlers` + `vrchat` だけ残す形に統一。
