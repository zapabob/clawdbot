# Implementation Log: Upstream Merge (2026-03-29)

## Summary

upstream/main (openclaw/openclaw v2026.3.28) を取り込み、独自機能を維持しつつ公式APIに追従した。

## Upstream Changes (497 commits since merge base)

### New Features
- **Slack status reactions**: ツール/思考の進捗インジケーター (`#56430`)
- **ACP sessions_spawn**: ライフサイクルイベントの追跡 (`#40885`)
- **LINE ACP support**: プラグイン `requireApproval` フック
- **Matrix E2EE**: サムネイル、LINE メディア、CJK メモリドキュメント
- **Dynamic plugin loading**: 静的生成ファイルからマニフェストベース動的ディスカバリーに移行

### Bug Fixes
- `fix(agents): fail closed on silent turns` (#52593)
- `fix(web-search): localize shared search cache` (#54040)
- `fix(gateway/auth): local trusted-proxy fallback` (#54536)
- `fix(subagents): preserve requester agent for inline announces` (#55998)
- `fix(telegram): sanitize invalid stream-order errors` (#55999)
- `fix(agents): repair btw reasoning and oauth snapshot refresh` (#56001)
- `fix(sandbox): add CJK fonts to browser image` (#56905)
- `fix: keep openai-codex on HTTP responses transport`
- Memory/LanceDB: fix bundled runtime manifest lookup (#56623)
- Sub-agent memory_search/memory_get policy fix

### Architecture Changes
- `bundled-plugin-entries.generated.ts` / `bundled-plugin-metadata.generated.ts` 削除
- `src/channels/plugins/bundled.ts` を動的 `discoverOpenClawPlugins` + `loadPluginManifestRegistry` に移行
- `src/agents/skills/source.ts` 削除 (skills refactor)
- `createSyntheticSourceInfo` API 導入
- plugin-sdk サブパスエクスポート追加: `approval-runtime`, `host-runtime`, `collection-runtime`, `diagnostic-runtime`, `error-runtime`, `file-lock`, `fetch-runtime`, `provider-tools`, `retry-runtime`, `webhook-request-guards`
- `check` スクリプト簡素化 (多数の個別 lint スクリプトを統合)

## Conflict Resolution

Python スクリプト (`scripts/tools/resolve-merge-conflicts.py`) で自動解消。

### Content Conflicts (upstream wins)
| File | Reason |
|------|--------|
| `scripts/run-node.mjs` | ビルドツール改善 (extensionソース監視、postbuild) |
| `src/agents/skills-*.test.ts` (5 files) | 新 `createSyntheticSourceInfo` API 使用 |
| `src/channels/plugins/bundled.ts` | 動的プラグインローディング移行 |
| `src/cli/skills-cli.formatting.test.ts` | テスト更新 |

### Content Conflicts (ours wins)
| File | Reason |
|------|--------|
| `AGENTS.md` | Sovereign カスタムマニフェスト (upstream repo URL コメント追加) |
| `.gitignore` | 独自エントリー多数 (IDE, hypura, identity 等) + upstream 新規エントリー追記 |

### Delete/Modify Conflicts
| File | Resolution | Reason |
|------|-----------|--------|
| `extensions/line/src/channel.*.test.ts` | upstream 採用 | HEAD で誤削除されていた |
| `pnpm-lock.yaml` | upstream 採用 | lockfile 復元 |
| `src/agents/skills/source.ts` | upstream 削除 | skills リファクタ |
| `src/generated/bundled-plugin-entries.generated.ts` | upstream 削除 | 動的ディスカバリーに移行 |
| `src/plugins/bundled-plugin-metadata.generated.ts` | upstream 削除 | 動的ディスカバリーに移行 |

### Auto-Merged (no conflict)
- `package.json` — version 2026.3.28, 新 plugin-sdk exports, カスタムスクリプト維持 (`check:max`, `setup`, `setup:dry`)

## Custom Feature Refactoring

### extensions/hypura-harness
- `package.json`: version bump 2026.3.25 -> 2026.3.28, peerDependencies 更新
- `index.ts`: `topic` パラメータを Optional に変更 (AI-Scientist ideas API)
- `harness_daemon.py`: `template` パラメータ追加、モデル名更新 (`qwen-hakua-core:latest`)
- `ai_scientist_runner.py`: `template` パラメータ対応、OLLAMA_BASE_URL 正規化
- `harness.config.json`: BOM 除去
- **API 互換性**: `definePluginEntry` + `stringEnum` は upstream の `plugin-sdk/plugin-entry` / `plugin-sdk/core` で引き続き有効
- **動的ディスカバリー**: `openclaw.plugin.json` の `id: "hypura-harness"` + pnpm-workspace `extensions/*` により自動検出対応

### format:check
- `oxfmt --check --threads=1` に更新 (upstream の並列制御を採用)
- `.oxfmtrc.jsonc` の exclude リスト (`_docs/`, `logs/`) でフォーマット対象外を管理

### check-no-conflict-markers.mjs
- `.openclaw-desktop`, `logs`, `_docs` のフィルターを維持 (upstream はフィルター削除したが、独自ディレクトリの誤検出回避に必要)

## Files Added
- `scripts/tools/resolve-merge-conflicts.py` — マージコンフリクト自動解消スクリプト
