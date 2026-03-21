# VRM / FBX デスクトップコンパニオン 実装ログ

**日付**: 2026-03-21
**担当**: Claude Sonnet 4.6
**コミット**: `4b7be59e22`
**ブランチ**: main

---

## 概要

`extensions/live2d-companion` に VRM / FBX アバターサポートを追加した。
Live2D コンパニオン専用だった構造を `IAvatarController` インターフェースで抽象化し、
OpenClaw AI エージェントが HTTP API 経由で 3D アバターを自律制御できるようにした。

---

## 設計方針: ストラテジーパターン

```
IAvatarController (interface)
    ├── Live2DController  (pixi-live2d-display — 既存)
    ├── VrmController     (Three.js + @pixiv/three-vrm — 新規)
    └── FbxController     (Three.js FBXLoader — 新規)
```

`LipSyncController` / `emotion-mapper` / `app.ts` はすべて `IAvatarController` を参照するため、
バックエンドの切り替えが透過的に行える。

---

## 新規ファイル

### `renderer/avatar-controller.ts`

`IAvatarController` インターフェース定義。全バックエンドが実装する契約:

| メソッド                         | 説明                                               |
| -------------------------------- | -------------------------------------------------- |
| `init(container)`                | DOM コンテナへのマウント＋デフォルトモデル読み込み |
| `reloadModel(pathOrUrl)`         | ランタイムでのモデル差し替え                       |
| `playMotion(group, index, loop)` | モーション再生                                     |
| `playExpression(expressionId)`   | 表情 / ブレンドシェイプ適用                        |
| `setLipSyncValue(value)`         | 口開き量 [0,1] — リップシンク用                    |
| `lookAt(x, y)`                   | 視線方向制御 (正規化座標 [-1,1])                   |
| `destroy()`                      | GPU/Audio リソース解放                             |

---

### `renderer/vrm-controller.ts`

Three.js + `@pixiv/three-vrm` を使った VRM 1.0 アバター制御。

#### レンダリング構成

```
WebGLRenderer (alpha:true, antialias:true)
  └── Scene
        ├── AmbientLight (0xffffff, 0.6)
        ├── DirectionalLight (0xffffff, 0.8)
        └── VRM.scene (rotation.y = π でカメラ正面向き)

Camera: PerspectiveCamera(30°, position(0, 1.3, 2.8), lookAt(0, 1.0, 0))
```

#### VRM Viseme マッピング (VOICEVOX母音 → VRM 1.0 Unified Expression)

| VOICEVOX `mora.vowel` | VRM BlendShape キー |
| --------------------- | ------------------- |
| `a`                   | `aa`                |
| `i`                   | `ih`                |
| `u`                   | `ou`                |
| `e`                   | `ee`                |
| `o`                   | `oh`                |

リップシンク:

- `setLipSyncValue(v)` → 汎用 `aa` viseme を `v` で駆動
- `setViseme(vowel, v)` → 母音ごとの正確な viseme 制御（`VrmLipSyncController` から呼出可）

#### GLTFLoader + VRMLoaderPlugin

```typescript
const loader = new GLTFLoader();
loader.register((parser) => new VRMLoaderPlugin(parser));
const gltf = await loader.loadAsync(url);
const vrm = gltf.userData["vrm"] as VRM;
VRMUtils.removeUnnecessaryVertices(gltf.scene);
VRMUtils.combineSkeletons(gltf.scene);
```

---

### `renderer/fbx-controller.ts`

Three.js `FBXLoader` を使った FBX アバター制御。

#### リップシンク: モーフターゲット自動検出

以下のキー名を順に探索して口開き用モーフターゲットを特定:

```
MouthOpen / mouthOpen / Mouth_Open / mouth_open / jawOpen / JawOpen
```

`morphTargetInfluences[idx]` を直接操作してリップシンクを実現。

#### AnimationMixer

`THREE.AnimationMixer` で FBX クリップを再生。`playMotion()` で拡張可能なスタブを用意。

---

### `renderer/avatar-factory.ts`

```typescript
export type AvatarType = "live2d" | "vrm" | "fbx" | "auto";

// ファイル拡張子から型を推論
export function inferAvatarType(path: string): AvatarType;

// 動的 import でコントローラを生成（未使用バックエンドはバンドルしない）
export async function createAvatarController(type: AvatarType): Promise<IAvatarController>;
```

---

## 変更ファイル

### `renderer/live2d-controller.ts`

- `implements IAvatarController` を追加
- `lookAt(_x, _y)` スタブを追加（pixi-live2d-display の視線追跡は内部で自動処理）

### `renderer/emotion-mapper.ts`

```diff
- import type { Live2DController } from "./live2d-controller.js";
+ import type { IAvatarController } from "./avatar-controller.js";

- export function applyEmotion(controller: Live2DController, ...
+ export function applyEmotion(controller: IAvatarController, ...
```

### `renderer/lip-sync.ts`

```diff
- import type { Live2DController } from "./live2d-controller.js";
+ import type { IAvatarController } from "./avatar-controller.js";

- constructor(private readonly live2d: Live2DController) {}
+ constructor(private readonly live2d: IAvatarController) {}
```

### `renderer/app.ts`

1. **初期化**: `Live2DController` の直接生成 → `createAvatarController(configType)` に変更
2. **D&D 拡張**: `.model3.json` 専用 → `.vrm` / `.fbx` / `.model3.json` すべて対応
3. **バックエンド切替**: ドロップ先の拡張子が現在のコントローラ型と異なる場合に自動切替
4. **AI エージェント制御**: `handleAvatarCommand(cmd)` ハンドラ追加

### `bridge/event-types.ts`

```typescript
// 新規追加
export interface AvatarCommand {
  loadModel?: string;    // VRM/FBX/Live2D モデルパス
  expression?: string;  // 表情名
  motion?: string;      // モーション名
  speakText?: string;   // TTS 発話
  lookAt?: { x: number; y: number };  // 視線方向
}

// CompanionControlCommand に追加
avatarCommand?: AvatarCommand;

// IPC_CHANNELS に追加
AVATAR_COMMAND: "companion:avatar-command",
```

### `electron/main.ts`

- `handleControlCommand` に `avatarCommand` 転送を追加
- `scanModels` で `.vrm` / `.fbx` も検出

### `electron/preload.ts`

```typescript
onAvatarCommand: (callback: (cmd: AvatarCommand) => void) => {
  ipcRenderer.on(IPC_CHANNELS.AVATAR_COMMAND, (_ipcEvent, cmd) => callback(cmd));
},
```

### `companion.config.json`

```json
{
  "avatarType": "auto",   // "live2d" | "vrm" | "fbx" | "auto"
  "avatarPath": "auto",
  ...
}
```

### `package.json`

```json
"dependencies": {
  "@pixiv/three-vrm": "^2.1.0",
  "three": "^0.163.0",
  ...
},
"devDependencies": {
  "@types/three": "^0.164.0",
  ...
}
```

---

## AI エージェント制御 API

OpenClaw エージェントは HTTP 経由でアバターを自律制御できる:

```bash
curl -X POST http://127.0.0.1:18791/control \
  -H "Content-Type: application/json" \
  -d '{
    "avatarCommand": {
      "loadModel": "C:\\Users\\downl\\avatars\\hakua.vrm",
      "expression": "happy",
      "speakText": "こんにちは、パパ！",
      "lookAt": { "x": 0.0, "y": -0.1 }
    }
  }'
```

#### avatarCommand フィールド詳細

| フィールド   | 型       | 説明                                                        |
| ------------ | -------- | ----------------------------------------------------------- |
| `loadModel`  | `string` | ファイルパス (.vrm / .fbx / .model3.json)                   |
| `expression` | `string` | 表情名 (happy, sad, surprised, angry, embarrassed, neutral) |
| `motion`     | `string` | モーション名 (Idle, TapBody, Shake, FlickHead...)           |
| `speakText`  | `string` | VOICEVOX / Web Speech でリップシンク再生                    |
| `lookAt`     | `{x, y}` | 視線方向 (正規化 [-1,1]、(0,0)=中央)                        |

---

## ドラッグ&ドロップ

| ファイル種別   | 動作                                         |
| -------------- | -------------------------------------------- |
| `.vrm`         | VrmController を初期化してロード             |
| `.fbx`         | FbxController を初期化してロード             |
| `.model3.json` | Live2DController でロード（従来通り）        |
| フォルダ       | 内部を再帰探索 (VRM > FBX > Live2D の優先順) |

異なるバックエンドへの切替はドロップ時に自動的に実行される。

---

## 依存パッケージ

| パッケージ         | バージョン | 用途                                 |
| ------------------ | ---------- | ------------------------------------ |
| `three`            | ^0.163.0   | 3D レンダリング基盤                  |
| `@pixiv/three-vrm` | ^2.1.0     | VRM 1.0 ローダー + ExpressionManager |
| `@types/three`     | ^0.164.0   | TypeScript 型定義                    |

インストールは `--legacy-peer-deps` で実行（`@types/three` peer バージョン競合回避）。

---

## TypeScript チェック

```bash
npx tsc --noEmit  # exit 0 — 新規コードにエラーなし
```

`../discord/` 起因の `TS6059 rootDir` エラーは既存問題（今回の変更と無関係）。

---

## 関連コミット

| コミット     | 内容                                                                       |
| ------------ | -------------------------------------------------------------------------- |
| `4b7be59e22` | feat(companion): VRM/FBX avatar support with IAvatarController abstraction |
