# Live2D Companion + Desktop Stack 実装ログ

**日付**: 2026-03-20
**コミット**: `f582506504` (main)
**実装者**: Claude Sonnet 4.6 + zapabob

---

## 1. 概要

Clawdbot に Live2D アバター常駐機能を追加し、デスクトップ起動を一元化した。
変更の軸は3本:

| 軸                    | 内容                                                              |
| --------------------- | ----------------------------------------------------------------- |
| **Live2D Companion**  | Electron 透過ウィンドウ + pixi-live2d-display でアバター常駐      |
| **並列ランチャー**    | Gateway / TUI / Companion / Browser を非同期バースト起動          |
| **LINE グループ修正** | `requireMention` デフォルト `true` を迂回し、メンションなしで応答 |

---

## 2. ファイル一覧（全変更）

### 2-A. extensions/live2d-companion/ — Phase 1 (基盤)

| ファイル                        | 種別      | 概要                                                                                                                |
| ------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| `package.json`                  | 新規      | Electron 28 + pixi-live2d-display 0.4 + pixi.js 7 依存                                                              |
| `tsconfig.json`                 | 新規      | ESNext/bundler, outDir=rootDir (JS は同ディレクトリ出力)                                                            |
| `companion.config.json`         | 新規→修正 | ウィンドウサイズ・Live2D 位置・VOICEVOX URL・`modelPath: "auto"`                                                    |
| `index.ts`                      | 新規      | OpenClaw 拡張エントリ                                                                                               |
| `bridge/event-types.ts`         | 新規      | `CompanionEmotionEvent` / `CompanionLineEvent` 型・IPC チャンネル名・`FLAG_FILES` 定数                              |
| `bridge/flag-watcher.ts`        | 新規      | `.openclaw-desktop/*.json` を `fs.watch` + 300ms debounce で監視し IPC 転送                                         |
| `electron/main.ts`              | 新規→修正 | BrowserWindow 生成・透過設定・マウス透過ポーリング・`startFlagWatcher` 呼び出し・`ipcMain.handle("discover-model")` |
| `electron/preload.ts`           | 新規→修正 | `contextBridge` で `onLineEvent` / `onEmotionEvent` / STT IPC / `discoverModel` を公開                              |
| `electron/ipc-bridge.ts`        | 新規      | STT 結果フラグ書き込みハンドラ                                                                                      |
| `renderer/index.html`           | 新規→修正 | 透過 canvas・マイクボタン・**DD ドロップオーバーレイ**・モデル名バッジ                                              |
| `renderer/app.ts`               | 新規→修正 | メイン初期化・LINE/感情 IPC 処理・**ドラッグ&ドロップハンドラ**（フォルダ再帰スキャン含む）                         |
| `renderer/live2d-controller.ts` | 新規→修正 | `Live2DModel.from()` ラッパー・**`reloadModel(pathOrUrl)`** ホットスワップ・口パクループ                            |
| `renderer/lip-sync.ts`          | 新規      | VOICEVOX audio_query → synthesis → AudioContext 再生 + AnalyserNode リアルタイム口パク                              |
| `renderer/emotion-mapper.ts`    | 新規      | `EmotionType` → モーション/表情プロファイルマッピング・キーワード検出                                               |
| `renderer/stt-handler.ts`       | 新規      | Web Speech API STT ラッパー                                                                                         |
| `renderer/model-discovery.ts`   | 新規      | `window.companionBridge.discoverModel()` 呼び出しヘルパー                                                           |

### 2-B. extensions/line/ — LINE チャンネル拡張

| ファイル               | 種別     | 概要                                                                                                      |
| ---------------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | **新規** | Gateway のプラグインマニフェスト（不足で警告が出ていた）                                                  |
| `src/channel.ts`       | 修正     | `writeCompanionLineEvent()` 追加・**エビングハウス忘却曲線**による `memory_weight` / `context_decay` 付与 |

### 2-C. src/agents/ — AI ツール登録

| ファイル                          | 種別     | 概要                                                                       |
| --------------------------------- | -------- | -------------------------------------------------------------------------- |
| `tools/companion-control-tool.ts` | **新規** | `control_companion` ツール — speak/emotion/motion/expression の4アクション |
| `tools/hakua-defense-tool.ts`     | 新規     | `trigger_hakua_defense` ツール                                             |
| `tools/world-monitor-tool.ts`     | 新規     | `trigger_world_monitor` ツール                                             |
| `openclaw-tools.ts`               | 修正     | 上記3ツールを `createOpenClawTools()` に登録                               |

### 2-D. scripts/ — ランチャー・ショートカット

| ファイル                                 | 種別     | 概要                                                                           |
| ---------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| `launchers/launch-desktop-stack.ps1`     | 修正     | 並列バースト起動・Gateway TCP ポール・Unicode 記号除去（エンコーディング修正） |
| `installers/create-desktop-shortcut.ps1` | 修正     | 旧ショートカット9種削除→`Clawdbot.lnk` 1本作成                                 |
| `setup-shortcut.ps1`                     | 修正     | 統合インストーラーへ委譲するシム                                               |
| `clawdbot-master.ps1`                    | 復元     | Ollama 起動チェック → `launch-desktop-stack.ps1` 委譲                          |
| `setup-live2d-sdk.ps1`                   | **新規** | GitHub Release から `live2dcubismcore.min.js` を自動ダウンロード・配置         |

### 2-E. 設定・インフラ

| ファイル                          | 種別 | 変更内容                                                                                 |
| --------------------------------- | ---- | ---------------------------------------------------------------------------------------- |
| `.openclaw-desktop/openclaw.json` | 修正 | LINE `groupPolicy: "open"`, `groups["*"].requireMention: false`, `groupAllowFrom: ["*"]` |
| `.gitignore`                      | 修正 | logs / identity / sessions / auth-profiles / Live2D SDK・モデルを除外                    |
| `src/infra/heartbeat-runner.ts`   | 修正 | (linter 自動整形)                                                                        |

---

## 3. アーキテクチャ詳細

### 3-1. イベントフロー

```
AI (openclaw-tools)
  └─ control_companion ──► .openclaw-desktop/companion_emotion.json
                                      │
                           flag-watcher.ts (fs.watch + 300ms debounce)
                                      │  ipcMain.send
                           Electron main process
                                      │  webContents.send
                           renderer/app.ts
                                      │
                          ┌───────────┴───────────┐
                    applyEmotion()          lipSync.speak()
                          │                        │
                   Live2DController          VOICEVOX HTTP
                   .playMotion()             audio_query → synthesis
                   .playExpression()         AudioContext + AnalyserNode
```

### 3-2. LINE → Companion フロー

```
LINE Webhook
  └─ extensions/line/src/channel.ts startAccount()
       └─ writeCompanionLineEvent(text, senderId)
            └─ .openclaw-desktop/companion_line_event.json
                 {
                   type: "line_message",
                   text: "...",
                   senderId: "U...",
                   timestamp: 1742431200000,
                   memory_weight: 1.0,          ← 現在メッセージ
                   context_decay: 0.732          ← 前回からの記憶残量 (Ebbinghaus)
                 }
                      │
               flag-watcher → IPC → renderer
                      │
               detectEmotion() → applyEmotion() + lipSync.speak()
```

**エビングハウス忘却曲線パラメータ**:

- 安定定数 S = 43.67 分 (半減期 ≈ 30 分)
- 式: `R(t) = prev_weight × exp(-t / S)`
- 意味: 前のメッセージから 30 分経過すると `context_decay` は約 0.5 になる

### 3-3. ドラッグ&ドロップ モデル差し替えフロー

```
ユーザーが .model3.json をウィンドウにドロップ
  └─ renderer/app.ts  document "drop" event
       └─ File.path (Electron 独自拡張プロパティ)
            ├─ .model3.json 直接 → そのまま使用
            └─ フォルダ → FileSystemDirectoryEntry.createReader()
                          で再帰スキャン → 最初の .model3.json
       └─ live2d.reloadModel(path)
            └─ file:///C:/... に変換 (Windows バックスラッシュ正規化)
            └─ 既存モデル .destroy() → Live2DModel.from(url) → Idle モーション再生
```

### 3-4. 並列ランチャー起動シーケンス

```
Clawdbot.lnk (デスクトップ)
  └─ clawdbot-master.ps1
       ├─ Ollama プロセスチェック (未起動なら ollama serve)
       └─ launch-desktop-stack.ps1
            ├─ [Pre] VOICEVOX start-voicevox.ps1     ─┐
            ├─ [Pre] Ngrok    start_ngrok.ps1          │ 各 Start-Process (非同期)
            ├─ BURST: Gateway  pnpm openclaw gateway   │
            ├─ BURST: TUI      pnpm openclaw tui       │
            ├─ BURST: Companion electron .             ─┘
            └─ Browser: Start-Job でポール (max 30s)
                 └─ TCP :18789 LISTEN 確認 → Start-Process $browserUrl
```

---

## 4. ビルド手順（初回セットアップ）

```powershell
# 1. 依存インストール（ルートから全ワークスペース）
corepack pnpm install

# 2. Companion TypeScript コンパイル
cd extensions/live2d-companion
pnpm run build
cd ../..

# 3. Live2D Cubism SDK ダウンロード（初回のみ）
powershell -ExecutionPolicy Bypass -File scripts/setup-live2d-sdk.ps1

# 4. モデルを配置
#    extensions/live2d-companion/models/<モデル名>/*.model3.json

# 5. ショートカット統合（初回のみ）
powershell -ExecutionPolicy Bypass -File scripts/installers/create-desktop-shortcut.ps1
```

---

## 5. 起動方法

### 通常起動（デスクトップショートカット）

デスクトップの **`Clawdbot.lnk`** をダブルクリック。
Gateway (18789) + TUI + Companion + ブラウザが一斉起動する。

### CLI 起動

```powershell
# 全スタック
powershell -ExecutionPolicy Bypass -File scripts\launchers\launch-desktop-stack.ps1 -SpeakOnReady

# コンパニオンのみ
cd extensions/live2d-companion
..\node_modules\.bin\electron.cmd .

# Gateway のみ
pnpm openclaw --profile desktop-stack gateway run --allow-unconfigured --force --bind loopback --port 18789
```

---

## 6. 設定リファレンス

### companion.config.json

```json
{
  "modelPath": "auto", // "auto" = models/ 以下を自動探索, または絶対パス
  "voicevoxSpeaker": 8, // VOICEVOX 話者 ID
  "voicevoxUrl": "http://127.0.0.1:50021",
  "stateDir": ".openclaw-desktop",
  "window": {
    "width": 380,
    "height": 480,
    "offsetRight": 400,
    "offsetBottom": 500 // 画面右下からのオフセット(px)
  },
  "live2d": {
    "scale": 0.15,
    "anchorX": 0.5,
    "anchorY": 1.0,
    "positionX": 190,
    "positionY": 460
  }
}
```

### openclaw.json LINE 設定（グループ応答）

```json
"channels": {
  "line": {
    "groupPolicy": "open",          // 全グループ許可
    "groupAllowFrom": ["*"],         // 全送信者許可
    "groups": {
      "*": { "requireMention": false } // メンションなしで応答
    }
  }
}
```

**修正前の問題**: `groupPolicy: "${LINE_GROUP_POLICY}"` で環境変数未設定時に
`resolveChannelGroupRequireMention()` がデフォルト `true` を返しグループで無反応だった。
`src/config/group-policy.ts:388` — `return true` がフォールバック。

---

## 7. AI 制御ツール (`control_companion`) リファレンス

```typescript
// アクション定義
type Action = "speak" | "emotion" | "motion" | "expression";

// フラグファイル: .openclaw-desktop/companion_emotion.json
// flag-watcher.ts が検知 → IPC → renderer
```

| action       | value の意味                | 例                                                                              |
| ------------ | --------------------------- | ------------------------------------------------------------------------------- |
| `speak`      | VOICEVOX で発話するテキスト | `"こんにちは！"`                                                                |
| `emotion`    | 感情名                      | `"happy"` / `"sad"` / `"surprised"` / `"angry"` / `"embarrassed"` / `"neutral"` |
| `motion`     | モーショングループ名        | `"Idle"` / `"TapBody"` / `"Shake"` / `"FlickHead"`                              |
| `expression` | 表情 ID                     | `"exp_happy"` / `"f01"` など (モデル依存)                                       |

感情とモーション/表情のデフォルトマッピング (`emotion-mapper.ts`):

| 感情        | モーション   | 表情            | 速度  | ピッチ |
| ----------- | ------------ | --------------- | ----- | ------ |
| happy       | TapBody[0]   | exp_happy       | ×1.1  | ×1.05  |
| sad         | FlickHead[0] | exp_sad         | ×0.9  | ×0.95  |
| surprised   | Shake[0]     | exp_surprised   | ×1.2  | ×1.1   |
| angry       | Shake[1]     | exp_angry       | ×1.15 | ×0.9   |
| embarrassed | TapBody[1]   | exp_embarrassed | ×1.05 | ×1.0   |
| neutral     | Idle[0]      | (なし)          | ×1.0  | ×1.0   |

---

## 8. トラブルシューティング

### Companion が表示されない

1. `electron.exe` が存在するか確認:

   ```powershell
   ls node_modules/electron/dist/electron.exe
   ```

   なければ: `node node_modules/electron/install.js`

2. ビルド済みか確認:
   ```powershell
   ls extensions/live2d-companion/electron/main.js
   ```
   なければ: `cd extensions/live2d-companion && pnpm run build`

### Live2D モデルが表示されず「Hakua (モデル未配置)」テキストのみ

- `extensions/live2d-companion/models/` に `.model3.json` を配置する
- または `companion.config.json` の `modelPath` を直接指定する
- `lib/live2dcubismcore.min.js` が存在するか確認 (`setup-live2d-sdk.ps1` 実行)

### Gateway が「already listening」で起動しない

前回のプロセスが残っている:

```powershell
pnpm openclaw --profile desktop-stack gateway stop
# または
Get-Process node | Stop-Process -Force
```

### LINE グループで返答なし

`openclaw.json` を確認:

```json
"groupPolicy": "open",
"groups": { "*": { "requireMention": false } }
```

変更後は Gateway を再起動する。

---

## 9. 既知の制限事項

| 制限                | 詳細                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Live2D ライセンス   | `live2dcubismcore.min.js` は非商用無償。商用利用は別途契約が必要                                                     |
| SDK 自動 DL         | GitHub Release URL の変更で将来 `setup-live2d-sdk.ps1` が動作しなくなる可能性あり                                    |
| モーション名        | グループ名はモデルごとに異なる。存在しないグループを指定しても silent ignore（エラーなし）                           |
| モデル自動探索      | 複数モデルがある場合、ディレクトリ走査順で最初のものが選択される                                                     |
| Ebbinghaus 連動     | `context_decay` フィールドは現状 companion 側での参照なし。AI プロンプトへの組み込みは未実装                         |
| Windows 専用        | ランチャー `.ps1` は Windows PowerShell 5.1+ 前提。macOS/Linux は未対応                                              |
| Electron バージョン | root `node_modules/electron` (v28) を使用。companion 内の `devDependencies` と乖離がある場合は `install.js` を再実行 |

---

## 10. 変更ファイル差分サマリ

```
commit f582506504
  .gitignore                                          +17
  .openclaw-desktop/openclaw.json                      +5/-2
  MODEL_CARD.md                                      (new)
  SOUL.md                                              +N
  _docs/2026-03-20_Live2DCompanion_ImplLog.md        (this file)
  _docs/2026-03-20_*.md                              (4 other docs)
  extensions/line/openclaw.plugin.json               (new)
  extensions/line/src/channel.ts                      +30/-1
  extensions/live2d-companion/**                     (all new, ~1200 lines)
  scripts/clawdbot-master.ps1                        (restored)
  scripts/setup-live2d-sdk.ps1                       (new)
  scripts/setup-shortcut.ps1                          +3/-22
  scripts/installers/create-desktop-shortcut.ps1     +44/-14
  scripts/launchers/launch-desktop-stack.ps1         +90/-60
  src/agents/openclaw-tools.ts                        +4/-0
  src/agents/tools/companion-control-tool.ts         (new)
  src/agents/tools/hakua-defense-tool.ts             (new)
  src/agents/tools/world-monitor-tool.ts             (new)
  src/infra/heartbeat-runner.ts                       (linter fmt)
```
