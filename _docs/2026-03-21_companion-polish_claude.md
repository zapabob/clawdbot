# Companion ポリッシュ / TS 修正 実装ログ

**日付**: 2026-03-21
**担当**: Claude Sonnet 4.6
**コミット範囲**: `4b7be59e22` → `f128c79b1c`

---

## 1. TS6059 rootDir エラー解消 (`a697009a49`)

### 問題

`extensions/live2d-companion/` で `tsc --noEmit` を実行すると
discord 起因のエラーが大量に出ていた:

```
../discord/api.ts(1,15): error TS6059: File '...extensions/discord/src/account-inspect.ts'
is not under 'rootDir' '...extensions/live2d-companion'.
```

### 根本原因

トランジティブインポートの連鎖:

```
extensions/live2d-companion/index.ts
  → ../../src/plugins/types.js
    → src/plugins/runtime/types-channel.ts
      → typeof import("../../../extensions/discord/runtime-api.js")
        → extensions/discord/api.ts        ← rootDir 外!
          → extensions/discord/src/...
```

`index.ts` だけが `../../src/plugins/types.js` をインポートしており、
残りの `electron/**/*.ts` / `renderer/**/*.ts` / `bridge/**/*.ts` は
`../../src/` を一切参照していなかった（確認済み）。

### 修正 (`extensions/live2d-companion/tsconfig.json`)

```diff
- "include": ["index.ts", "electron/**/*.ts", "renderer/**/*.ts", "bridge/**/*.ts"],
+ "include": ["electron/**/*.ts", "renderer/**/*.ts", "bridge/**/*.ts"],
```

**なぜこれで十分か:**

- `index.ts` は OpenClaw プラグインエントリポイントであり、
  ルートの `tsconfig.json`（`include: ["extensions/**/*"]`）がコンパイルする
- live2d-companion の local tsconfig は Electron/Renderer ビルド専用
- 生成される `.js` ファイル群に変更なし

### 追加修正 (同コミット)

`rootDir` を絞ったことで新たに現れた 2 件の型エラーも修正:

| ファイル                         | エラー                                      | 修正                                                                   |
| -------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| `renderer/app.ts:150`            | `TS2349: This expression is not callable`   | `companionBridge` を適切な型にキャスト                                 |
| `renderer/vrm-controller.ts:106` | `TS2339: 'combineSkeletons' does not exist` | `VRMUtils.combineSkeletons` は @pixiv/three-vrm v2 で削除済み → 行削除 |

**結果:** `tsc --noEmit` exit 0 / エラーゼロ

---

## 2. サイバーパンク UI + デスクトップショートカット改良 (`83834aaaea`)

### コンパニオン背景 (`renderer/index.html`)

Electron ウィンドウは `transparent: true` で透過ではあるが、
HTML コンテンツ内にサイバーパンク風の半透明背景レイヤーを追加した。

#### デザイン要素

| 要素                     | 実装                                                                   |
| ------------------------ | ---------------------------------------------------------------------- |
| ダーク半透明ベース       | `rgba(2,5,18, 0.82〜0.92)` グラデーション                              |
| ネオングリッド           | `repeating-linear-gradient` 28px ピッチ, シアン `rgba(0,255,255,0.04)` |
| スキャンライン           | `repeating-linear-gradient` 3px ピッチ, 黒 7%                          |
| フリッカーアニメ         | CSS `@keyframes cp-flicker` — 8秒周期で不定期ちらつき                  |
| コーナーブラケット       | 左上/右下: シアン `#00e5ff`、左下/右上: マゼンタ `#ff00c8`             |
| パースペクティブグリッド | 底面 70px、縦横 repeating-gradient                                     |
| パルスライン             | `@keyframes cp-pulse` — 4秒で上→下スイープ                             |
| フォント                 | Google Fonts `Share Tech Mono`（モノスペース）                         |

#### UI 要素の変更

- **マイクボタン**: ピンク系 → シアンネオン（アクティブ時マゼンタ）
- **ステータステキスト**: 白系 → シアンネオングロー
- **モデルバッジ**: ピンク → マゼンタ + `▶` プレフィックス
- **システム ID**: `HAKUA·CORE` ラベル追加（右上）
- **D&D ヒント**: `◈ DROP AVATAR FILE ◈ / .vrm / .fbx / .model3.json` に更新

### デスクトップショートカット (`scripts/installers/create-desktop-shortcut.ps1`)

**変更1**: `Clawdbot.lnk` の Description 更新

```
旧: Clawdbot — Gateway / TUI / Live2D+VOICEVOX / VRChat Relay / X Poster / Web UI
新: Clawdbot — Gateway / TUI / VRM+Live2D+VOICEVOX / VRChat Relay / X Poster / Web UI
```

**変更2**: `Hakua Companion.lnk` を新規追加

- コンパニオン Electron アプリ単体起動
- `node_modules/.bin/electron.cmd` が存在すれば直接実行
- なければ `npx electron electron/main.js` にフォールバック
- Description: `Hakua Companion — Cyberpunk AI Avatar (VRM / FBX / Live2D) + VOICEVOX`

---

## 3. JSON Import Assertions → Import Attributes 移行 (`f128c79b1c`)

### 問題

Electron 起動時に毎回 Node.js 警告が出ていた:

```
(node:XXXXX) ExperimentalWarning: Import assertions are not a stable feature of the
JavaScript language. Avoid relying on their current behavior and syntax as those might
change in a future version of Node.js.
(node:XXXXX) ExperimentalWarning: Importing JSON modules is an experimental feature
```

### 原因

`assert { type: "json" }` は **Import Assertions (Stage 2)** — Node.js で非推奨。
`with { type: "json" }` が **Import Attributes (Stage 3+)** — 正式仕様。

### 変更ファイル (5 TS ソース + 再生成 JS)

```diff
- import companionConfig from "../companion.config.json" assert { type: "json" };
+ import companionConfig from "../companion.config.json" with { type: "json" };
```

| ファイル                        | 種別       |
| ------------------------------- | ---------- |
| `electron/main.ts`              | TS ソース  |
| `renderer/app.ts`               | TS ソース  |
| `renderer/lip-sync.ts`          | TS ソース  |
| `renderer/live2d-controller.ts` | TS ソース  |
| `renderer/stt-handler.ts`       | TS ソース  |
| `electron/main.js`              | tsc 再生成 |
| `renderer/lip-sync.js`          | tsc 再生成 |
| `renderer/live2d-controller.js` | tsc 再生成 |
| `renderer/stt-handler.js`       | tsc 再生成 |

`tsc --project tsconfig.json` で `.js` ファイルを再生成後、
`assert { type: "json" }` の残存ゼロを確認してコミット。

---

## 関連コミット一覧

| コミット     | 内容                                                    |
| ------------ | ------------------------------------------------------- |
| `a697009a49` | fix(companion): TS6059 rootDir / 型エラー 2件           |
| `83834aaaea` | feat(companion): サイバーパンク UI + ショートカット改良 |
| `f128c79b1c` | fix(companion): assert → with (Import Attributes)       |
