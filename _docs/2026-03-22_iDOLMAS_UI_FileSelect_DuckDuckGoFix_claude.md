# 2026-03-22 アイドルマスター風UI刷新 + ファイル選択ボタン + DuckDuckGoプラグイン修正

## 概要

- **DuckDuckGo プラグインの設定エラー修正** — 起動時の config validation エラー3件を解消
- **Live2D Companion Electron UI の大幅リデザイン** — サイバーパンクからアイドルマスター風ステージデザインへ
- **アバターファイル選択ボタン追加** — Live2D / VRM / FBX それぞれUIボタンでファイルダイアログを開けるように

---

## 1. DuckDuckGo プラグイン修正

### 問題

起動時に以下の3件のバリデーションエラーが発生していた：

```
Config invalid
- plugins: plugin: plugin manifest not found:
    extensions\duckduckgo\openclaw.plugin.json
- plugins: plugin: plugin manifest requires configSchema
- plugins: plugin: plugin manifest requires configSchema
```

### 原因

`extensions/duckduckgo/` ディレクトリには `index.ts` / `src/ddg-provider.ts` / `package.json` が存在していたが、OpenClaw が必要とするプラグインマニフェスト `openclaw.plugin.json` が存在しなかった。

マニフェストが見つからないため、バリデーターは「manifest not found」1件と「configSchema required」を派生エラーとして2件追加で報告していた（合計3件）。

### 対応

**新規作成:** `extensions/duckduckgo/openclaw.plugin.json`

```json
{
  "id": "duckduckgo",
  "name": "DuckDuckGo",
  "description": "Bundled DuckDuckGo web search provider — no API key required.",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

他プラグイン（`lobster`, `memory-core` 等）のマニフェストを参照して最小構成を採用。duckduckgo はユーザー設定可能なプロパティを持たないため `properties: {}` が適切。

---

## 2. Live2D Companion UI リデザイン

### 変更ファイル

- `extensions/live2d-companion/renderer/index.html` — HTML・CSS全面改修

### Before（サイバーパンク風）

| 要素       | 内容                                                     |
| ---------- | -------------------------------------------------------- |
| 背景       | 暗紺色グラデーション `rgba(2,5,18)` → `rgba(8,3,22)`     |
| アクセント | シアン `#00e5ff` / マゼンタ `#ff00c8`                    |
| 装飾       | ネオングリッドライン、コーナーブラケット、スキャンライン |
| アニメ     | 8秒フリッカー、4秒パルスライン                           |
| フォント   | Share Tech Mono（等幅）                                  |

### After（アイドルマスター風ステージ）

| 要素           | 内容                                                          |
| -------------- | ------------------------------------------------------------- |
| 背景           | 深紫グラデーション `#1a0533` → `#4a1080` → `#0f0838`          |
| ボーダー       | レインボーグロウ（ピンク `rgba(255,120,200,0.55)` + 紫 + 青） |
| スポットライト | 4本（ピンク/紫/青/ゴールド）が揺れるアニメーション            |
| パーティクル   | 浮遊する星 38個 + きらめきドット 18個                         |
| デコ文字       | ♥ ★ ♪ ✦ ◆ ♡ ✧ ♫ がふわふわ漂う（20個）                        |
| ステージ床     | 垂直ラインの反射 + 水平グロウライン（3秒パルス）              |
| フォント       | M PLUS Rounded 1c（丸ゴシック、Google Fonts）                 |

#### ステージスポットライト CSS

```css
.spot {
  position: absolute;
  top: -20px;
  width: 120px;
  height: 340px;
  transform-origin: top center;
  border-radius: 0 0 50% 50%;
}
.spot-1 {
  /* ピンク */
  background: linear-gradient(180deg, rgba(255, 160, 220, 0.9) 0%, transparent 100%);
  animation: spot-sway 6s ease-in-out infinite alternate;
}
/* .spot-2〜4 も同様、色と周期を変えて */
```

#### パーティクル生成（インラインスクリプト）

```javascript
// 星（drift アニメーション）
for (let i = 0; i < 38; i++) {
  // ランダムサイズ・位置・色・速度で生成
  // CSS カスタムプロパティ --dur / --delay / --peak / --dx で制御
}

// デコ文字（float アニメーション）
const decoChars = ["♥", "★", "♪", "✦", "◆", "♡", "✧", "♫"];
for (let i = 0; i < 20; i++) {
  // ランダム位置・色・サイズで生成
}
```

#### ボタンスタイル

各ボタンは `pill` 形状（`border-radius: 14px`）で統一：

| ボタン ID         | グラデーション        | glow色   |
| ----------------- | --------------------- | -------- |
| `#pick-live2d`    | `#ff6eb4` → `#ff3d9a` | ピンク   |
| `#pick-vrm`       | `#8b6fff` → `#6040e8` | 青紫     |
| `#pick-fbx`       | `#34d0e8` → `#1aabcc` | ティール |
| `#screenshot-btn` | 黄系半透明            | ゴールド |
| `#mic-btn`        | ピンク紫半透明        | ピンク   |

---

## 3. ファイル選択ボタン実装

### 変更ファイル

- `extensions/live2d-companion/renderer/index.html` — ボタン・input要素追加
- `extensions/live2d-companion/renderer/app.js` — イベントハンドラ追加
- `extensions/live2d-companion/renderer/app.ts` — 同上（TypeScript版）

### HTML 追加要素

```html
<!-- ボタンバー -->
<div id="btn-bar">
  <button class="imas-btn" id="pick-live2d">★ Live2D</button>
  <button class="imas-btn" id="pick-vrm">♦ VRM</button>
  <button class="imas-btn" id="pick-fbx">◈ FBX</button>
  <button id="screenshot-btn">📸</button>
  <button id="mic-btn">🎤</button>
</div>

<!-- 非表示ファイル入力（OSダイアログを呼ぶだけ） -->
<input id="input-live2d" type="file" accept=".model3.json,.model.json" style="display:none" />
<input id="input-vrm" type="file" accept=".vrm" style="display:none" />
<input id="input-fbx" type="file" accept=".fbx" style="display:none" />
```

### app.js / app.ts 追加ロジック

```javascript
// ボタンクリック → 対応するhidden inputをclick()して OSダイアログ起動
live2dPickBtn?.addEventListener("click", () => live2dInput?.click());
vrmPickBtn?.addEventListener("click",    () => vrmInput?.click());
fbxPickBtn?.addEventListener("click",    () => fbxInput?.click());

// ファイル選択時の共通ハンドラ
async function handleFileInput(file, type) {
  // 1. FBX/VRM は ArrayBuffer で事前読み込み（file:// XHR 回避）
  // 2. avatarType が変わる場合は destroy → createAvatarController(type) → init
  // 3. reloadModelFromBuffer (バッファあり) or reloadModel (パス) で読み込み
  // 4. modelBadge にファイル名を表示
}

// change イベントで呼び出し、e.target.value = "" で同ファイル再選択を可能に
live2dInput?.addEventListener("change", (e) => { ... e.target.value = ""; });
vrmInput?.addEventListener("change",   (e) => { ... e.target.value = ""; });
fbxInput?.addEventListener("change",   (e) => { ... e.target.value = ""; });
```

### ポイント

- Electron renderer では `<input type="file">` で選択した `File` オブジェクトに `file.path` が存在する（Electron が注入）
- FBX / VRM は `file.arrayBuffer()` で ArrayBuffer を先読みし、`reloadModelFromBuffer()` に渡すことで `file://` XHR の問題を回避
- D&D コードはそのまま残存（将来 Electron 側で有効化できるよう温存）

---

## 変更ファイル一覧

| ファイル                                          | 変更種別                                    |
| ------------------------------------------------- | ------------------------------------------- |
| `extensions/duckduckgo/openclaw.plugin.json`      | **新規作成**                                |
| `extensions/live2d-companion/renderer/index.html` | **大幅改修** (CSS全面刷新 + ボタンバー追加) |
| `extensions/live2d-companion/renderer/app.js`     | **追記** (ファイル選択ロジック約55行)       |
| `extensions/live2d-companion/renderer/app.ts`     | **追記** (TypeScript版 同上)                |
