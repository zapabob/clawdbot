---
name: x-poster
description: Post to X (Twitter) by controlling the browser. Use when the user wants to post a tweet, thread, or reply on X. Requires X login in the "x" browser profile.
short_description: Post to X (Twitter) via browser automation
os: [win32, darwin, linux]
---

# X Poster Skill

X (Twitter) にブラウザ操作でポストするスキル。
ユーザーのアカウントでログイン済みの「x」プロファイルを使用してポストする。
OpenClaw の組み込みブラウザツールまたは Playwright MCP を使用する。

## 前提条件

1. **初回ログイン** — 下記の手順で X プロファイルにログインする必要がある（一度だけ）。
2. ブラウザが起動できる環境（ヘッドレスでない場合、画面が必要）。

---

## 初回ログイン手順（一度だけ）

```
1. ブラウザツールで x.com を開く（プロファイル: x）
2. ログインページでユーザーの x.com アカウントにサインイン
3. セッションは userDataDir に保存されるため次回以降は不要
```

---

## ポスト手順

### 方法A: OpenClaw ブラウザツール使用（推奨）

```
1. browser: navigate → https://x.com/compose/post
   （プロファイル "x" を使用すること）

2. browser: act → テキストエリアにポスト内容を入力
   セレクタ: [data-testid="tweetTextarea_0"]
   操作: type → {投稿内容}

3. browser: act → 投稿ボタンをクリック
   セレクタ: [data-testid="tweetButton"]
   操作: click

4. browser: screenshot → 投稿完了確認
```

### 方法B: Playwright MCP 使用

MCP ツール `playwright_navigate`, `playwright_fill`, `playwright_click` を使用:

```
1. playwright_navigate: https://x.com/compose/post
2. playwright_fill: [data-testid="tweetTextarea_0"] → {投稿内容}
3. playwright_click: [data-testid="tweetButton"]
4. playwright_screenshot: 確認
```

---

## 投稿タイプ別ガイド

### 通常ツイート（**139文字以内**）

- URL: `https://x.com/compose/post`
- テキストを139文字以内に収めて入力し投稿ボタンをクリック

### スレッド（連投）

- 139文字を超える場合はスレッド分割を提案する
- 最初のツイート入力後、「Add post」ボタン（`[data-testid="addButton"]`）をクリック
- 各ポストを入力して最後に「Post all」をクリック

### リプライ

- 対象ツイートのURLを開く
- リプライエリア（`[data-testid="reply"]`）をクリックして入力

### メディア付き投稿

- ファイル選択ボタン（`[data-testid="fileInput"]`）から画像/動画をアップロード

---

## ポスト内容のガイドライン

- **139文字以内**（ユーザー設定の上限）
- URLは23文字換算（X の仕様）
- ハッシュタグ: `#tag` 形式
- メンション: `@username` 形式
- 改行はそのまま使用可能
- 139文字を超える場合はスレッド分割を提案すること

---

## エラー対応

| エラー                   | 対処                                                       |
| ------------------------ | ---------------------------------------------------------- |
| ログイン画面が表示される | 初回ログインが必要。ブラウザを有頭モードで開きログインする |
| 文字数オーバー           | 139文字以内に収める（スレッド分割を提案）                  |
| レートリミット           | 少し待ってから再試行                                       |
| セレクタが見つからない   | X のUI変更の可能性。スクリーンショットで確認してから操作   |

---

## 設定（openclaw.json）

```json
"browser": {
  "profiles": {
    "x": {
      "driver": "openclaw",
      "userDataDir": "C:\\Users\\downl\\AppData\\Local\\OpenClawBrowser\\x-profile"
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

---

## 使用例

ユーザーが「〇〇をXにポストして」と言ったら:

1. テキストを確認・整形（**139文字以内**、超える場合はスレッド分割を提案）
2. ブラウザツールで `https://x.com/compose/post` を開く（プロファイル: x）
3. ユーザーのアカウントで内容を入力して投稿
4. スクリーンショットで完了確認してユーザーに報告
