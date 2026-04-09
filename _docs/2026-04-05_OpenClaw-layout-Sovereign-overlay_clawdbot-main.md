# 2026-04-05 OpenClaw レイアウトと Sovereign オーバーレイ（clawdbot-main）

## 目的

[openclaw/openclaw](https://github.com/openclaw/openclaw) に追従しやすい **公式相当のディレクトリ規約** と、このワークツリー固有の **Sovereign オーバーレイ** を一枚にまとめる。ファイルの削除は行わず、ルート掃除が必要な作業用ファイルは [`_artifacts/root-captured/`](../_artifacts/root-captured/README.md) へ退避する（[AGENTS.md](../AGENTS.md)）。

## 公式 OpenClaw 核（upstream 慣習）

| パス                                   | 役割                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `src/`                                 | CLI、コマンド、ゲートウェイ、チャネル、プラグインローダ、インフラなどコア実装 |
| `extensions/*`                         | バンドルプラグイン（workspace パッケージ）。本リポでは `hypura-harness` 等    |
| `docs/`                                | 公開ドキュメント（Mintlify）。生成ロケール `docs/zh-CN/**` 等は編集しない方針 |
| `apps/*`                               | macOS / iOS / Android 等クライアント                                          |
| `packages/`                            | 共有パッケージ                                                                |
| `scripts/`                             | ビルド・生成・検証スクリプト（`generate-*.mjs` 等）                           |
| `test/` / `tests/`                     | テスト資産（リポの構成に従う）                                                |
| `pnpm-workspace.yaml` / `package.json` | Node ワークスペース定義                                                       |
| `dist/`                                | ビルド出力（生成物）                                                          |

詳細な境界はルート [AGENTS.md](../AGENTS.md) の Ghost Protocol を参照。

## Sovereign / フォークオーバーレイ（削除なしで共存）

| パス                                | 公式との関係 | 役割                                                                         |
| ----------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| `identity/`                         | 追加         | `SOUL.md` 等、エージェント identity（機密境界）                              |
| `_docs/`                            | 追加         | 実装ログ、HANDOFF、設定の正（本ファイル含む）                                |
| `_artifacts/`                       | 追加         | 作業用ファイル退避（ルートを公式に近づける）                                 |
| `_snapshots/`                       | 追加         | スナップショット類（用途は各 README 参照）                                   |
| `brain/`                            | 追加         | 補助ガイド（例: upstream 向け `AGENTS.md` ミラー）                           |
| `skills/`                           | 追加         | Cursor / エージェント向け SKILL（リポ同梱）                                  |
| `.openclaw-desktop/`                | 追加         | デスクトップ用設定・スキルコピー等（gitignore 方針に従う）                   |
| `scripts/launchers/`                | 追加         | Windows 用 Gateway / TUI / ngrok / **Hypura ハーネス** 起動                  |
| `scripts/hypura/`                   | 追加         | **レガシー pytest ツリー**（`tests/`、`generated/`）。デーモン本体は置かない |
| `memory/` / `MEMORY.md` / `USER.md` | 追加         | ワークスペース用メモリ・ユーザー文脈                                         |
| `vendor/`                           | 追加         | ベンダー同梱（ATLAS 等）                                                     |
| `Swabble/`、`vrchat-mcp-osc/` 等    | 追加         | プロジェクト固有モジュール                                                   |

## Hypura ハーネス（正規導線）

| 観点                | 正                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Python プロジェクト | `extensions/hypura-harness/scripts/pyproject.toml`                                                                        |
| デーモン            | `extensions/hypura-harness/scripts/harness_daemon.py`（既定 HTTP **18794**）                                              |
| 設定                | `extensions/hypura-harness/config/harness.config.json`                                                                    |
| OpenClaw プラグイン | `hypura-harness` → `hypura_harness_*` ツール                                                                              |
| Windows 起動        | `scripts/launchers/Start-Hypura-Harness.ps1`、または `openclaw-desktop/launch-desktop-stack.ps1` / `Sovereign-Portal.ps1` |
| オペレータ索引      | [extensions/hypura-harness/README.md](../extensions/hypura-harness/README.md)                                             |

`scripts/hypura/` は **ハーネスコードの正ではない**。混同防止のため [scripts/hypura/README.md](../scripts/hypura/README.md) を参照。

## 関連ドキュメント

- [2026-03-28_Repository_Organization_Antigravity.md](./2026-03-28_Repository_Organization_Antigravity.md) — 移動のみ・削除なしの整理ログ
- [2026-03-28_OpenClaw_Config_Source_of_Truth_clawdbot-main.md](./2026-03-28_OpenClaw_Config_Source_of_Truth_clawdbot-main.md) — `openclaw.json` / `OPENCLAW_CONFIG_PATH`
- [scripts/launchers/README.md](../scripts/launchers/README.md) — ランチャー一覧
- [extensions/README.md](../extensions/README.md) — バンドル拡張の索引

**Status:** layout map frozen for this worktree.
