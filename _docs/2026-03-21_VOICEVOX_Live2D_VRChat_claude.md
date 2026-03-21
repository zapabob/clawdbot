# VOICEVOX 自律音声 / Live2D DD / VRChat 本番実装ログ

**日付**: 2026-03-21
**担当**: Claude Sonnet 4.6
**コミット範囲**: `a39ee27` → `341dcfa`

---

## 1. X Poster ブラウザ自動化 (commit `a39ee27`)

### 実装内容

- `extensions/x-poster/` — git管理プラグイン追加
  - `openclaw.plugin.json` — プラグイン宣言
  - `skills/x-poster/SKILL.md` — ポスト手順スキル
  - `index.ts` / `package.json` — ビルドエントリ
- `.openclaw-desktop/openclaw.json`
  - `browser.profiles.x` — ユーザーの X.com セッション永続化
  - `browser.profiles.default` — デフォルトプロファイル
  - `mcp.servers.playwright` — `@playwright/mcp@latest` 設定

### ポスト仕様

| 項目           | 値                                   |
| -------------- | ------------------------------------ |
| 文字数上限     | **139文字以内**（ユーザー指定）      |
| アカウント     | ユーザーの X アカウント（x-profile） |
| 投稿URL        | `https://x.com/compose/post`         |
| テキストエリア | `[data-testid="tweetTextarea_0"]`    |
| 投稿ボタン     | `[data-testid="tweetButton"]`        |

### ブラウザ制御フロー

```
/x-poster スキル呼び出し
  ↓
browser: navigate → https://x.com/compose/post (profile: x)
  ↓
browser: act → tweetTextarea_0 に入力
  ↓
browser: act → tweetButton クリック
  ↓
browser: screenshot → 完了確認
```

### 関連ファイル

- `extensions/x-poster/openclaw.plugin.json`
- `extensions/x-poster/skills/x-poster/SKILL.md`
- `.openclaw-desktop/openclaw.json` (browser + mcp 追加)
- `.agents/skills/x-poster/SKILL.md` (ランタイムコピー、gitignored)

---

## 2. VRChat Relay 本番実装復元 (commit `805720b`)

### 背景

upstream マージ (`ce252e761c` 以前) で以下ファイルが失われていた:

- `extensions/vrchat-relay/src/api/telemetry.ts`
- `changeAvatar` 関数 (`src/tools/avatar.ts`)
- `sendRawOscViaPython` 関数 (`src/tools/chatbox-enhanced.ts`)
- 完全版 `extensions/vrchat-relay/index.ts`

### 復元内容（`34b4a074c8` から git checkout）

**`extensions/vrchat-relay/index.ts`** — 完全版に復元:

| 機能                                      | 説明                                                                          |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| Guardian Pulse                            | 自律存在ハートビート（5分毎チャットボックス送信）                             |
| `vrchat_guardian_pulse_start/stop/status` | Pulse 制御ツール                                                              |
| 自動起動                                  | プラグイン登録時に Guardian Pulse 自動開始                                    |
| Web API テレメトリ                        | `vrchat_get_location` / `vrchat_get_world_info` / `vrchat_get_online_friends` |
| LLM ミラーリング                          | `llm_output` → VRChat チャットボックス自動転送                                |
| `/chatbox` コマンド                       | Python OSC ブリッジ経由の直接送信                                             |
| `/osc` コマンド                           | 生 OSC パケット直接送信                                                       |
| `vrchat_change_avatar`                    | OSC 経由アバター変更                                                          |
| `mirror` config                           | `syncAiResponseToChatbox` / `maxCharacters` 設定                              |
| 型付け                                    | `OpenClawPluginApi` / `OpenClawPluginDefinition`                              |
| バージョン                                | `2026.3.2`                                                                    |

**新規追加ファイル:**

- `extensions/vrchat-relay/src/api/telemetry.ts` — VRChat Web API クライアント
  - `fetchCurrentUserLocation()` — 現在ワールド/インスタンス取得
  - `fetchWorldInfo(worldId)` — ワールド詳細取得
  - `fetchOnlineFriends()` — オンラインフレンド一覧

**復元関数:**

- `extensions/vrchat-relay/src/tools/avatar.ts` → `changeAvatar()`
- `extensions/vrchat-relay/src/tools/chatbox-enhanced.ts` → `sendRawOscViaPython()`

**ビルドエラー修正:**

- `extensions/universal-skills/index.ts` + `package.json` 追加
- `extensions/x-poster/index.ts` + `package.json` 追加
- 原因: `tsdown.config.ts` が `openclaw.plugin.json` 存在するディレクトリを全てビルド対象にするため、スキルのみプラグインにも `index.ts` が必要

### VRChat LLM ミラーリングフロー

```
AI応答 (llm_output イベント)
  ↓
マークダウン除去 + maxCharacters 制限
  ↓
[ASI_ACCEL] タグ付与
  ↓
sendChatboxMessage() (Python OSC ブリッジ)
  ↓
VRChat チャットボックス表示
```

---

## 3. Live2D VOICEVOX 自律音声 (commit `341dcfa`)

### 背景

`extensions/live2d-companion/index.ts` はスタブ（14行）のみで、
`llm_output` フックも音声ツールも未実装だった。

### 実装内容

**`extensions/live2d-companion/index.ts`** — OpenClaw プラグインとして全面実装:

#### llm_output フック（自動読み上げ）

```typescript
api.on("llm_output", (event) => {
  const spokenText = extractPlainText(fullText, maxChars);
  void postSpeak(spokenText, companionUrl);
});
```

マークダウン除去ロジック:

- fenced code blocks → 除去
- inline code → 除去
- `[label](url)` → label のみ
- `##` heading マーカー → 除去
- `*` / `_` / `~` → 除去
- 段落区切り `\n\n` → `。`
- デフォルト最大120文字

#### `voicevox_speak` ツール（Companion 経由）

```
AI → voicevox_speak → POST http://127.0.0.1:18791/control
   → Electron main.ts → IPC:companion:speak-text
   → renderer/app.ts → LipSyncController.speak()
   → VOICEVOX /audio_query + /synthesis
   → AudioContext + phoneme-based lip sync
   → Live2D リップシンクアニメーション
```

#### `voicevox_speak_direct` ツール（Python 直接）

```
AI → voicevox_speak_direct → execFile("py", ["-3", "scripts/voicevox_speak.py"])
   → VOICEVOX HTTP API → WAV 生成
   → winsound.PlaySound() (Windows 組み込み)
   → 音声再生（Live2D Electron 不要）
```

#### 設定スキーマ

```json
"live2d-companion": {
  "llmMirror": {
    "enabled": true,
    "maxChars": 120,
    "companionUrl": "http://127.0.0.1:18791/control"
  },
  "voicevox": {
    "url": "http://127.0.0.1:50021",
    "speaker": 8
  }
}
```

### `scripts/voicevox_speak.py` — スタンドアロン VOICEVOX 再生スクリプト

```bash
py -3 scripts/voicevox_speak.py --text "こんにちは" --speaker 8
```

- 追加パッケージ不要（`winsound` = Windows 組み込み）
- フォールバック: `sounddevice` + `soundfile`（インストール済みの場合）
- エラー時: stderr に出力して exit code 1

### 既存 `companion-control-tool.ts` との関係

`src/agents/tools/companion-control-tool.ts` はフラグファイル経由（300ms debounce あり）。
新実装の `voicevox_speak` は HTTP 直接送信でリアルタイム性が高い。
両者は共存し、用途に応じて使い分け可能。

---

## 現在の VOICEVOX 統合全体像

| レイヤー                    | 実装                                       | 状態        |
| --------------------------- | ------------------------------------------ | ----------- |
| Live2D Companion (Electron) | `lip-sync.ts` — VOICEVOX + リップシンク    | ✅ 完成     |
| OpenClaw プラグインフック   | `llm_output` → 自動読み上げ                | ✅ 今回実装 |
| AI 明示的発声ツール         | `voicevox_speak` / `voicevox_speak_direct` | ✅ 今回実装 |
| Python 直接スクリプト       | `scripts/voicevox_speak.py`                | ✅ 今回実装 |
| Local Voice Extension       | `src/tts.ts` — VOICEVOX + VRChat viseme    | ✅ 既存     |
| VRChat LLM ミラー           | `llm_output` → chatbox                     | ✅ 今回復元 |
| スタンドアロン確認          | `scripts/verify-voicevox.py`               | ✅ 既存     |

---

## 積み残し

- 承認待ち（`exec.approval.requested`）時に音声通知を鳴らす実装
  - 候補: `exec-approval-forwarder.ts` に `postSpeak()` 呼び出しを追加
  - または: `scripts/voicevox_speak.py` を OS 通知フックとして呼び出し

---

## 関連コミット

| コミット  | 内容                                           |
| --------- | ---------------------------------------------- |
| `a39ee27` | feat(x-poster): X ブラウザ自動化プラグイン     |
| `805720b` | feat(vrchat): VRChat 本番復元 + Guardian Pulse |
| `341dcfa` | feat(live2d): VOICEVOX 自律音声実装            |
