# Design: Sync-OpenClawDesktop — リポジトリ設定の `.openclaw-desktop/` へのインストール

**Date**: 2026-03-29
**Status**: Approved

---

## 概要

リポジトリ内の設定情報を `.openclaw-desktop/` ディレクトリへマージ形式でインストールする仕組みを導入する。新PC移行・他ユーザーへの配布・起動時の常時同期の3シナリオをすべてカバーする。

---

## 対象シナリオ

1. **新PC移行**: リポジトリをクローン後に `pnpm setup` で環境を即座に再現
2. **配布・共有**: 他ユーザーがクローンしてそのままセットアップ可能
3. **起動時常時同期**: `Sovereign-Portal.ps1` 起動のたびに差分だけ自動適用

---

## アーキテクチャ

```
リポジトリ（ソース）                       .openclaw-desktop/（ターゲット）
────────────────────────────────           ──────────────────────────────
.env                      ┐
.env.secrets (gitignore)  ├──[キーマージ]──→ .env
.openclaw-desktop/.env    ┘

.openclaw-desktop/openclaw.json ──[JSONマージ]──→ openclaw.json
.openclaw-desktop/agents/       ──[JSONマージ]──→ agents/
skills/                         ──[上書き]──────→ skills/
```

**新設ファイル**: `scripts/Sync-OpenClawDesktop.ps1`

---

## 同期ルール詳細

### 1. `.env` マージ（キーマージ）

優先順位（低 → 高）:

```
.env.example → .env → .env.secrets → 既存 .openclaw-desktop/.env
```

- 既存の `.openclaw-desktop/.env` にあるキーは**変更しない**（既存値優先）
- リポジトリ側に新規キーがあれば末尾に追加
- `.env.secrets` は gitignore 対象。存在しない場合はスキップ（警告なし）
- `env-tools.ps1` の `Get-EnvMap` / `Set-EnvValues` を再利用

### 2. `openclaw.json` マージ（JSON ディープマージ）

優先順位（低 → 高）:

```
リポジトリ側 openclaw.json → 既存 .openclaw-desktop/openclaw.json
```

- トップレベルキーごとに再帰マージ
- 既存の値（APIキー・トークン等）は保持
- リポジトリ側に新しいプラグイン・チャンネル設定が追加された場合のみ適用
- マージ前に `.openclaw-desktop/openclaw.json.sync-bak` へバックアップ作成

### 3. `agents/` マージ

| ファイル             | 動作                                           |
| -------------------- | ---------------------------------------------- |
| `models.json`        | 新規モデルだけ追加（既存モデルは上書きしない） |
| `auth-profiles.json` | 新規プロファイルだけ追加                       |
| `auth.json`          | **スキップ**（機密・セッション情報のため除外） |

### 4. `skills/` — 上書き（現行踏襲）

- リポジトリの `skills/` を `.openclaw-desktop/skills/` へそのままコピー
- 現在 `Sovereign-Portal.ps1` で実施している処理と同様

---

## 統合ポイント

### `Sovereign-Portal.ps1` への統合（起動時自動）

```powershell
# Skill Substrate sync の直前に挿入
$syncPs1 = Join-Path $ProjectDir "scripts\Sync-OpenClawDesktop.ps1"
if (Test-Path $syncPs1) {
    Write-Host "  [SYNC] Syncing repo config -> .openclaw-desktop..." -ForegroundColor DarkCyan
    & $syncPs1 -ProjectDir $ProjectDir -Quiet
}
```

`-Quiet` フラグ時: 変更があった項目だけ1行で表示。変更なし時は無出力。

### `package.json` への統合（pnpm コマンド）

```json
"scripts": {
  "setup": "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Sync-OpenClawDesktop.ps1",
  "setup:dry": "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Sync-OpenClawDesktop.ps1 -DryRun"
}
```

---

## `Sync-OpenClawDesktop.ps1` インターフェース

```powershell
param(
    [string]$ProjectDir = (Get-Item $PSScriptRoot).Parent.FullName,
    [switch]$DryRun,    # 書き込まず変更内容だけ表示
    [switch]$Quiet,     # 変更があった項目だけ表示（変更なし時は無出力）
    [switch]$Force      # 既存値も上書き（通常はスキップ）
)
```

---

## エラー処理

| 状況                                   | 動作                                       |
| -------------------------------------- | ------------------------------------------ |
| `.openclaw-desktop/` が存在しない      | 作成してから同期を続行                     |
| JSON パース失敗                        | その項目をスキップし警告表示、他は続行     |
| バックアップ作成失敗                   | `openclaw.json` マージを中断、エラー表示   |
| `.env.secrets` が存在しない            | スキップ（警告なし）                       |
| `$ErrorActionPreference = "Stop"` 環境 | try/catch で全体をラップし詳細エラーを表示 |

---

## `-DryRun` 出力例

```
[SYNC][DRY] would add to .env: TELEGRAM_BOT_TOKEN
[SYNC][DRY] would add to .env: VOICEVOX_ENDPOINT
[SYNC][DRY] would add to openclaw.json: plugins.entries.new-plugin
[SYNC][DRY] would add to agents/models.json: providers.hypura.models[1]
[SYNC][DRY] would copy: skills/new-skill.md
```

---

## `-Quiet` 通常出力例（起動時）

```
  [SYNC] .env: +2 keys added
  [SYNC] openclaw.json: merged (backup: openclaw.json.sync-bak)
  [SYNC] skills/: 3 files copied
```

変更なし時: 無出力

---

## `.env.secrets` 使い方

リポジトリに含めない秘密情報を管理する任意ファイル。

```bash
# .gitignore に追記済み
.env.secrets
```

```env
# .env.secrets（例）
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DISCORD_BOT_TOKEN=...
```

---

## 実装ファイル

| ファイル                                 | 変更種別     | 内容                                 |
| ---------------------------------------- | ------------ | ------------------------------------ |
| `scripts/Sync-OpenClawDesktop.ps1`       | **新規作成** | メイン同期スクリプト                 |
| `scripts/launchers/Sovereign-Portal.ps1` | **修正**     | 冒頭に Sync 呼び出しを追加           |
| `package.json`                           | **修正**     | `setup` / `setup:dry` スクリプト追加 |
| `.gitignore`                             | **修正**     | `.env.secrets` を追加                |

---

## 除外項目（同期しない）

- `.openclaw-desktop/credentials/` — 認証キャッシュ
- `.openclaw-desktop/memory/` — メモリDB
- `.openclaw-desktop/logs/` — ログ
- `.openclaw-desktop/agents/*/auth.json` — セッション情報
- `.openclaw-desktop/agents/*/sessions/` — セッションデータ
