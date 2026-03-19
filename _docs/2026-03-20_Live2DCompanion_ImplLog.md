# Live2D Companion 実装ログ

## Phase 1 実装ファイル一覧

| ファイル                                                    | 概要                                            |
| ----------------------------------------------------------- | ----------------------------------------------- |
| `extensions/live2d-companion/companion.config.json`         | 設定ファイル（ウィンドウ・モデル・VOICEVOX）    |
| `extensions/live2d-companion/package.json`                  | Electron/TypeScript 依存関係                    |
| `extensions/live2d-companion/tsconfig.json`                 | TypeScript コンパイル設定                       |
| `extensions/live2d-companion/bridge/event-types.ts`         | イベント型・IPC チャンネル・FLAG_FILES 定数     |
| `extensions/live2d-companion/bridge/flag-watcher.ts`        | `.openclaw-desktop/` の JSON フラグファイル監視 |
| `extensions/live2d-companion/electron/main.ts`              | Electron メインプロセス                         |
| `extensions/live2d-companion/electron/preload.ts`           | contextBridge で IPC 公開                       |
| `extensions/live2d-companion/renderer/index.html`           | レンダラー HTML                                 |
| `extensions/live2d-companion/renderer/app.ts`               | レンダラーエントリー（イベントハンドリング）    |
| `extensions/live2d-companion/renderer/live2d-controller.ts` | pixi-live2d-display ラッパー                    |
| `extensions/live2d-companion/renderer/voicevox-client.ts`   | VOICEVOX HTTP クライアント + 口パク             |
| `extensions/live2d-companion/renderer/emotion-handler.ts`   | 感情 → モーション/表情マッピング                |

## Phase 2 実装ファイル一覧

| ファイル                                                    | 変更種別 | 概要                                    |
| ----------------------------------------------------------- | -------- | --------------------------------------- |
| `scripts/setup-live2d-sdk.ps1`                              | **新規** | Cubism Web SDK 自動ダウンロード・配置   |
| `extensions/live2d-companion/renderer/model-discovery.ts`   | **新規** | `models/` 自動スキャンヘルパー          |
| `extensions/live2d-companion/electron/main.ts`              | **修正** | `ipcMain.handle("discover-model")` 追加 |
| `extensions/live2d-companion/electron/preload.ts`           | **修正** | `discoverModel` IPC 公開                |
| `extensions/live2d-companion/renderer/live2d-controller.ts` | **修正** | `"auto"` パス解決処理                   |
| `extensions/live2d-companion/companion.config.json`         | **修正** | `modelPath: "auto"` に変更              |
| `src/agents/tools/companion-control-tool.ts`                | **新規** | AI 制御ツール本体                       |
| `src/agents/openclaw-tools.ts`                              | **修正** | `createCompanionControlTool` 登録       |
| `.gitignore`                                                | **修正** | SDK・モデルファイル除外                 |

---

## SDK セットアップ

**バージョン**: CubismSdkForWeb 5-r.1
**取得元**: https://github.com/Live2D/CubismSdkForWeb/releases
**配置先**: `extensions/live2d-companion/renderer/lib/live2dcubismcore.min.js`

```powershell
# 初回セットアップ
powershell -File scripts/setup-live2d-sdk.ps1

# バージョン指定
powershell -File scripts/setup-live2d-sdk.ps1 -Version "5-r.1"
```

> **ライセンス**: live2dcubismcore.min.js は Live2D 社の利用規約に従う。非商用利用は無償、商用利用は別途ライセンス契約が必要。

---

## モデル DD フォルダーの使い方

`extensions/live2d-companion/models/` 以下に任意のフォルダーを作成し、モデルファイルを配置するだけで自動認識される。

```
extensions/live2d-companion/models/
└── hakua/
    ├── hakua.model3.json   ← このファイルが自動発見される
    ├── hakua.physics3.json
    ├── hakua.cdi3.json
    ├── textures/
    │   └── hakua.2048/texture_00.png
    └── motions/
        ├── Idle_01.motion3.json
        └── ...
```

`companion.config.json` の `"modelPath": "auto"` のまま Electron を起動すれば、最初に見つかった `.model3.json` が自動ロードされる。

---

## AI 制御ツール (`control_companion`) の使用例

OpenClaw TUI / LINE から以下のように呼び出す:

```json
// 感情設定
{ "action": "emotion", "value": "happy" }
{ "action": "emotion", "value": "sad" }
{ "action": "emotion", "value": "surprised" }

// VOICEVOX で発話（口パク付き）
{ "action": "speak", "value": "こんにちは！今日も元気だよ！" }

// モーション再生
{ "action": "motion", "value": "Idle", "motion_index": 0 }
{ "action": "motion", "value": "TapBody", "motion_index": 1 }

// 表情変更
{ "action": "expression", "value": "f01" }
```

ツールは `.openclaw-desktop/companion_emotion.json` にイベントペイロードを書き込む。
`flag-watcher.ts` がこのファイルを監視し、Electron レンダラーへ IPC 転送する。

---

## 起動手順

1. SDK セットアップ（初回のみ）:

   ```powershell
   powershell -File scripts/setup-live2d-sdk.ps1
   ```

2. モデルを `extensions/live2d-companion/models/<モデル名>/` に配置

3. VOICEVOX を起動 (http://127.0.0.1:50021)

4. Companion を起動:
   ```powershell
   cd extensions/live2d-companion
   pnpm install
   pnpm run build
   pnpm run start
   ```

---

## 既知の制限事項

- **Live2D ライセンス**: `live2dcubismcore.min.js` は非商用無償。商用利用には別途契約が必要。
- **モーション・表情グループ名の差異**: グループ名はモデルごとに異なる。AI が存在しないグループ名を指定してもエラーにはならない（`live2d-controller.ts` で silent ignore）。
- **SDK 自動ダウンロード**: GitHub Release からの直接 DL は利用規約変更で将来動作しなくなる可能性がある。その場合は手動配置を行う。
- **モデル自動探索**: 複数モデルがある場合、ディレクトリ走査順で最初のものが使われる。特定モデルを使う場合は `companion.config.json` の `modelPath` に直接パスを指定する。
