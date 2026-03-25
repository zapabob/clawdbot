# Hypura Python Harness — 設計仕様書

**日付**: 2026-03-25
**ブランチ**: integrate/upstream-main-2026-03-24
**ステータス**: 設計承認済み

---

## 概要

OpenClaw AIが自律的にVRChatアバターを操作し、VOICEVOXで音声を生成し、Pythonスクリプトを書いて実行し、新しいスキルを生成できるPythonハーネス。

ハブ＆スポーク型アーキテクチャ: 中央FastAPIデーモンが常駐し、OpenClawスキル経由でAIから呼び出せる。また独立したデーモンとしてもバックグラウンドで動作する。

ShinkaEvolve（`vendor/ShinkaEvolve/`）を進化エンジンとして統合し、スクリプト・スキル・OSCシーケンス・音声台本をLLMベースの進化ループで自律改善する。

---

## アーキテクチャ

### ファイル構成

```
scripts/hypura/
├── pyproject.toml                  ← UV管理（固定依存のみ）
├── harness_daemon.py               ← FastAPI中央デーモン (port 18794)
├── osc_controller.py               ← VRChat OSC制御（常時UDP接続）
├── voicevox_sequencer.py           ← VOICEVOX + VB-Cable + 台本シーケンス
├── code_runner.py                  ← Codex/Claude呼び出し + UV実行ループ
├── skill_generator.py              ← スキル自動生成・パッケージ化
├── shinka_adapter.py               ← ShinkaEvolve進化エンジン統合
├── osc_param_map.json              ← アバターパラメーターマップ（設定）
├── harness.config.json             ← ポート・モデル・デバイス設定
└── generated/                      ← AI生成スクリプト置き場（.gitignore対象）

skills/hypura-harness/
├── SKILL.md                        ← OpenClaw AI向けスキル定義
└── scripts/
    └── start_daemon.py             ← デーモン起動ヘルパー
```

### データフロー

```
OpenClaw AI（チャット）
  ↓ hypura-harness スキル呼び出し
harness_daemon.py（FastAPI, port 18794, asyncio）
  ├── POST /osc     → osc_controller.py      → VRChat (UDP 9000)
  ├── POST /speak   → voicevox_sequencer.py  → VB-Cable → VRChat マイク
  ├── POST /run     → code_runner.py         → uv run --script → フィードバック
  ├── POST /skill   → skill_generator.py     → skills/<name>/ に配置
  ├── POST /evolve  → shinka_adapter.py      → ShinkaEvolveループ
  └── GET  /status  → 各サブシステム稼働状況
```

### 並行処理モデル

```
harness_daemon（asyncio + uvicorn）
  ├── OSCキュー（asyncio.Queue）     — 送信順序保証
  ├── VOICEVOXキュー（asyncio.Queue）— 台本の発話順保証
  ├── code_runner（ThreadPoolExecutor）— subprocess をブロックしない
  └── shinka_adapter（AsyncLLMClient）— 既存のasync対応を活用
```

---

## モデル構成

```
優先順位:
1. ollama/qwen-hakua-core           ← プライマリ（重タスク・進化・コード生成）
2. ollama/qwen-hakua-core-lite      ← 軽量サブ（感情分類・OSC判断・高頻度呼び出し）
3. openai-codex/gpt-5.4             ← フォールバック①
4. openai-codex/gpt-5.3-codex       ← フォールバック②
5. openai-codex/gpt-5.2             ← フォールバック③
```

> **注**: `qwen-hakua-core` / `qwen-hakua-core-lite` はこのプロジェクト専用のカスタムOllamaモデル。
> 既存の `openclaw.json` に設定されている `ollama/qwen3.5:9b` とは別物。
> モデルが存在しない場合は `ollama pull qwen-hakua-core` を自動実行し、
> それも失敗する場合は `qwen3.5:9b` にフォールバックする。

タスク別モデル割り当て:

| タスク                          | モデル                                                |
| ------------------------------- | ----------------------------------------------------- |
| コード生成                      | qwen-hakua-core → 失敗時 Codex CLI → openai-codex API |
| 感情分類・OSCパラメーター判断   | qwen-hakua-core-lite                                  |
| ShinkaEvolve進化（batch_query） | qwen-hakua-core                                       |
| スキルSKILL.md生成              | qwen-hakua-core                                       |

---

## 設定ファイル

### `harness.config.json`

```json
{
  "daemon_port": 18794,
  "osc_host": "127.0.0.1",
  "osc_port": 9000,
  "voicevox_url": "http://127.0.0.1:50021",
  "virtual_cable_name": "CABLE Input",
  "models": {
    "primary": "qwen-hakua-core",
    "lite": "qwen-hakua-core-lite",
    "ollama_base_url": "http://localhost:11434/v1",
    "codex_fallbacks": ["gpt-5.4", "gpt-5.3-codex", "gpt-5.2"]
  },
  "evolution": {
    "default_generations": 5,
    "max_retries_before_evolve": 3
  }
}
```

### `osc_param_map.json`

```json
{
  "emotions": {
    "happy": { "FaceEmotion": 1, "SmileIntensity": 0.8 },
    "sad": { "FaceEmotion": 2, "SmileIntensity": 0.0 },
    "angry": { "FaceEmotion": 3, "AngryBrow": 1.0 },
    "excited": { "FaceEmotion": 1, "SmileIntensity": 1.0 },
    "neutral": { "FaceEmotion": 0, "SmileIntensity": 0.2 }
  },
  "actions": {
    "jump": "/input/Jump",
    "move_forward": "/input/MoveForward",
    "move_back": "/input/MoveBackward",
    "turn_left": "/input/LookHorizontal",
    "turn_right": "/input/LookHorizontal"
  }
}
```

---

## 各モジュール詳細

### `harness_daemon.py`

FastAPI アプリ。uvicorn で起動。port 18794。

**エンドポイント:**

```
GET  /status  → { osc_connected, voicevox_alive, ollama_alive, daemon_version }
POST /osc     { "action": "chatbox|param|move|jump|emotion", "payload": {...} }
POST /speak   { "text": "...", "emotion": "happy|sad|angry|excited|neutral",
                "speaker": 8,
                "scene": [{"text":"...","emotion":"...","pause_after":0.5}] }
POST /run     { "task": "...", "model": "auto", "max_retries": 3 }
POST /skill   { "name": "...", "description": "...", "examples": ["..."] }
POST /evolve  { "target": "code|skill|osc|script",
                "seed": "...", "fitness_hint": "...", "generations": 5 }
```

デーモン未起動時、スキルが `start_daemon.py` で自動起動してからリトライ。

### `osc_controller.py`

既存 `scripts/osc_chatbox.py` を内部利用（直接書き換えなし）。

- 常時UDP接続維持（127.0.0.1:9000）
- `send_chatbox(text: str)` — チャットボックス送信
- `set_param(name: str, value: float|int|bool)` — アバターパラメーター
- `send_action(action: str, value: float = 1.0)` — 入力アクション
- `apply_emotion(emotion: str)` — `osc_param_map.json` を参照して複数パラメーターを一括送信
- `qwen-hakua-core-lite` が会話コンテキストから感情を推論し `apply_emotion()` を呼ぶ

### `voicevox_sequencer.py`

既存 `scripts/voicevox_speak.py` を内部利用（直接書き換えなし）。

**音声ルーティング:**

- `sounddevice` でVB-Cable INPUTデバイスを名前検索してそこに出力
- VRChatがマイク音声として認識し内部でリップシンク処理
- 再生中は `osc_controller.apply_emotion(emotion)` を並行実行（表情補完）

**感情→音声パラメーターマッピング:**

| 感情    | speed | pitch | intonationScale |
| ------- | ----- | ----- | --------------- |
| happy   | 1.1   | +2    | 1.3             |
| excited | 1.2   | +3    | 1.5             |
| sad     | 0.85  | -2    | 0.7             |
| angry   | 1.05  | +1    | 1.4             |
| neutral | 1.0   | 0     | 1.0             |

**台本シーケンス:**

```json
"scene": [
  {"text": "こんにちは！", "emotion": "happy", "pause_after": 0.5},
  {"text": "今日もよろしくね", "emotion": "excited", "pause_after": 1.0}
]
```

各セリフを順番に再生し `pause_after` 秒待機。

### `code_runner.py`

**UV + PEP 723インラインメタデータ方式:**

生成スクリプトに依存を埋め込み `uv run --script` で実行。`pyproject.toml` を変更しないため並列実行が安全。

```python
# AI生成スクリプトの先頭に自動付与
# /// script
# dependencies = ["requests", "pandas"]
# ///
```

**実行フロー:**

```
タスク受信
  → qwen-hakua-core でコード生成（PEP 723付き）
  → uv run --script generated/XXXX.py
  → exit_code==0 → 結果返却
  → exit_code!=0 → stderr を qwen-hakua-core-lite に渡して修正
               → 再実行（max_retries=3）
  → 全失敗    → shinka_adapter.evolve_code() に委譲
```

**コード生成呼び出し方式（CLI統一）:**

CLI方式を Primary とする。API呼び出しは使わない。

```python
# Primary: qwen-hakua-core (Ollama ネイティブ API)
# → httpx.post("http://127.0.0.1:11434/api/generate", json={...})

# Fallback A: Claude Code CLI
subprocess.run(
    ["claude", "-p", task, "--output-format", "json"],
    capture_output=True, text=True, encoding="utf-8", timeout=120
)

# Fallback B: Codex CLI
subprocess.run(
    ["codex", "--quiet", task],
    capture_output=True, text=True, encoding="utf-8", timeout=120
)
```

**ACP連携（将来拡張）**: 詰まった局面のみ OpenClaw ACP 経由で外部 coding harness に逃がす。通常実行には使わない。

### `skill_generator.py`

```
name + description + examples 受信
  → skills/skill-creator/scripts/init_skill.py 実行
  → qwen-hakua-core で SKILL.md 本文生成
  → 必要なら scripts/ に補助Pythonスクリプト生成 → uv run でテスト
  → skills/skill-creator/scripts/package_skill.py でパッケージ化
  → skills/<name>/ に配置
  → OpenClaw に即反映（再起動不要）
```

### `shinka_adapter.py`

`vendor/ShinkaEvolve` を `sys.path` 経由でインポート。
Ollama接続は **ネイティブAPI** (`http://127.0.0.1:11434`) を使う。
OpenAI互換 `/v1` は tool calling が崩れる可能性があるため使わない。

```python
# 環境変数設定（/v1 なし）
os.environ["OLLAMA_BASE_URL"] = "http://127.0.0.1:11434"
os.environ["OLLAMA_API_KEY"] = "ollama-local"

client = AsyncLLMClient(
    model_names=["qwen-hakua-core", "qwen-hakua-core-lite"],
    temperatures=[0.8, 0.6],
    model_sample_probs=[0.7, 0.3],
)
```

**モデルID注意**: 起動時に `ollama list` を実行してタグを確認し、`qwen-hakua-core` が存在しない場合は利用可能な Qwen 系タグに自動置換する。

**進化対象と fitness 評価:**

| 対象     | seed                       | fitness                                    |
| -------- | -------------------------- | ------------------------------------------ |
| `code`   | タスク説明または既存コード | `exit_code==0` + LLM出力品質スコア         |
| `skill`  | 既存SKILL.md               | トリガーテストケース通過率                 |
| `osc`    | 動作シーケンス説明         | timing smooth率 + パラメーター遷移滑らかさ |
| `script` | 台本テーマ・感情           | 感情一致度 + 文字数適正（150字以内）       |

---

## エラーハンドリング

| 障害                     | 対応                                                  |
| ------------------------ | ----------------------------------------------------- |
| VRChat未起動             | OSCメッセージをキューに積み、接続復帰時に再送         |
| VOICEVOX停止             | スキップしてテキストのみOSC chatboxへフォールバック   |
| VB-Cableデバイス不在     | デフォルト出力デバイスにフォールバック                |
| Ollamaモデル不在         | `ollama pull <model>` を自動実行して待機              |
| uv run失敗               | stderrをLLMに渡してfix → max_retries後にevolveへ      |
| ShinkaEvolveタイムアウト | 世代上限で打ち切り、最良解を返す                      |
| デーモン未起動           | スキルが `start_daemon.py` で自動起動してからリトライ |

---

## `skills/hypura-harness/SKILL.md`（骨格）

```markdown
---
name: hypura-harness
description: VRChatアバター自律制御・VOICEVOX音声台本・Pythonコード生成実行・
  スキル自動生成を行うPythonハーネス。以下のとき使う:
  (1)「VRChatで〜して」「アバターを〜」「チャットボックスに〜」→ /osc
  (2)「〜と喋って」「VOICEVOXで〜」「台本を読んで」→ /speak
  (3)「〜するPythonを書いて実行して」「スクリプトを作って動かして」→ /run
  (4)「〜というスキルを作って」「新しいスキルを追加して」→ /skill
  (5)「〜を進化させて」「もっと良くして」→ /evolve
---
```

---

## OpenClaw 設定（Hypura Harness 用エージェント）

```json
{
  "agents": {
    "defaults": {
      "workspace": "/home/downl/.openclaw/workspace",
      "model": {
        "primary": "ollama/<ollama list で確認した実在タグ>",
        "fallbacks": []
      }
    }
  },
  "models": {
    "providers": {
      "ollama": {
        "baseUrl": "http://127.0.0.1:11434",
        "api": "ollama",
        "apiKey": "ollama-local"
      }
    }
  },
  "tools": {
    "profile": "coding",
    "allow": [
      "group:fs",
      "group:runtime",
      "group:web",
      "group:messaging",
      "group:automation",
      "browser"
    ]
  }
}
```

- ツールプロファイルは `coding` ベース
- `group:fs`, `group:runtime`, `group:web`, `group:messaging`, `group:automation`, `browser` をすべて allow
- Hypura skill は `skills/hypura-harness/SKILL.md` として workspace 配下に配置

---

## デスクトップ起動スタックへの統合

`scripts/launchers/launch-desktop-stack.ps1` に追加:

```powershell
Start-Process "uv" -ArgumentList "run scripts/hypura/harness_daemon.py" -WindowStyle Hidden
```

---

## コード実行サンドボックス定義

`/run` エンドポイントはAIが生成したPythonを実行するため、以下の制約を適用する。

**実行環境:**

- `uv run --script` は独立した一時venv内で実行（プロジェクト環境を汚染しない）
- 実行タイムアウト: デフォルト60秒（`harness.config.json` で変更可）
- タイムアウト超過時は `subprocess.kill()` で強制終了

**ファイルシステム:**

- 生成スクリプトは `scripts/hypura/generated/` 以下にのみ書き込み
- 実行スクリプトのCWDは `scripts/hypura/generated/` に固定

**`generated/` ディレクトリ保持ポリシー:**

- ファイル名: `run_{timestamp}_{hash8}.py` 形式
- 最大50件保持、超過分は古い順に自動削除
- evolveで採用されたスクリプトのみ `scripts/hypura/evolved/` に移動して永続保存

**ネットワーク:**

- 生成スクリプトのネットワークアクセスは制限しない（UV仮想環境の制約内）
- 危険なコード（`os.system`、`subprocess` でのシステムコマンド等）を生成しないようAIへのプロンプトで制御

---

## `start_daemon.py` 契約

`skills/hypura-harness/scripts/start_daemon.py` の動作仕様:

```
1. GET http://127.0.0.1:18794/status を試行
2. 応答あり → 既に起動済み、スキップ
3. 接続拒否 → uv run scripts/hypura/harness_daemon.py をバックグラウンド起動
4. 最大10秒待機、1秒ごとに /status をポーリング
5. 起動確認できたら返却
6. タイムアウトしたらエラーメッセージを返却
```

PIDファイル: `.openclaw-desktop/harness_daemon.pid` に書き込み（プロセス監視用）

---

## 並行処理モデル（詳細）

```
uvicorn（asyncio イベントループ）
  │
  ├── /osc エンドポイント
  │     → asyncio.Queue (depth=100) に積む
  │     → osc_worker コルーチンが順次 UDP 送信
  │
  ├── /speak エンドポイント
  │     → asyncio.Queue (depth=20) に積む
  │     → voicevox_worker コルーチンが順次再生（同時再生しない）
  │
  ├── /run エンドポイント
  │     → loop.run_in_executor(ThreadPoolExecutor, code_runner.run)
  │     → subprocess.run(timeout=60) でブロック（スレッド内）
  │     → 結果を asyncio.Future で返却
  │
  ├── /skill エンドポイント
  │     → loop.run_in_executor(ThreadPoolExecutor, skill_generator.create)
  │
  └── /evolve エンドポイント
        → AsyncLLMClient（ShinkaEvolve）を直接 await
        → 世代ループは非同期で実行
```

バックプレッシャー: キュー満杯時は HTTP 429 を返す。

---

## 実装スコープ外（今回含まない）

- VRChat OSC受信（アバター状態の読み取り）
- リモートからのデーモン呼び出し（localhost限定）
- GUI設定画面
- Windows以外のOS対応

---

## 依存関係

| パッケージ           | 用途                     |
| -------------------- | ------------------------ |
| `fastapi`, `uvicorn` | HTTPデーモン             |
| `python-osc`         | VRChat OSC送信           |
| `sounddevice`        | VB-Cable音声出力         |
| `anthropic`          | Claude Code API呼び出し  |
| `httpx`              | OpenClaw APIクライアント |
| `filelock`           | 同時書き込み防止         |
| `shinka` (local)     | ShinkaEvolve進化エンジン |
