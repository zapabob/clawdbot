# 実装ログ: Workspace 統一・identity/SOUL・Sovereign パス・プラグイン配線

**UTC 完了時刻 (Python):** `2026-03-28T11:16:04.466264+00:00`  
**作業ツリー:** `clawdbot-main`（Antigravity 引き継ぎプラン実装）

## 実施内容

1. **`.openclaw-desktop/openclaw.json`**
   - `agents.defaults.workspace` をリポジトリルートに変更。
   - `plugins.allow` に `python-exec` を追加、`plugins.entries.python-exec` を有効化（既定 Python `3.12`）。
   - バンドルメタデータに `python-exec` が未掲載のため、`plugins.load.paths` に当該拡張の絶対パスを追加（別マシンでは workspace と揃えて更新すること）。

2. **`identity/SOUL.md`**
   - 正規の SOUL を配置（旧 `brain/SOUL.md` から移設相当）。
   - `brain/SOUL.md` / `brain/MEMORY.md` はスタブにし二重編集を防止。

3. **Workspace Markdown**
   - ルートに `USER.md`（テンプレベース）を追加。
   - `MEMORY.md` に workspace 統一・承認ゲート・日次 `memory/` 運用を追記。
   - `memory/README.md` で日次ファイル命名を案内。

4. **`SovereignManifest`**
   - `getSituationReport(workspaceRoot?)` でエージェント workspace 基準に `identity/SOUL.md` と `AGENTS.md` を読むよう変更。ハートビートから `workspaceDir` を渡す。

5. **その他**
   - `AGENT.md` の SOUL パス表記を `identity/SOUL.md` に更新。
   - `governance_policy.json` の `immune_files` に `identity/SOUL.md` を追加。
   - `extensions/memory-core` の flush ヒントに `identity/SOUL.md` を明記。
   - `AGENTS.md` に Ghost/Stealth プロトコル、自律ループ、承認ゲートを追記。

## 検証

- `pnpm check:bundled-plugin-metadata`: 成功。
- `read_lints`（`sovereign-protocols.ts`, `heartbeat-runner.ts`）: 問題なし。
- `node scripts/run-node.mjs gateway --help`: dist 陈旧時は tsdown ビルドが走ることを確認（フル起動 smoke）。

## 残メモ（HANDOFF 継続）

- ngrok 動的 URL 注入、`sovereign-pulse` metadata 等は HANDOFF 2-1/2-2 を参照し別コミットで対応可。
- `plugins.load.paths` の絶対パスはクローン先変更時に `extensions/python-exec` へ合わせて更新するか、上流で `python-exec` をバンドルメタデータに含める対応が望ましい。
