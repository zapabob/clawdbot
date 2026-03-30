# 実装ログ: Gateway 起動診断強化（2026-03-29）

## 概要

- `Start-Gateway.ps1`: `dist\entry.js` 不在時に黄色警告＋トランスクリプトログ参照の1行。
- `Sovereign-Portal.ps1`（Full）: `Wait-Port` 直前に `gateway-*.log` のディレクトリ案内；待機失敗時に最新ログのフルパス（`OPENCLAW_USE_REPO_LAUNCHER=0` 時は `.openclaw-desktop\logs`）。
- `README.md` と `_docs/2026-03-29_SovereignShortcut-MenuDefault_clawdbot-main.md` に 18789 トラブルシュート短節。

## 検証メモ

- `dist\entry.js` をリネームして `Start-Gateway.ps1` → 警告表示。
- Full で Gateway 未起動のまま Wait タイムアウト → `[HINT] Latest gateway log: ...`（ログが存在する場合）。

## 追加対応（EPERM 緩和）

- `scripts/stage-bundled-plugin-runtime-deps.mjs` に Windows 向けの `node_modules` 置換リトライを追加。
- `EPERM`/`EBUSY`/`ENOTEMPTY` のときは段階的待機付きで再試行し、最終的に `cpSync` フォールバックで復旧を試行。
