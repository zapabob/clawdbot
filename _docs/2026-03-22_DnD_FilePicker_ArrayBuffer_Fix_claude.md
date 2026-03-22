# fix(companion): D&D + ファイルピッカー完全修正 + osc_chatbox Unicode 修正

**日付**: 2026-03-22
**担当**: claude
**対象**: `extensions/live2d-companion/`, `scripts/osc_chatbox.py`

---

## 背景・問題

### 問題1: D&D が依然として作動しない

前回の `mouseenter` IPC 修正後も、ファイルエクスプローラーから `.vrm`/`.fbx`/`.model3.json` を
コンパニオンウィンドウにドラッグ&ドロップしてもモデルが読み込まれない。

### 問題2: ファイルピッカーでモデルが読み込まれない（モック状態）

ボタンクリック → ダイアログ → ファイル選択 → しかしモデルが画面に表示されない。
ダイアログ自体は正常に開く。

### 問題3: osc_chatbox.py の UnicodeEncodeError

VRChat chatbox に絵文字・日本語を含むメッセージを送ると Python がクラッシュする。

```
UnicodeEncodeError: 'cp932' codec can't encode character '✨' in position 14
```

---

## 根本原因分析

### D&D: OLE IDropTarget / WS_EX_TRANSPARENT 非互換

`setIgnoreMouseEvents(true)` は Windows の `WS_EX_TRANSPARENT` 拡張スタイルを設定する。

このフラグがあるとウィンドウは `WindowFromPoint()` の返り値リストから**完全に除外**される。
OLE Drag-and-Drop は `IDropTarget::DragEnter` をデリバリーする際に `WindowFromPoint()` で
対象ウィンドウを特定するため、`WS_EX_TRANSPARENT` 状態のウィンドウには
**D&D イベントが永遠に届かない**。

```
OLE DragEnter フロー:
  cursor が移動 → DoDragDrop() が WindowFromPoint() を呼ぶ
    ↓
  WS_EX_TRANSPARENT なら → そのウィンドウはスキップ → DragEnter 届かない
```

**前回修正（`mouseenter` IPC）が効かない理由**:

`{ forward: true }` は `WM_MOUSEMOVE` を Chromium に再ディスパッチするが、
OLE ドラッグ中は **drag source HWND がマウスをキャプチャ**する。
companion HWND の `WM_MOUSEMOVE` フックが発火しないため `mouseenter` が renderer に届かない。

**50ms ポーリングのレースコンディション**:

```
cursor が window 境界に到達 (drag 中)
  ├─ OLE DragEnter 発火 (即時)      ← WS_EX_TRANSPARENT のまま → 無視
  └─ ポーリング (0〜50ms 後)        ← 遅すぎる
       └─ setIgnoreMouseEvents(false) ← dragenter はすでに消えた
```

### ファイルピッカー: Buffer → Uint8Array IPC デシリアライズ

`fs.readFile()` は Node.js の `Buffer` を返す。`Buffer` は `Uint8Array` のサブクラスだが、
IPC の `contextIsolation: true` + `nodeIntegration: false` 環境では
renderer 側でデシリアライズされる際に **`Uint8Array` に変換される**（`Buffer` の型情報は失われる）。

```typescript
// main プロセス
const buffer = await fs.readFile(filePath); // Node.js Buffer
return { ok: true, filePath, buffer };

// renderer プロセス (IPC 経由)
result.buffer; // → Uint8Array  ← Buffer ではない!
```

`GLTFLoader.parse(data, ...)` の内部:

```javascript
if (data instanceof ArrayBuffer) {
  // ← Uint8Array は instanceof ArrayBuffer = false → 分岐に入らない
}
```

→ ローダーがファイルデータを無視 → モデルが表示されない

### osc_chatbox.py: Windows cp932 エンコーディング

Windows コンソールのデフォルトコードページは cp932 (Shift-JIS)。
Python の `sys.stdout` はコンソールのコードページを使うため、
cp932 に存在しない文字（絵文字、一部の記号）を `print()` すると
`UnicodeEncodeError` がスローされる。

---

## 解決方針

### Fix 1: 30px バッファゾーン + 8ms ポーリング

ウィンドウ境界の **外側 30px** まで `setIgnoreMouseEvents(false)` を先行して設定する。

```
cursor がウィンドウ境界の 30px 手前に到達
  → 8ms 以内にポーリングが検知
  → setIgnoreMouseEvents(false)  [WS_EX_TRANSPARENT 解除]
  → cursor が境界を越える
  → WindowFromPoint() がウィンドウを返す
  → OLE DragEnter 受信 ✅
```

バッファゾーン外（30px より遠い）でクリックしても、デスクトップウィンドウへ転送されるので
クリックスルー動作への影響はない。

### Fix 2: Buffer → ArrayBuffer 変換

```typescript
const nodeBuffer = await fs.readFile(filePath);
const arrayBuffer = nodeBuffer.buffer.slice(
  nodeBuffer.byteOffset,
  nodeBuffer.byteOffset + nodeBuffer.byteLength,
) as ArrayBuffer;
return { ok: true, filePath, buffer: arrayBuffer };
```

`nodeBuffer.buffer` は Node.js Buffer が内部で使っている `ArrayBuffer`（共有プール）。
`.slice(byteOffset, byteOffset + byteLength)` でバッファの該当部分をコピーし、
真の `ArrayBuffer` を renderer に送る。

### Fix 3: stdout UTF-8 強制

```python
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
```

Python 3.7+ の `TextIOWrapper.reconfigure()` を使い、stdout を UTF-8 モードに切り替える。
`errors="replace"` でエンコード不可な文字を `?` に置換するフォールバック付き。

---

## 変更ファイル詳細

### `electron/main.ts` / `main.js`

**Fix 1 — ポーリング高速化 + バッファゾーン**:

```typescript
const POLL_BUFFER_PX = 30;
function startIgnoreMouseTimer(): ReturnType<typeof setInterval> {
  return setInterval(() => {
    ...
    const inL =
      pos.x >= b.x - POLL_BUFFER_PX &&
      pos.x <= b.x + b.width + POLL_BUFFER_PX &&
      pos.y >= b.y - POLL_BUFFER_PX &&
      pos.y <= b.y + b.height + POLL_BUFFER_PX;
    const inP =
      pos.x >= b.x * sf - POLL_BUFFER_PX &&
      pos.x <= (b.x + b.width) * sf + POLL_BUFFER_PX &&
      pos.y >= b.y * sf - POLL_BUFFER_PX &&
      pos.y <= (b.y + b.height) * sf + POLL_BUFFER_PX;
    mainWindow.setIgnoreMouseEvents(!(inL || inP), { forward: true });
  }, 8);  // 50ms → 8ms
}
```

**Fix 2 — open-file-dialog Buffer→ArrayBuffer**:

```typescript
// 型シグネチャ: buffer?: Buffer → buffer?: ArrayBuffer

const nodeBuffer = await fs.readFile(filePath);
const arrayBuffer = nodeBuffer.buffer.slice(
  nodeBuffer.byteOffset,
  nodeBuffer.byteOffset + nodeBuffer.byteLength,
) as ArrayBuffer;
return { ok: true, filePath, buffer: arrayBuffer };
```

### `scripts/osc_chatbox.py`

```python
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
```

---

## 動作確認

| テスト                                      | 期待動作                              |
| ------------------------------------------- | ------------------------------------- |
| `.vrm` D&D                                  | VRM モデルが読み込まれて表示される    |
| `.fbx` D&D                                  | FBX モデルが読み込まれて表示される    |
| `.model3.json` D&D                          | Live2D モデルが読み込まれて表示される |
| VRM ボタン → ダイアログ → 選択              | モデルが表示される（モックではない）  |
| FBX ボタン → ダイアログ → 選択              | モデルが表示される                    |
| `py -3 scripts/osc_chatbox.py "✨テスト✨"` | UnicodeEncodeError が出ない           |

---

## 技術メモ

- `WS_EX_TRANSPARENT` は `WindowFromPoint()` から完全に除外するため、OLE D&D との根本的な非互換がある。30px バッファゾーンはこの非互換を回避する実用的なワークアラウンド。
- 将来的には `DragAcceptFiles()` や Electron の `webContents.session.protocol` 経由の代替アーキテクチャも検討できるが、現状は 30px バッファで十分。
- Node.js `Buffer.buffer` は内部共有プールを指す場合があるため `slice()` でコピーが必要（`subarray()` は参照のため不可）。
