# X Poster ブラウザ自動化 実装ログ

**日付**: 2026-03-21
**担当**: Claude Sonnet 4.6

---

## 概要

AIエージェントがブラウザ操作でユーザーのX（Twitter）アカウントにポストできる機能を実装した。

---

## 実装内容

### 1. openclaw.json — ブラウザプロファイル & MCP 追加

`.openclaw-desktop/openclaw.json` に以下を追加:

```json
"browser": {
  "enabled": true,
  "profiles": {
    "x": {
      "driver": "openclaw",
      "userDataDir": "C:\\Users\\downl\\AppData\\Local\\OpenClawBrowser\\x-profile"
    },
    "default": {
      "driver": "openclaw"
    }
  }
},
"mcp": {
  "servers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"],
      "env": { "PLAYWRIGHT_HEADLESS": "false" }
    }
  }
}
```

- `x` プロファイル: ユーザーのX.comログインセッションを永続化
- `userDataDir` にCookieが保存されるため初回ログインのみ必要
- Playwright MCP: 代替ブラウザ制御手段（`@playwright/mcp@latest`）

### 2. extensions/x-poster/ — git管理スキル拡張

```
extensions/x-poster/
├── openclaw.plugin.json    ← プラグイン宣言
└── skills/
    └── x-poster/
        └── SKILL.md        ← ポスト手順スキル
```

- `openclaw.plugin.json` でスキルを宣言 → OpenClaw が自動ロード
- `/x-poster` としてチャットから呼び出し可能

### 3. .agents/skills/x-poster/SKILL.md — ランタイムスキル

`.agents/skills/` (gitignored) にも同内容を配置。
`sync-skills.ps1` 実行で `~/.claude/skills/` にも同期される。

---

## ポスト仕様

| 項目                 | 値                                      |
| -------------------- | --------------------------------------- |
| 文字数制限           | **139文字以内**（ユーザー設定）         |
| ブラウザプロファイル | `x`（ユーザーアカウントでログイン済み） |
| 投稿URL              | `https://x.com/compose/post`            |
| テキストエリア       | `[data-testid="tweetTextarea_0"]`       |
| 投稿ボタン           | `[data-testid="tweetButton"]`           |

---

## 使用方法

### OpenClaw でのポスト

```
/x-poster

→ 「〇〇をポストして」と指示するだけでブラウザが操作されポストされる
```

### 初回ログイン（一度だけ）

```
ブラウザツールで https://x.com を開く（プロファイル: x）
→ ユーザーが手動でログイン
→ 以降はセッション保持
```

---

## 技術背景

- OpenClaw は `src/agents/tools/browser-tool.ts` に組み込みブラウザツールを持つ
- Playwright 1.58.2 がプロジェクトに既インストール済み
- MCP サーバー経由で Playwright の全機能（screenshot/fill/click/navigate）を利用可能

---

## 関連ファイル

- `.openclaw-desktop/openclaw.json` — ブラウザ・MCP 設定
- `extensions/x-poster/openclaw.plugin.json` — プラグイン宣言
- `extensions/x-poster/skills/x-poster/SKILL.md` — スキル本体
- `.agents/skills/x-poster/SKILL.md` — ランタイムコピー（gitignored）
- `scripts/sync-skills.ps1` — Claude Code への同期スクリプト
