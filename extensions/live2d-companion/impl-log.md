# Live2D Companion — 実装ログ

このファイルは `extensions/live2d-companion` の実装変更履歴を記録します。

---

## 2026-03-22

### feat(companion): OpenClaw エージェントが自律的に自作エクステンションを使用できるように設定

**問題**
`openclaw.json` に `plugins` セクションが存在しなかったため、エクステンションがロードされておらず
エージェントはツール (`voicevox_speak` 等) を認識・使用できなかった。

**変更1: `.openclaw-desktop/openclaw.json` — `plugins` セクション追加**

```json
"plugins": {
  "enabled": true,
  "entries": {
    "live2d-companion": {
      "enabled": true,
      "hooks": { "allowPromptInjection": true },
      "config": {
        "llmMirror": { "enabled": true, "maxChars": 120, "companionUrl": "http://127.0.0.1:18791/control" },
        "voicevox": { "speaker": 8, "url": "http://127.0.0.1:50021" }
      }
    },
    "duckduckgo": { "enabled": true }
  }
}
```

- `allowPromptInjection: true` — `before_prompt_build` フックによるシステムプロンプト注入を許可
- `duckduckgo` — ウェブ検索プロバイダーも同時に有効化

**変更2: `extensions/live2d-companion/index.ts` — `before_prompt_build` フック追加**

```typescript
api.on("before_prompt_build", () => {
  return {
    appendSystemContext: "## Live2D コンパニオン ツール\n...",
  };
});
```

エージェントのシステムプロンプト末尾に Markdown でツール利用ガイダンスを注入。
`appendSystemContext` はプロンプトキャッシュ対象（静的テキスト）のため、ターンごとのトークンコスト増なし。

**エクステンション自律使用フロー**

```
OpenClaw 起動
  └─ loadOpenClawPlugins()
       └─ live2d-companion/index.ts register() 呼び出し
            ├─ before_prompt_build フック登録 (appendSystemContext)
            ├─ llm_output フック登録 (自動 TTS)
            ├─ voicevox_speak ツール登録
            └─ voicevox_speak_direct ツール登録

エージェント実行
  └─ before_prompt_build → ツール利用ガイダンスがシステムプロンプトに追加
  └─ LLM がツール定義を認識 → 自律的に voicevox_speak を呼び出し可能
  └─ llm_output → 全応答を自動 VOICEVOX 読み上げ (火-and-forget)
```

---

## 2026-03-22 (continued)

### feat(duckduckgo): before_prompt_build ガイダンス追加

**背景**
`duckduckgo` は `WebSearchProvider.createTool()` 経由で `web_search` ツールを動的生成するが、
システムプロンプトへのガイダンス注入がなく、エージェントがいつ使うべきか認識できなかった。

**変更内容**

- `extensions/duckduckgo/index.ts`: `before_prompt_build` フック追加 (`appendSystemContext`)
- `.openclaw-desktop/openclaw.json`: `duckduckgo.hooks.allowPromptInjection: true` 追加

**注入されるガイダンス（MD形式）**

```
## ウェブ検索 (DuckDuckGo)
- web_search — APIキー不要。最新情報・外部ドキュメント確認に積極的に使用。
- 検索結果はスニペットのみ。詳細が必要なら URL を取得してさらに調べること。
```

**現在の対応状況**
| Extension | before_prompt_build | 有効 |
|-----------|---------------------|------|
| live2d-companion | ✅ | ✅ |
| duckduckgo | ✅ | ✅ |
| memory-core, lobster, llm-task | ❌（無効のため対応外） | ❌ |

---

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
