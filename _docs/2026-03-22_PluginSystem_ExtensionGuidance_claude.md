# エクステンション自律利用システム 実装ログ

**日付**: 2026-03-22
**担当**: Claude Sonnet 4.6
**コミット範囲**: `a9a201e` → `416300e`

---

## 概要

OpenClaw エージェント（はくあ）が自作エクステンションを **自律的に** 使えるようにするための
一連の実装。以下の 4 フェーズで実施した。

1. **FBX D&D 修正** — Electron レンダラーの bare module import 解決
2. **プラグインシステム有効化** — `openclaw.json` に `plugins` セクション新設
3. **MD ガイダンス注入** — 全エクステンションに `before_prompt_build` フック追加
4. **ドキュメント整備** — AGENTS.md + docs/tools/ + \_docs 実装ログ

---

## フェーズ 1: FBX D&D importmap 修正 (commit `a9a201e`)

### 問題

Electron レンダラー（`nodeIntegration: false`）はブラウザコンテキストで動作するため、
`import("three")` や `import("three/examples/jsm/loaders/FBXLoader.js")` のような
**bare module specifier** を標準では解決できなかった。
→ FBX・VRM コントローラーの初期化が失敗し、D&D が動作しない状態だった。

### 修正内容

**`extensions/live2d-companion/renderer/index.html`** に `<script type="importmap">` を追加:

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

| マッピング           | 解決先                                         |
| -------------------- | ---------------------------------------------- |
| `"three"`            | `three/build/three.module.js` (ESM ビルド)     |
| `"three/"`           | `three/` 以下全パス（`examples/jsm/...` 含む） |
| `"@pixiv/three-vrm"` | `three-vrm/lib/three-vrm.module.js`            |

**Electron 28 (Chromium 120)** は importmap を完全サポート。
`file://` プロトコル経由のロードでも相対パスで `node_modules` を参照できる。

### D&D フロー（コードは既実装済み）

```
.fbx をドロップ
  └─ app.js: drop イベント
       └─ file.arrayBuffer() でバイナリ読み込み
            └─ avatar type が異なれば FbxController に切り替え
                 └─ reloadModelFromBuffer(buffer, filePath)
                      └─ FBXLoader.parse(buffer)  ← XHR 不使用
                           └─ Three.js シーンに追加 → モデルバッジ更新
```

また `extensions/live2d-companion/impl-log.md` を新規作成し、
Live2D コンパニオン実装履歴を一元管理。

---

## フェーズ 2: プラグインシステム有効化 (commit `0e496ca`)

### 問題

`openclaw.json` に `plugins` セクションが**完全に存在しなかった**。
→ エクステンションが一切ロードされず、エージェントはどのツールも認識できなかった。

### 修正内容

**`.openclaw-desktop/openclaw.json`** に `plugins` セクション新設:

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

### `extensions/live2d-companion/index.ts` — `before_prompt_build` フック追加

```typescript
api.on("before_prompt_build", () => ({
  appendSystemContext: [
    "## Live2D コンパニオン ツール",
    "- voicevox_speak — ユーザーへの返答・感情表現時に積極的に呼び出す",
    "- voicevox_speak_direct — コンパニオン未起動時のフォールバック",
  ].join("\n"),
}));
```

`appendSystemContext` は静的テキストとしてプロンプトキャッシュされ、
ターンごとのトークン増コストなし。

---

## フェーズ 3: 全エクステンション MD ガイダンス + 有効化 (commit `dac40fd` → `416300e`)

### 対応した全エクステンション

| Extension          | ツール                                    | 対応内容                                               |
| ------------------ | ----------------------------------------- | ------------------------------------------------------ |
| `live2d-companion` | `voicevox_speak`, `voicevox_speak_direct` | ✅ フェーズ2で完了                                     |
| `duckduckgo`       | `web_search`                              | ✅ `before_prompt_build` + `allowPromptInjection` 追加 |
| `memory-core`      | `memory_search`, `memory_get`             | ✅ 有効化 + `before_prompt_build` 追加                 |
| `lobster`          | `lobster`                                 | ✅ 有効化 + `before_prompt_build` 追加                 |
| `llm-task`         | `llm_task`                                | ✅ 有効化 + `before_prompt_build` 追加                 |
| `vrchat-relay`     | `vrchat_*` (27 ツール)                    | ✅ 有効化 + `before_prompt_build` 追加                 |

### openclaw.json 最終形

```json
"plugins": {
  "enabled": true,
  "slots": { "memory": "memory-core" },
  "entries": {
    "live2d-companion": { "enabled": true, "hooks": { "allowPromptInjection": true }, "config": { ... } },
    "duckduckgo":       { "enabled": true, "hooks": { "allowPromptInjection": true } },
    "memory-core":      { "enabled": true, "hooks": { "allowPromptInjection": true } },
    "lobster":          { "enabled": true, "hooks": { "allowPromptInjection": true } },
    "llm-task":         { "enabled": true, "hooks": { "allowPromptInjection": true } },
    "vrchat-relay":     { "enabled": true, "hooks": { "allowPromptInjection": true } }
  }
}
```

**重要**: `memory-core` は `kind: "memory"` のスロットプラグイン。
`plugins.slots.memory: "memory-core"` がないとローダーがスキップする
（`src/plugins/loader.ts:1031` の `earlyMemoryDecision` 処理）。

### 各エクステンションの before_prompt_build ガイダンス

#### duckduckgo

```typescript
appendSystemContext: "## ウェブ検索 (DuckDuckGo)\n- web_search — 最新情報・外部ドキュメント確認に積極的に使用";
```

#### memory-core

```typescript
appendSystemContext: "## メモリ検索ツール (memory-core)\n- memory_search — 過去の会話・設定を思い出す際に積極的に使用\n- memory_get — ID 指定でエントリ取得";
```

#### lobster

```typescript
appendSystemContext: "## シェルワークフローツール (lobster)\n- lobster — JSON-first パイプライン実行、承認・再開フロー付き";
```

#### llm-task

```typescript
appendSystemContext: "## サブタスク実行ツール (llm-task)\n- llm_task — 複雑なタスクを別 LLM セッションに委譲し JSON を返す";
```

#### vrchat-relay

```typescript
appendSystemContext: "## VRChat 制御ツール (vrchat-relay)\n- vrchat_login / status — 認証（他ツール使用前に必須）\n- vrchat_chatbox — チャットボックス送信\n- vrchat_guardian_pulse_start — 自律存在パルス\n- その他 27 ツール";
```

---

## フェーズ 4: ドキュメント整備 (commit `416300e`)

### AGENTS.md — エクステンション一覧セクション追加

ファイル末尾に `## Clawdbot Active Extensions and Available Tools` セクションを追加。
AI コーディングエージェント（Claude Code 等）がリポジトリを読んだ際に、
有効なエクステンションとツールを一覧できる。

### docs/tools/ — 不足ドキュメント新規作成

| ファイル                     | 内容                                             |
| ---------------------------- | ------------------------------------------------ |
| `docs/tools/memory-core.md`  | ツール仕様・パラメーター・CLI・設定例            |
| `docs/tools/vrchat-relay.md` | 27ツール一覧・権限体系・レート制限・ワークフロー |

`docs/tools/lobster.md` と `docs/tools/llm-task.md` は既存のため対応なし。

---

## エージェント自律利用フロー（完成形）

```
OpenClaw Gateway 起動
  └─ loadOpenClawPlugins()
       └─ 各 index.ts の register(api) 呼び出し
            ├─ before_prompt_build フック登録 × 6 エクステンション
            ├─ llm_output フック登録 (live2d-companion, vrchat-relay)
            └─ ツール登録 (voicevox_speak, web_search, memory_search, lobster, llm_task, vrchat_*)

エージェント実行（各ターン）
  └─ before_prompt_build 発火
       └─ appendSystemContext で MD ガイダンス注入 × 6 本
            └─ LLM がツール定義 + ガイダンスを受け取り自律判断
                 └─ 必要なツールを自律的に呼び出し
```

---

## 変更ファイル全一覧

| ファイル                                          | 変更                               | コミット              |
| ------------------------------------------------- | ---------------------------------- | --------------------- |
| `extensions/live2d-companion/renderer/index.html` | importmap 追加                     | `a9a201e`             |
| `extensions/live2d-companion/impl-log.md`         | 新規作成                           | `a9a201e`             |
| `.openclaw-desktop/openclaw.json`                 | plugins セクション新設・拡張       | `0e496ca` → `416300e` |
| `extensions/live2d-companion/index.ts`            | `before_prompt_build` 追加         | `0e496ca`             |
| `extensions/duckduckgo/index.ts`                  | `before_prompt_build` 追加         | `dac40fd`             |
| `extensions/memory-core/index.ts`                 | `before_prompt_build` 追加         | `416300e`             |
| `extensions/lobster/index.ts`                     | `before_prompt_build` 追加         | `416300e`             |
| `extensions/llm-task/index.ts`                    | `before_prompt_build` 追加         | `416300e`             |
| `extensions/vrchat-relay/index.ts`                | `before_prompt_build` 追加         | `416300e`             |
| `AGENTS.md`                                       | エクステンション一覧セクション追加 | `416300e`             |
| `docs/tools/memory-core.md`                       | 新規作成                           | `416300e`             |
| `docs/tools/vrchat-relay.md`                      | 新規作成                           | `416300e`             |

---

## 技術的知見

### importmap と Electron

- Electron 28 (Chromium 120) は `<script type="importmap">` を完全サポート
- `file://` プロトコル経由でも `../node_modules/` への相対パスが有効
- `"three/"` のようにトレイリングスラッシュで全サブパスをまとめてマッピング可能

### before_prompt_build vs llm_output

| フック                | 用途                         | タイミング                            |
| --------------------- | ---------------------------- | ------------------------------------- |
| `before_prompt_build` | ガイダンス・ツール説明の注入 | 各ターン開始前（静的、キャッシュ可）  |
| `llm_output`          | LLM 応答後のサイドエフェクト | 応答生成後（非同期・fire-and-forget） |

### allowPromptInjection の必要性

`before_prompt_build` フックでプロンプトを変更するには、
`plugins.entries.<id>.hooks.allowPromptInjection: true` が必須。
これがないとフックは呼び出されるが結果が無視される。

### memory-core のスロット制約

`kind: "memory"` プラグインは `plugins.slots.memory` で明示的に選択しないと
ローダーが `earlyMemoryDecision` 処理でスキップする（bundled プラグイン限定の挙動）。
