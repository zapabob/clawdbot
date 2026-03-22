# fix(companion): D&D不動作 + screenshotBtn モック修正

**日付**: 2026-03-22
**担当**: claude
**対象**: `extensions/live2d-companion/`

---

## 背景・問題

### 問題1: D&Dが完全に動かない

Electron コンパニオンウィンドウに `.vrm`/`.fbx`/`.model3.json` ファイルをドラッグ&ドロップしても、
ドラッグオーバーレイが表示されず、モデルも読み込まれない。

### 問題2: 📸ボタンが app.ts に未実装

`app.js`（実際に動いているファイル）には screenshotBtn のハンドラーがあるが、
TypeScript ソース `app.ts` には追加されていなかった。
次回 `tsc` コンパイル時に消滅するリスクがあった。

---

## 根本原因分析

### D&D について

Electron の `setIgnoreMouseEvents(true, { forward: true })` はクリックスルーに使用しているが、
`{ forward: true }` が転送するのは **通常マウスイベント** (`mousemove`/`mouseenter`/`mouseleave`) のみ。
**OLE Drag-and-Drop イベント** (`dragenter`/`dragover`/`drop`) は転送されない（Windows OLE 実装の制約）。

50ms ポーリングタイマーで `getCursorScreenPoint()` とウィンドウ境界を比較し、
カーソルがウィンドウ内なら `setIgnoreMouseEvents(false)` にしているが、タイミングが合わない：

```
cursor が window 境界に到達 (drag 中)
  ├─ OLE DragEnter 発火 (即時)          ← setIgnoreMouseEvents(true) のまま → 無視される
  └─ ポーリングタイマー (0～50ms 後)    ← 遅すぎる
       └─ setIgnoreMouseEvents(false)   ← dragenter はすでに消えた
```

結果として `dragenter` を見逃すと、後続の `dragover`/`drop` も発生しない。

### screenshotBtn について

`app.ts` に `screenshotBtn` の変数宣言・イベントハンドラーが追加されていなかった。
`app.js` に手動追記されていたが、ソース (`app.ts`) との乖離が存在。

---

## 解決方針

### Fix 1: レンダラー駆動のマウス状態 IPC

`{ forward: true }` が `mouseenter`/`mouseleave` をレンダラーに転送する性質を活用する。

レンダラーで `mouseenter`/`mouseleave` を検知し、即座に IPC で main プロセスに通知。
main プロセスが `setIgnoreMouseEvents` を切り替えることで、50ms ポーリングより遥かに高速に対応できる。

**修正後のフロー:**

```
cursor が window に近づく (drag 中でも)
  └─ mouseenter → { forward: true } により renderer に転送
       └─ companionBridge.notifyMouseActive(true)  [IPC: "mouse-active"]
            └─ main: setIgnoreMouseEvents(false)   [即時、1-2ms 以内]
                  └─ OLE DragEnter 発火 → 受信できる ✅
                  └─ dragover (preventDefault) ✅
                  └─ drop → file.arrayBuffer() → reloadModelFromBuffer() ✅
```

ポーリングタイマー (50ms) はフォールバックとして残す。

### Fix 2: app.ts に screenshotBtn を追加

`app.js` と同一のハンドラーを `app.ts` に追加して同期。

---

## 変更ファイル詳細

### `electron/preload.ts` / `preload.js`

```typescript
// 追加: companionBridge に notifyMouseActive を公開
notifyMouseActive: (active: boolean) => ipcRenderer.send("mouse-active", active),
```

型宣言 (`Window.companionBridge`) にも `notifyMouseActive: (active: boolean) => void` を追加。

### `electron/main.ts` / `main.js`

```typescript
// 追加: renderer mouse-active IPC ハンドラー
ipcMain.on("mouse-active", (_event, active: boolean) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setIgnoreMouseEvents(!active, { forward: true });
});
```

### `renderer/app.ts`

追加内容:

1. `screenshotBtn` 変数宣言 (`micBtn` の隣)
2. screenshotBtn クリックハンドラー (`captureScreen()` → ステータス表示)
3. `main()` 末尾に mouseenter/mouseleave リスナー追加

```typescript
// main() 末尾
document.addEventListener("mouseenter", () => {
  window.companionBridge?.notifyMouseActive?.(true);
});
document.addEventListener("mouseleave", () => {
  window.companionBridge?.notifyMouseActive?.(false);
});
```

### `renderer/app.js`

同様に mouseenter/mouseleave リスナーを追加 (screenshotBtn は既存)。

---

## 動作確認

| テスト                        | 期待動作                                   |
| ----------------------------- | ------------------------------------------ |
| Live2D/VRM/FBX ボタンクリック | ネイティブファイルダイアログが開く         |
| `.vrm` ファイルを D&D         | VRM モデルが読み込まれる                   |
| `.fbx` ファイルを D&D         | FBX モデルが読み込まれる                   |
| `.model3.json` ファイルを D&D | Live2D モデルが読み込まれる                |
| 📸 ボタンクリック             | 「保存完了」と表示、スクリーンショット保存 |
| ウィンドウ外クリック          | デスクトップへクリックスルー               |

---

## 技術メモ

- Electron の `{ forward: true }` は WM_MOUSEMOVE をフックして Chromium に再ディスパッチするが、OLE IDropTarget インターフェースは別経路のため転送不可
- `mouseenter` は `mousemove` と違い once-per-enter/leave で発火するため IPC floodingの心配なし
- ポーリングタイマーはエッジケース（D&D 以外の場面）で引き続き有効
