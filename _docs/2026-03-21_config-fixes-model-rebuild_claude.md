# Config 修正 / Env 移行 / qwen-hakua-core 再ビルド ログ

**日付**: 2026-03-21
**担当**: Claude Sonnet 4.6
**コミット範囲**: `580097f4cc` → `836f10d79e`

---

## 1. デスクトップショートカット更新 (`580097f4cc`)

### 変更ファイル

- `scripts/installers/create-desktop-shortcut.ps1`

### 内容

ショートカットの `Description` に新機能を反映:

```
旧: "Clawdbot — Launch Gateway, TUI, Companion & Browser"
新: "Clawdbot — Gateway / TUI / Live2D+VOICEVOX / VRChat Relay / X Poster / Web UI"
```

ショートカットインストーラーを実行し `Clawdbot.lnk` をデスクトップに再作成した。

---

## 2. `browser.profiles` バリデーションエラー修正

### エラー内容

```
browser.profiles.x: Profile must set cdpPort or cdpUrl
browser.profiles.x: Profile userDataDir is only supported with driver="existing-session"
browser.profiles.default: Profile must set cdpPort or cdpUrl
browser.profiles.x.color: Invalid input: expected string, received undefined
browser.profiles.default.color: Invalid input: expected string, received undefined
```

### 原因

`BrowserProfileConfig` 型の制約:

- `driver !== "existing-session"` の場合、`cdpPort` or `cdpUrl` が**必須**
- `userDataDir` は `driver="existing-session"` 専用
- `color` は**必須**フィールド（`string`、optional ではない）

### 修正内容（`.openclaw-desktop/openclaw.json`）

```json
// 修正前
"x": {
  "driver": "openclaw",
  "userDataDir": "C:\\Users\\downl\\AppData\\Local\\OpenClawBrowser\\x-profile"
},
"default": {
  "driver": "openclaw"
}

// 修正後
"x": {
  "driver": "existing-session",
  "userDataDir": "C:\\Users\\downl\\AppData\\Local\\OpenClawBrowser\\x-profile",
  "cdpPort": 18800,
  "color": "#1da1f2"
},
"default": {
  "driver": "openclaw",
  "cdpPort": 18801,
  "color": "#6c757d"
}
```

### CDP ポート割り当て

| プロファイル | ポート | 用途                                     |
| ------------ | ------ | ---------------------------------------- |
| `x`          | 18800  | X.com 永続セッション（existing-session） |
| `default`    | 18801  | 汎用 openclaw ブラウザ                   |

予約済みポート（使用禁止）: 18789(Gateway), 18790(Bridge), 18791(Companion HTTP)
有効範囲: **18800–18899** (`src/browser/profiles.ts`)

---

## 3. `gateway.mode` 未設定エラー修正 + `CLAWDBOT_*` env 移行 (`73bb24a95a`)

### エラー内容

```
gateway.mode is unset; gateway start will be blocked.
Deprecated legacy environment variables detected (ignored):
  CLAWDBOT_GATEWAY_MODE -> OPENCLAW_GATEWAY_MODE
  ... (計17変数)
```

### 修正1: `openclaw.json` に `gateway.mode` を追加

```json
"gateway": {
  "mode": "local"
}
```

有効値: `"local"` (このホストで実行) / `"remote"` (リモート接続)
旧設定 `CLAWDBOT_GATEWAY_MODE=online` は**無効値**だったため config に直接設定。

### 修正2: `launch-desktop-stack.ps1` デフォルト修正

```powershell
# 旧
[string]$GatewayMode = "online",

# 新
[string]$GatewayMode = "local",
```

### 修正3: `.env` の `CLAWDBOT_*` → `OPENCLAW_*` 全移行

| 旧変数                          | 新変数                          | 対応                               |
| ------------------------------- | ------------------------------- | ---------------------------------- |
| `CLAWDBOT_GATEWAY_PORT`         | `OPENCLAW_GATEWAY_PORT`         | 重複削除（既存 OPENCLAW\_\* 利用） |
| `CLAWDBOT_GATEWAY_BIND`         | `OPENCLAW_GATEWAY_BIND`         | 同上                               |
| `CLAWDBOT_GATEWAY_MODE=online`  | `OPENCLAW_GATEWAY_MODE=local`   | 値も修正                           |
| `CLAWDBOT_HEARTBEAT_PROMPT`     | `OPENCLAW_HEARTBEAT_PROMPT`     | リネーム                           |
| `CLAWDBOT_USE_TAILSCALE`        | `OPENCLAW_USE_TAILSCALE`        | リネーム                           |
| `CLAWDBOT_WORKSPACE_DIR`        | `OPENCLAW_WORKSPACE_DIR`        | リネーム                           |
| `CLAWDBOT_LOG_DIR`              | `OPENCLAW_LOG_DIR`              | リネーム                           |
| `CLAWDBOT_STATE_DIR`            | (削除)                          | `OPENCLAW_STATE_DIR` 既存利用      |
| `CLAWDBOT_CONFIG_PATH`          | (削除)                          | `OPENCLAW_CONFIG_PATH` 既存利用    |
| `CLAWDBOT_GATEWAY_TOKEN`        | (削除)                          | `OPENCLAW_GATEWAY_TOKEN` 既存利用  |
| `CLAWDBOT_PUBLIC_URL`           | (削除)                          | `OPENCLAW_PUBLIC_URL` 既存利用     |
| `CLAWDBOT_BROWSER_PATH`         | `OPENCLAW_BROWSER_PATH`         | リネーム                           |
| `CLAWDBOT_SKILLS_PATH`          | `OPENCLAW_SKILLS_PATH`          | リネーム                           |
| `CLAWDBOT_NO_ONBOARD`           | `OPENCLAW_NO_ONBOARD`           | リネーム                           |
| `CLAWDBOT_INSTALL_SMOKE_SKIP_*` | `OPENCLAW_INSTALL_SMOKE_SKIP_*` | リネーム (3変数)                   |

---

## 4. 承認待ち時 Output.wav 通知 (`14b2c27938`)

### 実装ファイル

- `src/infra/exec-approval-forwarder.ts`

### 実装内容

```typescript
import { execFile } from "node:child_process";
import path from "node:path";

function playApprovalSound(): void {
  const userHome = process.env["USERPROFILE"] ?? process.env["HOME"] ?? "";
  const wavPath = path.join(userHome, "Desktop", "Output.wav");
  execFile(
    "powershell",
    [
      "-NoProfile",
      "-NonInteractive",
      "-c",
      `(New-Object Media.SoundPlayer '${wavPath}').PlaySync()`,
    ],
    { timeout: 10000 },
    () => {}, // fire-and-forget
  );
}
```

`handleRequested()` の先頭で呼び出し。承認リクエスト発生時に毎回再生。

| 項目         | 値                                        |
| ------------ | ----------------------------------------- |
| 音声ファイル | `%USERPROFILE%\Desktop\Output.wav`        |
| 再生方式     | PowerShell `Media.SoundPlayer.PlaySync()` |
| エラー処理   | fire-and-forget（失敗時は無視）           |
| タイムアウト | 10秒                                      |

---

## 5. `.gitignore` 追加 + ランタイム状態ファイルの削除 (`5b305766ef`)

### `.gitignore` 追加エントリ

```gitignore
.openclaw-desktop/cron/jobs.json
.openclaw-desktop/cron/jobs.json.bak
.openclaw-desktop/cron/runs/
.openclaw-desktop/openclaw.json.bak
.openclaw-desktop/openclaw.json.bak.*
.openclaw-desktop/companion_state.json
```

### リポジトリから除去したファイル（`git rm --cached`）

- `.openclaw-desktop/cron/jobs.json`
- `.openclaw-desktop/cron/jobs.json.bak`
- `.openclaw-desktop/cron/runs/6205dcdd-...jsonl`
- `.openclaw-desktop/openclaw.json.bak` (.bak.1〜.bak.4 含む計5件)

### dist-runtime 追加

以前のビルドで生成された 2 エクステンションを追加:

- `dist-runtime/extensions/universal-skills/` (index.js + plugin.json + 14 SKILL.md)
- `dist-runtime/extensions/x-poster/` (index.js + plugin.json + SKILL.md)

---

## 6. `qwen-hakua-core` モデル修正・再ビルド (`836f10d79e`)

### 問題

モデルが正常に中枢として機能しない。

### 原因1: `PARAMETER stop "ASI_ACCEL"`（致命的バグ）

```
# Modelfile.hakua（旧）
PARAMETER stop "ASI_ACCEL"
```

システムプロンプト末尾・ハートビートメッセージに `ASI_ACCEL` が含まれるため、
**モデルが応答生成中に `ASI_ACCEL` を出力しようとした瞬間に強制停止**していた。
結果: 空の応答 / ハートビート機能が完全に壊れる。

### 原因2: `contextWindow` 不一致

```
models.json: "contextWindow": 131072  ← 宣言値
Modelfile:   PARAMETER num_ctx 32768  ← 実際の推論コンテキスト
```

OpenClaw がコンテキスト長を 131072 と思って大きなプロンプトを送ると
Ollama 側で 32768 に切り捨てられ、応答品質が低下。

### 修正内容

**`scripts/Modelfile.hakua`:**

```diff
- PARAMETER stop "ASI_ACCEL"
```

（`<|im_start|>` と `<|im_end|>` の stop トークンは ChatML 標準として保持）

**`.openclaw-desktop/agents/main/agent/models.json`:**

```diff
- "contextWindow": 131072,
+ "contextWindow": 32768,
```

### 再ビルド

```bash
ollama create qwen-hakua-core -f scripts/Modelfile.hakua
# → success（既存 GGUF を再利用、システムプロンプト・パラメータのみ更新）
```

### GGUF ファイル

```
C:\Users\downl\Downloads\Qwen3.5-9B-Uncensored-HauhauCS-Aggressive-Q8_0.gguf
サイズ: 9.5 GB
```

---

## Ollama モデル最終状態

```
NAME                    ID              SIZE      MODIFIED
qwen-hakua-core:latest  (新規ハッシュ)   9.5 GB    今回再ビルド
```

| パラメータ    | 値                                    |
| ------------- | ------------------------------------- |
| `num_ctx`     | 32768                                 |
| `num_gpu`     | 99 (全層 GPU)                         |
| `temperature` | 0.8                                   |
| `top_p`       | 0.9                                   |
| stop tokens   | `<\|im_start\|>`, `<\|im_end\|>` のみ |

---

## 関連コミット一覧

| コミット     | 内容                                                    |
| ------------ | ------------------------------------------------------- |
| `580097f4cc` | chore(shortcuts): ショートカット説明文更新              |
| `73bb24a95a` | fix(config): gateway.mode=local + CLAWDBOT\_\* env 移行 |
| `14b2c27938` | feat(approvals): 承認待ち Output.wav 通知               |
| `5b305766ef` | chore: gitignore + dist-runtime 整理                    |
| `836f10d79e` | fix(model): stop=ASI_ACCEL 削除 + contextWindow 修正    |
