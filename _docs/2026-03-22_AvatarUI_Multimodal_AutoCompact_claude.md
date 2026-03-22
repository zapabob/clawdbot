# 実装ログ: アバターUI本番実装 + マルチモーダルAI入力 + VRChat自動コンパクト

**日付**: 2026-03-22
**コミット**: `4b0e79547d` → `ba7c82e93b` → `16ec3fb669` → `dee846c372`
**ブランチ**: main

---

## 1. カメラ＋マイク マルチモーダル会話機能 (`4b0e79547d`)

### 背景

Live2D コンパニオンにウェブカメラとマイク入力を追加し、AIエージェントがユーザーの映像と音声をリアルタイムに受け取れるようにする。

### 実装内容

| ファイル                        | 変更                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| `bridge/event-types.ts` / `.js` | `CAMERA_FRAME`, `CAMERA_CAPTURE_REQUEST` IPC チャンネル追加                                |
| `electron/preload.ts` / `.js`   | `sendCameraFrame(base64)`, `onCameraCaptureRequest(cb)` を contextBridge に追加            |
| `electron/main.ts` / `.js`      | `ipcMain.on(CAMERA_FRAME)` で JPEG 保存、HTTP `GET /camera[?capture=1]` エンドポイント追加 |
| `renderer/index.html`           | `<video id="camera-preview">`, `<canvas id="camera-canvas">`, `#camera-btn` ボタン追加     |
| `renderer/app.js` / `.ts`       | `CameraHandler` クラス（`start()/stop()/captureFrame()`）、カメラボタンハンドラー          |

### フロー

```
getUserMedia(video) → <video> → <canvas>.drawImage() → canvas.toDataURL("image/jpeg")
→ companionBridge.sendCameraFrame(base64)
→ [main.ts] ipcMain.on("companion:camera-frame") → stateDir/companion_camera.jpg に保存
→ HTTP GET /camera?capture=1 → { ok: true, base64: "...", timestamp: ... }
```

---

## 2. アバターUI本番実装 (`ba7c82e93b`)

### 問題

`models/` ディレクトリが存在せず、Live2D Cubism SDK (`live2dcubismcore.min.js`) もないため:

```
discoverModel() IPC → scanModels("models/") → null
→ Live2DController → renderPlaceholder() → ピンクテキスト「Hakua (モデル未配置)」
→ app.js catch → stub avatar { init: async()=>{}, ... }
```

全アバター操作が no-op スタブ状態。

### 解決策

Live2D を諦め、VRM コントローラーをデフォルトにし、モデルなし時は **Three.js プログラマティック 3Dアバター** を生成。

### 変更ファイル

| ファイル                             | 変更                                                                                      |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| `renderer/app.js` / `app.ts`         | `avatarType` デフォルト `"live2d"` → `"vrm"`                                              |
| `renderer/vrm-controller.js` / `.ts` | `renderFallbackAvatar()` + 自動モデル検出 + リップシンク対応 + destroy クリーンアップ     |
| `index.ts`                           | `get_companion_input` + `companion_camera_capture` ツール登録、`before_prompt_build` 更新 |

### フォールバックアバター構成

```
Three.js プログラマティック 3D アバター:
├── 頭部 (SphereGeometry 0.35, 肌色 #ffe0d0)
├── 髪 (SphereGeometry 0.37, 暗紫 #3a1a5c, y+0.08 オフセット)
├── 左目 / 右目 (SphereGeometry 0.05, 暗色 #2a1a4a)
├── 目ハイライト (SphereGeometry 0.018, 白)
├── 口 (SphereGeometry 0.06, ピンク #e06080, scaleY でリップシンク)
├── 頬 (CircleGeometry 0.06, ピンク 透明度0.3)
└── 体 (CylinderGeometry 0.2-0.25, 紫 #6040a0)
```

### リップシンク

```javascript
setLipSyncValue(value) {
  // フォールバック: 口の scaleY で開閉
  if (this._fallbackMouth) {
    this._fallbackMouth.scale.y = 0.3 + value * 1.2;
  }
  // VRM モデル: expressionManager の "aa" viseme
  if (!this.activeViseme && this.vrm) {
    this.vrm.expressionManager?.setValue("aa", this.lipValue);
  }
}
```

### OpenClaw プラグイン入力ツール

#### `get_companion_input`

STT テキスト + カメラ JPEG を同時取得するマルチモーダルツール。

```typescript
// 1. STT結果を読む → companion_stt_result.json
// 2. カメラフレーム → HTTP GET http://127.0.0.1:18791/camera?capture=1
// 返却: [{ type: "text", text: "🎤 ..." }, { type: "image", source: { type: "base64", ... } }]
```

#### `companion_camera_capture`

カメラフレームのみ取得する軽量ツール。

#### `before_prompt_build` 更新

```
## Live2D コンパニオン ツール

### 出力（音声）
- voicevox_speak — Live2D コンパニオン経由
- voicevox_speak_direct — Python 直接呼び出し

### 入力（マルチモーダル）
- get_companion_input — STT + カメラ
- companion_camera_capture — カメラのみ
```

---

## 3. FBX コントローラー同等対応 (`16ec3fb669`)

VRM と同じフォールバックアバター + 自動モデル検出を FbxController にも追加。

| ファイル                             | 変更                                                                                                                                               |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `renderer/fbx-controller.js` / `.ts` | `renderFallbackAvatar()`, `_fallbackMouth/Group/Eyes`, `init()` に auto-discover, `setLipSyncValue()` にフォールバック, `destroy()` クリーンアップ |

FBX はカメラ座標系が VRM と異なる（100倍スケール）ため、フォールバックアバターの座標は FBX 空間に合わせて調整。

---

## 4. VRChat プラグイン インターバル変更 + 自動コンパクト (`dee846c372`)

### Guardian Pulse インターバル変更

| 項目               | 変更前 | 変更後   |
| ------------------ | ------ | -------- |
| Chatbox パルス間隔 | 5分    | **10分** |
| Emotion パルス間隔 | 15分   | **10分** |

#### 変更ファイル

| ファイル                | 変更                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| `src/guardian-pulse.ts` | デフォルト `intervalMs` 5→10min, `emotionIntervalMs` 15→10min        |
| `index.ts`              | `startGuardianPulse()` 呼び出し + ツールパラメータのデフォルト値更新 |

### OSC リスナー自動コンパクト

5分ごとに `recentMessages` を50件に自動圧縮。メモリリーク防止。

```typescript
// listener.ts
const AUTO_COMPACT_INTERVAL_MS = 5 * 60 * 1000;

// startOSCListener() 内:
autoCompactTimer = setInterval(() => {
  if (recentMessages.length > 50) {
    recentMessages.splice(0, recentMessages.length - 50);
  }
}, AUTO_COMPACT_INTERVAL_MS);
```

- `stopOSCListener()` と `resetOSC()` でタイマーを `clearInterval`。

### OpenClaw コンパクション設定

```json
// .openclaw-desktop/openclaw.json
"compaction": {
  "mode": "safeguard",
  "autoCompactInterval": "5m"
}
```

---

## ドラッグ&ドロップ対応状況

D&D は `app.js` / `app.ts` に既に実装済み:

- `.vrm` / `.fbx` / `.model3.json` ファイルを直接ドロップ
- `file.arrayBuffer()` → `reloadModelFromBuffer()` で安全にロード
- タイプが異なる場合はコントローラーを自動切替（VRM ↔ FBX ↔ Live2D）
- フォルダドロップ時はモデルファイルを再帰検索

---

## 動作確認チェックリスト

- [ ] コンパニオン起動 → models/ 空でも Three.js フォールバックアバター表示
- [ ] 🎤 ON → 話す → 口が動く（リップシンク）
- [ ] 📷 ON → カメラプレビュー表示
- [ ] VRM/FBX ファイルを D&D → 本物のアバターに切り替わる
- [ ] `get_companion_input` ツール → STT テキスト + カメラ画像返却
- [ ] `companion_camera_capture` ツール → カメラフレーム返却
- [ ] Guardian Pulse → 10分間隔で chatbox + emotion 送信
- [ ] OSC リスナー → 5分ごとにメッセージ自動コンパクト
