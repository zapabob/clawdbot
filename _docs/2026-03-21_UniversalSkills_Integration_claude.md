# Universal Skills 統合ログ

**日付**: 2026-03-21
**担当**: Claude Sonnet 4.6

---

## 概要

このPC上のすべてのAIツール（Claude Code / Codex / Gemini CLI / Antigravity / Cursor）が持つ
スキルを OpenClaw と Claude Code の両方で使える形式に統合した。

---

## 統合構造

```
extensions/universal-skills/          ← git 管理（OpenClaw プラグイン）
├── openclaw.plugin.json              ← プラグイン宣言
└── skills/                           ← キュレーション済みスキル (15件)
    ├── plan-mode/SKILL.md
    ├── researcher/SKILL.md
    ├── deep-research-specialist/SKILL.md
    ├── code-reviewer/SKILL.md
    ├── ts-reviewer/SKILL.md
    ├── obsidian-knowledge/SKILL.md
    ├── sec-audit/SKILL.md
    ├── gh-address-comments/SKILL.md
    ├── yaraikata-memo/SKILL.md
    ├── worktree-manager/SKILL.md
    ├── gemini-cli-integration/SKILL.md
    ├── vrchat-dev/SKILL.md
    ├── unity-reviewer/SKILL.md
    ├── yolo-auto/SKILL.md
    └── yukkuri-movie/SKILL.md

scripts/sync-skills.ps1               ← 全ツール同期スクリプト

.agents/skills/                       ← ランタイム (gitignored, 77件)
~/.claude/skills/                     ← Claude Code (33件)
```

---

## スキルソース別一覧

| ソース              | スキル数 | パス                                   |
| ------------------- | -------- | -------------------------------------- |
| Codex               | ~70件    | `~/.codex/skills/`                     |
| Claude Code         | 9件      | `~/.claude/skills/`                    |
| Gemini CLI          | 8件      | `~/.gemini/skills/`                    |
| Antigravity         | 8件      | `~/.gemini/antigravity/global_skills/` |
| OpenClaw (built-in) | 9件      | `.agents/skills/` (dist 経由)          |

---

## OpenClaw での動作

1. `extensions/universal-skills/openclaw.plugin.json` を検出
2. `./skills/` 以下の全 SKILL.md を自動ロード
3. チャットで `/plan-mode`、`/researcher` などとして呼び出し可能

---

## Claude Code での動作

`scripts/sync-skills.ps1` を実行すると:

1. `.agents/skills/` の全スキルを `~/.claude/skills/` へ同期
2. `~/.codex/skills/`, `~/.gemini/skills/`, `~/.gemini/antigravity/global_skills/` の
   未統合スキルを `.agents/skills/` へプル → 次回 OpenClaw も使用可能
3. Claude Code で `/plan-mode`、`/researcher` などとして呼び出し可能

```powershell
# 初回セットアップ
.\scripts\sync-skills.ps1

# ドライラン（確認のみ）
.\scripts\sync-skills.ps1 -DryRun
```

---

## 統合済みスキル詳細

| スキル                      | 元ツール    | 説明                                       |
| --------------------------- | ----------- | ------------------------------------------ |
| `plan-mode`                 | Codex       | 複数ステップタスクの実行計画               |
| `researcher`                | Codex       | 多ソース検証付き深掘り調査                 |
| `deep-research-specialist`  | Codex       | 自律的ドキュメント探索・調査               |
| `code-reviewer`             | Codex       | セキュリティ/パフォーマンス/保守性レビュー |
| `ts-reviewer`               | Codex       | TypeScript 型安全性・APIレビュー           |
| `obsidian-knowledge`        | Codex       | Wikilink構文による知識ベース管理           |
| `sec-audit`                 | Codex       | CVEスキャン・依存関係脆弱性パッチ          |
| `gh-address-comments`       | Codex       | GitHub PRレビューコメント対応              |
| `yaraikata-memo`            | Codex       | 長時間タスクの定期進捗報告                 |
| `worktree-manager`          | Codex       | Git worktree並列開発環境管理               |
| `gemini-cli-integration`    | Codex       | Gemini CLI をリサーチエンジンとして統合    |
| `vrchat-dev`                | Codex       | UdonSharp/PhysBones VRChat開発             |
| `unity-reviewer`            | Codex       | Unity C# コード・アーキテクチャレビュー    |
| `yolo-auto`                 | Codex       | YOLO全自動実行モード                       |
| `yukkuri-movie`             | Codex       | YMM4 ゆっくりMovieMaker制作                |
| `specstory-session-summary` | Claude Code | 開発セッションのスタンドアップ要約         |
| `specstory-guard`           | Claude Code | コミット前シークレットスキャン             |
| `specstory-yak`             | Claude Code | ヤク刈り（脱線分析）                       |
| `specstory-link-trail`      | Claude Code | セッション中フェッチURLトラッキング        |
| `specstory-organize`        | Claude Code | セッション履歴の年月別整理                 |
| `find-skills`               | Claude Code | スキルエコシステム検索・インストール       |

---

## アーキテクチャ補足

OpenClaw のスキルスキャンパス（`src/agents/skills/workspace.ts`）:

```
workspaceDir/skills/              ← ルートskillsディレクトリ
workspaceDir/.agents/skills/      ← プロジェクト level (gitignored)
~/.agents/skills/                 ← ユーザー global
plugin skills/                    ← openclaw.plugin.json 経由
```

スキルフォーマット（SKILL.md）はClaude Code / Codex / Gemini CLI / OpenClaw 共通:

```yaml
---
name: skill-id
description: 説明
---
# 本文 (Markdown)
```
