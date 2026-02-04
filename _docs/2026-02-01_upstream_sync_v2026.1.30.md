# 2026-02-01 上流同期 (v2026.1.30)

## 概要

独自機能（AntiGravity, LINE連携, エビングハウス忘却曲線メモリ等）を維持しつつ、公式リポジトリ（moltbot/moltbot）の最新版（v2026.1.30）を取り込みました。

## 同期戦略

- **Unrelated Histories Merge**: ローカルと上流で履歴が繋がっていないため、`--allow-unrelated-histories` を使用してマージを実行しました。
- **Custom First Policy**: 競合が発生した箇所は、ローカルの独自機能を優先して解決しました。

## 保持された独自機能

- **LINE連携**: `src/channels/line/` 一式
- **メモリ管理**: `src/memory/retention.ts` (エビングハウス忘却曲線アルゴリズム)
- **インフラ**: `src/infra/provider-usage.fetch.antigravity.ts` (AntiGravity 使用量追跡)
- **VRChat連携**: `extensions/vrchat-relay/` (OSC リレイ)
- **安全プロトコル**: `src/agents/system-prompt.ts` 内の安全ガードレール

## 検証内容

- **型チェック**: `pnpm tsc -p tsconfig.json` が正常終了（Exit code 0）することを確認。
- **ファイル存在確認**: 主要な独自機能ファイルがすべて存在し、内容が維持されていることを確認。
- **依存関係**: `package.json` のマージ後、`pnpm install` により最新の依存関係を適用。

## 作業ブランチ

- `sync-upstream-v2026-02-01`
