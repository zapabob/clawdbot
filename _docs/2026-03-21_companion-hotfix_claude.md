# Companion ホットフィックス + Telegram トークン更新 実装ログ

**日付**: 2026-03-21
**担当**: Claude Sonnet 4.6
**コミット**: `f517b90ddb`

---

## 1. Electron 起動クラッシュ修正 (`f517b90ddb`)

### 問題

前コミット (`f128c79b1c`) で `assert { type: "json" }` を
`with { type: "json" }` (Import Attributes) に移行したが、
Electron 28 の Main Process 起動時にクラッシュが発生した:

```
App threw an error during load
SyntaxError: Unexpected token 'with'
    at ESMLoader.moduleStrategy (node:internal/modules/esm/translators:119:18)
    at ESMLoader.moduleProvider (node:internal/modules/esm/loader:473:14)
    at async link (node:internal/modules/esm/module_job:68:21)
```

### 根本原因

| 環境                           | Node.js バージョン | `with { type: "json" }` サポート |
| ------------------------------ | ------------------ | -------------------------------- |
| Electron 28.3.3 (Main Process) | Node.js **20.9.0** | ❌ 20.10.0 以降が必要            |
| Electron 28.3.3 (Renderer)     | Chromium **120**   | ✅ Chrome 117+ で対応済み        |

`electron/main.ts` は Node.js の ESM ローダー (`node:internal/modules/esm/translators`)
を通じて実行されるため、`with` 構文でクラッシュ。

`renderer/**/*.ts` は Chromium の V8 エンジンで実行されるため `with` が使える。

### 修正 (`electron/main.ts` のみ変更)

```diff
- import companionConfig from "../companion.config.json" with { type: "json" };
+ import { createRequire } from "node:module";
+ const companionConfig = createRequire(import.meta.url)(
+   "../companion.config.json",
+ ) as typeof import("../companion.config.json");
```

**`createRequire` パターンを選んだ理由:**

| 方法                                  | 問題                                     |
| ------------------------------------- | ---------------------------------------- |
| `assert { type: "json" }`             | 非推奨 → ExperimentalWarning が出る      |
| `with { type: "json" }`               | Node.js 20.9.0 未対応 → クラッシュ       |
| `createRequire(import.meta.url)(...)` | ✅ 全 Node.js バージョンで動作、警告なし |

**型安全の維持:**
`as typeof import("../companion.config.json")` で TypeScript の
`resolveJsonModule: true` による型情報を活かした型推論を維持。

**変更ファイル**: `electron/main.ts` + tsc 再生成の `electron/main.js` のみ。
`renderer/**` は変更なし（Chromium が `with` を処理するため不要）。

---

## 2. Telegram Bot Token 更新 (コミット対象外 — `.env`)

### 問題

```
[telegram] telegram setMyCommands failed: Call to 'setMyCommands' failed! (401: Unauthorized)
[telegram] telegram deleteWebhook failed: Call to 'deleteWebhook' failed! (401: Unauthorized)
[telegram] [default] channel exited: Call to 'deleteWebhook' failed! (401: Unauthorized)
[telegram] [default] auto-restart attempt 1/10 in 5s
```

Telegram チャンネルが `401: Unauthorized` で起動失敗し、10 秒ごとに再起動を繰り返していた。

### 原因

`.env` の `TELEGRAM_BOT_TOKEN` がプレースホルダー値 `your_telegram_bot_token` のままだった。

### 修正 (`.env` — git 管理外)

```diff
- TELEGRAM_BOT_TOKEN=your_telegram_bot_token
+ TELEGRAM_BOT_TOKEN=<set_real_token_from_BotFather_in_local_.env_only>
```

`.env` は `.gitignore` に含まれるためリポジトリには記録されない。
スタック再起動で Telegram チャンネルが正常起動する。

---

## 関連コミット

| コミット     | 内容                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| `f128c79b1c` | fix: assert → with (Import Attributes) — Renderer は OK だが Main がクラッシュ |
| `f517b90ddb` | fix: electron/main.ts を createRequire に変更してクラッシュ解消                |
