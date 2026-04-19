---
name: hypura-harness
description: >
  VRChatアバター自律制御・VOICEVOX音声台本・Pythonコード生成実行・スキル自動生成・
  ShinkaEvolve進化ループを持つ汎用Pythonハーネス。
  以下の場合に使う:
  (1)「VRChatで〜して」「アバターを〜」「チャットボックスに〜」→ POST /osc
  (2)「〜と喋って」「VOICEVOXで〜」「台本を読んで」→ POST /speak
  (3)「〜するPythonを書いて実行して」「スクリプトを作って動かして」→ POST /run
  (4)「〜というスキルを作って」「新しいスキルを追加して」→ POST /skill
  (5)「〜を進化させて」「もっと良くして」→ POST /evolve
  (6) LoRA カリキュラム生成・学習ジョブ → POST /lora/curriculum/build, POST /lora/train, GET /lora/jobs/{id}
  OpenClawが汎用エージェントとしてこれらのツールを組み合わせて自律的に動作する。
---

# Hypura Harness

デーモンURL: `http://127.0.0.1:18794`（OpenClaw の Bridge 既定 18790 と衝突しないよう分離）

## OpenClaw 拡張（推奨）

`plugins.entries` に **`hypura-harness`** を有効化すると、エージェントは `hypura_harness_*` ツールで上記 HTTP API を直接呼べる（Markdown の手組みより確実）。ベース URL を変えた場合は `plugins.entries["hypura-harness"].config.baseUrl` を `extensions/hypura-harness/config/harness.config.json` の `daemon_port` と一致させる。

ワークスペースに **`SOUL.md`** がある場合、プロンプトの Project Context に埋め込まれる。ルート `SOUL.md`（またはテンプレ `docs/reference/templates/SOUL.md`）の **Hypura harness** 節に従い、VRChat／VOICEVOX／コード実行／LoRA 等では **`hypura_harness_status` を先に叩き**、用途に応じて `hypura_harness_*` を自律選択すること。

## エージェントチャットで Hakua の thinking だけ止める（OpenClaw 設定）

Hypura の `/evolve`（Shinka）とは別に、**ゲートウェイ／デスクトップのエージェントが使うチャット推論**では、`agents.defaults.models` の **per-model `params.thinking`** が効く。キーは **`agents.defaults.model.primary` / fallbacks と完全一致**（`provider/modelId`、大文字小文字含む）にすること。

たとえば `openclaw.json`（`~/.openclaw/openclaw.json` や `.openclaw-desktop/openclaw.json`）に次を足す。Ollama のタグが `qwen-hakua-core` の場合と、`qwen-Hakua-core` のように別表記の場合があるので、設定済みのモデル文字列に合わせる:

```json
{
  "agents": {
    "defaults": {
      "models": {
        "ollama/qwen-hakua-core": {
          "params": { "thinking": "off" }
        },
        "ollama/qwen-hakua-core-lite": {
          "params": { "thinking": "off" }
        }
      }
    }
  }
}
```

別表記の例（デスクトップでよくある形）:

```json
"ollama/qwen-Hakua-core": { "params": { "thinking": "off" } },
"ollama/qwen-Hakua-core-lite": { "params": { "thinking": "off" } }
```

プライマリやフォールバックのどちらで選ばれても同じモデル ID なら上記で揃う。エージェントで `thinkingDefault` を上書きしている場合は、必要ならそちらも調整する。

## デーモン起動確認

まず `GET /status` で稼働確認。応答なし → 起動:

```bash
cd extensions/hypura-harness/scripts && uv run harness_daemon.py
```

または `skills/hypura-harness/scripts/start_daemon.py` を実行。

## LoRA / カリキュラム（オフライン学習）

`GET /status` と `GET /lora/status` の `lora` ブロックで、ベース重みパス（env）と Ollama 名の整合を確認する。

### 環境変数（ローカル専用・コミットしない）

- `HAKUA_BASE_MODEL_DIR` — 学習用 SafeTensor / HF 互換ローカルフォルダ
- `HAKUA_FROM_D_DATASET_DIR`, `HAKUA_SO8T_DATA_DIR`, `HAKUA_GHOST_DATASET_PATH` — 追加 JSONL / ディレクトリ
- `HAKUA_LORA_ARTIFACTS_DIR` — 成果物・ジョブ JSON のルート（未設定時は `extensions/hypura-harness/scripts/artifacts/lora`）
- `HAKUA_SOUL_PATH` — `SOUL.md` の上書きパス（省略時はリポジトリ直下の `SOUL.md`）

`extensions/hypura-harness/config/harness.config.json` の `lora` キーでも同様の値をプレースホルダで指定可能（実パスはローカルのみ）。

### エンドポイント

- `POST /lora/curriculum/build` — body: `{ "arxiv_ids": ["2603.17187","2602.04118","2512.24880"], "include_soul": true, "extra_jsonl": [] }` → `{ "job_id" }`
- `POST /lora/train` — body: `{ "dry_run": true, "dataset_path": null }`（未指定時は `artifacts/lora/curriculum/latest.jsonl`）。`dry_run: false` のときは **CUDA 上で本番 SFT（PEFT LoRA）** が走る（`uv sync --extra lora` と `HAKUA_BASE_MODEL_DIR` が必須）。ハイパーは `extensions/hypura-harness/config/harness.config.json` の `lora.sft`。詳細は `extensions/hypura-harness/scripts/LORA_PIPELINE.md`。
- `POST /lora/grpo` — body: `{ "mode": "placeholder" | "train", "dataset_path": null }`。**placeholder** は `grpo_placeholder.json`（設定・データ行数・TRL 有無）。**train** は `grpo_train_manifest.json`（第2段 GRPO 用マニフェスト；本番ループは報酬関数・参照モデル確定後）。従来の `POST /lora/grpo/placeholder` は `mode: placeholder` と同じ。

**GRPO のデータ要件（要約）**: カリキュラム JSONL に、検証可能なら `gold` / `answer`、ツール様式なら `tool_calls` / `tools`、`domain`（math / science / ai 等）を載せる。SOUL・Hakua・STEM は `curriculum/build` で統合。**手順の推奨順**: まず **SFT LoRA** で形式・ツール・テンプレを固め、次に **GRPO**（検証報酬・KL）で推論段を強化。[arXiv:2602.04118](https://arxiv.org/abs/2602.04118) は SFT と RL の更新効率の違いの参照。設定キーは `extensions/hypura-harness/config/harness.config.json` の `lora.grpo`（`reward`, `kl_coef`, `ref_model_dir`, 列名など）。

- `GET /lora/jobs/{job_id}` — 非同期ジョブの状態

詳細・HF 公開チェックリスト・imatrix 位置づけ: `extensions/hypura-harness/scripts/LORA_PIPELINE.md`

### Studio UI（任意）

```bash
cd extensions/hypura-harness/scripts && uv sync --extra studio && uv run python studio_app.py
```

既定 `http://127.0.0.1:18792`（`HYPURA_STUDIO_PORT` で変更）。ハーネス URL は `HYPURA_HARNESS_URL`。

### OpenSpace 連携（任意）

実行時のスキル自己進化・共有: [HKUDS/OpenSpace](https://github.com/HKUDS/OpenSpace) を MCP に追加し、`openspace-mcp` と `OPENSPACE_HOST_SKILL_DIRS` 等を設定（本リポジトリのコア手順ではない）。

### ツールコール様式の保持

教師 JSONL に OpenClaw / OpenAI 形式の `tool` 呼び出し例を含め、KL 参照ポリシー（計画どおり）でベースからの逸脱を抑える。評価は合成ツール呼び出しスモーク推奨。

## エンドポイント早見表

### /osc — VRChat制御

```json
{"action":"chatbox","payload":{"text":"こんにちは！"}}
{"action":"emotion","payload":{"emotion":"happy"}}
{"action":"jump","payload":{}}
{"action":"move_forward","payload":{"value":1.0}}
{"action":"param","payload":{"name":"FaceEmotion","value":1}}
```

### /speak — VOICEVOX台本

```json
{"text":"こんにちは","emotion":"happy","speaker":8}
{"scene":[{"text":"やあ","emotion":"happy","pause_after":0.5},{"text":"元気？","emotion":"neutral","pause_after":1.0}]}
```

### /run — コード生成・実行

```json
{ "task": "CSVを読んでグラフを作るスクリプトを書いて実行して" }
```

### /skill — スキル自動生成

```json
{ "name": "my-skill", "description": "○○をする", "examples": ["使用例1", "使用例2"] }
```

### /evolve — ShinkaEvolve進化

```json
{
  "target": "code",
  "seed": "既存コード",
  "fitness_hint": "エラーなく実行できること",
  "generations": 5
}
```

## OpenClawを汎用エージェントとして使う

OpenClawはこのスキル経由でハーネスの全ツールを組み合わせられる:

- ユーザーの要求を分析 → 適切なエンドポイントを選択
- 複数ステップのタスクを順次実行
- 失敗時は `/evolve` で改善ループ
- 新しい能力が必要な場合は `/skill` で自己拡張
