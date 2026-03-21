# Live2D Companion — 実装ログ

このファイルは `extensions/live2d-companion` の実装変更履歴を記録します。

---

## 2026-03-22

### fix(companion): FBX D&D importmap — bare module specifier を解決

**問題**
Electron renderer は `nodeIntegration: false` のためブラウザコンテキストで動作する。
ブラウザは `import("three")` / `import("three/examples/jsm/loaders/FBXLoader.js")` のような
bare module specifier を標準では解決できず、FBX・VRM コントローラーの初期化が失敗していた。

**原因ファイル**

- `renderer/fbx-controller.js` — `await import("three")` / `await import("three/examples/jsm/loaders/FBXLoader.js")`
- `renderer/vrm-controller.js` — `await import("three")` / `await import("@pixiv/three-vrm")` / `await import("three/examples/jsm/loaders/GLTFLoader.js")`

**修正内容 (`renderer/index.html`)**

`<script type="module" src="./app.js">` の直前に importmap を追加:

```html
<script type="importmap">
  {
    "imports": {
      "three": "../node_modules/three/build/three.module.js",
      "three/": "../node_modules/three/",
      "@pixiv/three-vrm": "../node_modules/@pixiv/three-vrm/lib/three-vrm.module.js"
    }
  }
</script>
```

- `"three"` → Three.js ESM ビルド (`three/build/three.module.js`)
- `"three/"` → Three.js サブパス全体 (`three/examples/jsm/...` をまとめて解決)
- `"@pixiv/three-vrm"` → VRM ローダー ESM ビルド

**D&D フロー（コード既実装済み、今回は解決のみ）**

```
.fbx をドロップ
  └─ app.js: drop イベント
       └─ file.arrayBuffer() でバッファ読み込み
            └─ avatar type が異なれば FbxController に切り替え
                 └─ FbxController.reloadModelFromBuffer(buffer, filePath)
                      └─ FBXLoader.parse(buffer, resourceDir)  ← XHR不使用
                           └─ Three.js シーンに追加 → モデルバッジ更新
```

---

## 2026-03-22 (earlier)

### fix(companion): FBX D&D + AI スクリーンキャプチャ

- `fbx-controller.js`: `reloadModelFromBuffer(ArrayBuffer)` 追加
  - `FBXLoader.parse()` を使用し `file://` XHR 制限を回避
- `app.js`: D&D ハンドラーで `file.arrayBuffer()` 読み込み + try/catch + エラー表示
- スクリーンキャプチャ: `desktopCapturer` API + `/screenshot` HTTP エンドポイント
- 📸 ボタン追加（UI） → AI がゲーム/ブラウザ画面を見て支援可能

### fix(companion): FBX/VRM D&D — avatar ref 再代入修正

- `avatar.destroy()` 後に新しいコントローラーを `avatar` 変数に再代入していなかった問題を修正
- `lipSync.live2d` も同時に新コントローラーへ再バインド

---

## 2026-03-21

### feat(companion): Live2D デスクトップコンパニオン 本格実装

- Electron HTTP 制御サーバー（port 18791）追加
  - `GET /state` — コンパニオン状態取得
  - `POST /control` — visible / agentId / ttsProvider / speakText 制御
  - `GET /screenshot[?capture=1]` — スクリーンショット取得
- on/off トグル、エージェント切り替え、TTS 切り替え
- VOICEVOX TTS (localhost:50021) + Web Speech API（無料フォールバック）
- Web UI サイドパネルにコンパニオンパネル追加（アイドルマスター風デザイン）
- `avatar-factory.js` — Live2D / VRM / FBX コントローラーを type に応じて動的ロード
- `fbx-controller.js` — Three.js FBXLoader ベース、リップシンク（モーフターゲット駆動）対応
- `vrm-controller.js` — @pixiv/three-vrm ベース、VRM 1.0 Unified Expression 対応
