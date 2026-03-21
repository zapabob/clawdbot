# Live2D デスクトップコンパニオン 本格実装ログ

**日付**: 2026-03-21
**担当**: Claude Sonnet 4.6

---

## 概要

Live2D デスクトップ常駐コンパニオン（Hakua）の機能を本格実装。
VOICEVOX + Web Speech API（無料）による音声返答、Web UI サイドパネル統合、
on/off トグル、エージェント切り替えを一括実装した。

---

## 変更ファイル一覧

| ファイル                                          | 変更種別 | 概要                                         |
| ------------------------------------------------- | -------- | -------------------------------------------- |
| `bridge/event-types.ts/js`                        | 修正     | 新IPC チャンネル・フラグファイル追加         |
| `companion.config.json`                           | 修正     | TTS・エージェント・制御ポート設定追加        |
| `electron/main.ts/js`                             | 修正     | HTTP制御サーバー・状態管理・制御コマンド処理 |
| `electron/preload.ts/js`                          | 修正     | 新IPC ブリッジメソッド追加                   |
| `renderer/lip-sync.ts/js`                         | 修正     | Web Speech API フォールバック実装            |
| `renderer/app.ts/js`                              | 修正     | 新IPC イベントハンドラー                     |
| `ui/src/ui/components/companion-panel.ts`         | **新規** | サイドパネル コンパニオンウィジェット        |
| `ui/src/ui/app-render.ts`                         | 修正     | サイドバーへのパネル統合                     |
| `.openclaw-desktop/agents/main/agent/models.json` | 修正     | Moonshot AI プロバイダー追加                 |

---

## 詳細実装

### 1. bridge/event-types.ts — 新チャンネル定義

```typescript
IPC_CHANNELS = {
  ...既存...,
  SPEAK_TEXT:   "companion:speak-text",   // メイン→レンダラー: テキスト発話指示
  CONTROL:      "companion:control",       // メイン→レンダラー: 制御コマンド
  STATE_UPDATE: "companion:state-update",  // レンダラー→メイン: 状態更新
}

FLAG_FILES = {
  ...既存...,
  CONTROL: "companion_control.json",  // Web UI → フラグ経由制御（予備）
  STATE:   "companion_state.json",    // コンパニオン現在状態
}
```

新型: `CompanionControlCommand`, `CompanionStateUpdate`, `TtsProvider`

---

### 2. companion.config.json — 新設定項目

```json
{
  "ttsProvider": "voicevox", // "voicevox" | "web-speech"
  "webSpeechLang": "ja-JP", // Web Speech API 言語
  "webSpeechRate": 1.0, // 話速
  "webSpeechPitch": 1.1, // ピッチ（アイドル風に少し高め）
  "agentId": "main", // 使用エージェント ID
  "gatewayUrl": "http://127.0.0.1:18789",
  "controlPort": 18791 // HTTP制御サーバーポート
}
```

---

### 3. electron/main.ts — HTTP制御サーバー

**ポート**: `127.0.0.1:18791` (configurable via `controlPort`)

#### エンドポイント

```
GET  /state   → CompanionStateUpdate JSON を返す
POST /control → 制御コマンドを受け付ける
```

#### 制御コマンド例

```json
// コンパニオン非表示
{ "visible": false }

// エージェント切り替え
{ "agentId": "my-agent" }

// TTS プロバイダー変更
{ "ttsProvider": "web-speech" }

// テキスト発話
{ "speakText": "こんにちは！" }
```

#### 処理フロー

```
POST /control
  → handleControlCommand()
     → visible: mainWindow.show() / hide()
     → agentId: ipcMain.send(CONTROL, {agentId})  → renderer
     → ttsProvider: ipcMain.send(CONTROL, {ttsProvider}) → renderer
     → speakText: ipcMain.send(SPEAK_TEXT, text) → renderer
  → writeState() → companion_state.json
```

#### 状態ファイル

```json
// .openclaw-desktop/companion_state.json
{
  "visible": true,
  "agentId": "main",
  "ttsProvider": "voicevox",
  "speaking": false,
  "timestamp": 1748000000000
}
```

---

### 4. renderer/lip-sync.ts — TTS プロバイダー対応

#### VOICEVOX (primary)

既存の実装を維持。`http://127.0.0.1:50021` で POST `/audio_query` → `/synthesis`。

#### Web Speech API (無料フォールバック)

VOICEVOX が起動していない場合、またはプロバイダーが `"web-speech"` の場合に使用。

```typescript
async speak(text, emotionProfile?) {
  if (this.ttsProvider === "voicevox") {
    try {
      await this.speakWithVoicevox(text, emotionProfile);
      return;
    } catch {
      console.warn("VOICEVOX unavailable, fallback to Web Speech");
    }
  }
  await this.speakWithWebSpeech(text);
}
```

Web Speech リップシンク: `utterance.onboundary` (word) で口を開閉。
発話開始/終了時に `companionBridge.sendStateUpdate({speaking: bool})` で状態同期。

---

### 5. renderer/app.ts — 新IPC イベント処理

```typescript
// メインプロセスからのテキスト発話指示
window.companionBridge.onSpeakText((text) => {
  applyEmotion(live2d, detectEmotion(text));
  lipSync.speak(text);
});

// 制御イベント（エージェント/TTS切り替え）
window.companionBridge.onControlEvent((cmd) => {
  if (cmd.ttsProvider) lipSync.ttsProvider = cmd.ttsProvider;
  if (cmd.agentId) sendStateUpdate({ agentId: cmd.agentId });
});
```

---

### 6. ui/src/ui/components/companion-panel.ts — サイドパネル

**デザインテーマ**: アイドルマスター風（ピンク/紫グラデーション、星型アイコン）

#### 機能

- **ステータスドット**: オフライン（灰）/ オンライン（緑）/ 発話中（ピンク点滅）
- **on/off トグル**: `POST /control {"visible": bool}` で即座に表示/非表示
- **エージェント切り替え**: `agentsList` (props) からドロップダウン生成
- **TTS 切り替え**: VOICEVOX / Web Speech (無料) を選択可能
- **ポーリング**: 3秒間隔で `/state` を polling、オンライン検知

#### ポーリング動作

```
connectedCallback → poll() → fetch("http://127.0.0.1:18791/state")
  → online = true  → 状態表示更新
  → タイムアウト/失敗 → online = false → "オフライン" 表示
```

#### CSS: アイドルマスター風スタイル

- ヘッダー: `linear-gradient(90deg, #ff88c8, #cc88ff)` テキストグラデーション
- アクション: ピンク/紫のグロー効果
- 発話中: `animation: companion-pulse` でドット点滅
- セレクト: カスタム矢印、暗背景

---

### 7. models.json — Moonshot AI プロバイダー

OpenAI 互換 API として追加。無料枠あり（新規登録時）。

```json
"moonshot": {
  "baseUrl": "https://api.moonshot.cn/v1",
  "api": "openai",
  "apiKey": "MOONSHOT_API_KEY",
  "models": [
    {"id": "moonshot-v1-8k",  "contextWindow": 8192},
    {"id": "moonshot-v1-32k", "contextWindow": 32768}
  ]
}
```

→ Web UI の AI Agents 設定からモデルとして選択可能

---

## アーキテクチャ図

```
Web UI (localhost:18789)
  └── companion-panel.ts
       ├── GET  http://127.0.0.1:18791/state   (3秒ポーリング)
       └── POST http://127.0.0.1:18791/control (トグル/切り替え)
              ↓
       Electron main.js (HTTP サーバー port 18791)
         ├── handleControlCommand()
         │    ├── visible: mainWindow.show()/hide()
         │    ├── agentId: ipcMain.send(CONTROL, ...)
         │    ├── ttsProvider: ipcMain.send(CONTROL, ...)
         │    └── speakText: ipcMain.send(SPEAK_TEXT, ...)
         └── writeState() → companion_state.json
              ↓
       Electron renderer (app.js)
         ├── onSpeakText → lipSync.speak()
         ├── onControlEvent → lipSync.ttsProvider = ...
         └── lipSync.speak()
              ├── VOICEVOX (localhost:50021) [primary]
              └── Web Speech API             [free fallback]
                   └── window.speechSynthesis
```

---

## TTS 動作確認手順

1. VOICEVOX エンジン起動（localhost:50021）
2. コンパニオン起動: `electron extensions/live2d-companion/electron/main.js`
3. Web UI サイドパネルに「コンパニオン」ウィジェットが表示されること確認
4. ステータスドットが緑（オンライン）になること確認
5. テキスト発話テスト:
   ```bash
   curl -s -X POST http://127.0.0.1:18791/control \
     -H "Content-Type: application/json" \
     -d '{"speakText":"こんにちは、Hakuaです！"}'
   ```
6. VOICEVOX を停止した状態で発話 → Web Speech API にフォールバック確認

---

## 残タスク / 注意点

- `MOONSHOT_API_KEY` 環境変数を設定するか `.openclaw-desktop/agents/main/agent/models.json` で直接キーを入力
- companion.config.json の `"controlPort": 18791` がポートコンフリクト時は変更可能
- Web UI の `companion-panel.ts` は Shadow DOM を使用しないため、既存テーマ変数（`--color-text-muted` 等）を継承
