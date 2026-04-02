# upstream統合 実装ログ

- 日時: 2026-04-01
- 作業ブランチ: `integrate/upstream-main-2026-04-01`
- 作業worktree: `clawdbot-main-upstream-2026-04-01`
- 方針: 公式優先（`upstream/main`）+ 独自利点の再注入

## 実施内容

1. クリーンworktreeを作成し、`sparse-checkout` で `.openclaw-desktop` を除外して統合作業を分離。
2. `upstream/main` を統合し、衝突時は official-first で解消。
3. 大規模競合を解消後、`merge: sync upstream/main with official-first conflict policy` を確定。
4. 独自差分を棚卸しし、ランタイム同期/Launcher領域の差分を点検。
5. 再実行可能な統合スクリプト `scripts/tools/upstream_merge.py` を追加。
6. `py -3 scripts/tools/upstream_merge.py --target integrate/upstream-main-2026-04-01 --dry-run` を実行し、レポート生成を確認。

## 追加/変更ファイル

- `scripts/tools/upstream_merge.py`
- `_docs/merge-reports/upstream-merge-20260401T111026Z.json`
- `_docs/2026-04-01_upstream統合{clawdbot-main-upstream-2026-04-01}.md`

## 検証結果

- `py -3` dry-run: 成功
- `pnpm build`: 失敗（`node_modules` 未導入起因）
- `pnpm install`: 失敗（`minimumReleaseAge` 制約で `@pierre/theme@0.0.26` が拒否）
- `pnpm install --frozen-lockfile`: 失敗（`extensions/hypura-harness/package.json` と lockfile の `@sinclair/typebox` バージョン不一致）

## 判断メモ

- 公式機能と同等の領域は upstream 側を採用し、独自利点は将来再注入しやすいようにスクリプト化を優先。
- フック実行時に `Argument list too long` が発生するため、統合マージコミットはユーザー許可の上で `--no-verify` を使用。

## 次アクション

1. 依存解決ポリシー（`minimumReleaseAge`）と lockfile整合を先に揃える。
2. `pnpm install` -> `pnpm build` を再実行してグリーン化。
3. 追加の回帰確認（Gateway/TUI/Launcher）後に `main` へ統合。
