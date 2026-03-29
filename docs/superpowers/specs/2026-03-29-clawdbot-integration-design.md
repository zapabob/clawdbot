# clawdbot 統合アーキテクチャ設計書

# clawdbot Integration Architecture Design

**Date / 日付**: 2026-03-29
**Status / ステータス**: Approved / 承認済み
**Scope / スコープ**: 初回ダウンロード機能 · Sync-OpenClawDesktop · ATLAS ↔ Hypura ↔ AI Scientist Lite ↔ ShinkaEvolve

---

## 1. Overview / 概要

clawdbot は OpenClaw Desktop エージェント基盤の上に、以下の AI パイプラインを統合する：

| レイヤー     | コンポーネント                 | 役割                                                  |
| ------------ | ------------------------------ | ----------------------------------------------------- |
| コード生成   | ATLAS V3 (fork: zapabob/ATLAS) | 74.6% LiveCodeBench pass@1-v(k=3)、RTX 3060 1枚で動作 |
| 失敗分析     | AI Scientist Lite              | 失敗パターン → 改善仮説（fitness_hint）生成、1時間毎  |
| 進化最適化   | ShinkaEvolve (SakanaAI fork)   | LLM ベース進化アルゴリズム、3世代                     |
| 継続学習     | TinyLoRA + lora_watcher        | 成功例 → LoRA SFT → Ollama ホットリロード             |
| 統合ブリッジ | Hypura Harness                 | `/evolve` HTTP エンドポイント、Redis I/O              |
| 設定同期     | Sync-OpenClawDesktop.ps1       | リポジトリ設定 → `.openclaw-desktop/`                 |

### 設計方針

- **Redis をデータバスとする**: すべてのコンポーネント間通信は Redis のリスト/ハッシュ/Pub-Sub 経由
- **冪等な初期セットアップ**: `pnpm setup` は何度実行しても同じ状態になる（既存ファイルはスキップ）
- **openclaw.json を設定の Single Source of Truth**: 起動時に `harness.config.json` へ自動同期

---

## 2. Sync-OpenClawDesktop — 現状 (as-is)

`scripts/Sync-OpenClawDesktop.ps1` による 6 ステップの同期フロー：

| Step | 内容                                               | 方向                                         | 上書き？                              |
| ---- | -------------------------------------------------- | -------------------------------------------- | ------------------------------------- |
| 1    | `.env` キーマージ                                  | リポジトリ → `.openclaw-desktop/.env`        | 新キーのみ追加（`-Force` で上書き可） |
| 2    | `openclaw.json` ディープマージ                     | template → `.openclaw-desktop/openclaw.json` | 新キーのみ（`-Force` で上書き可）     |
| 3    | `agents/`                                          | no-op（gitignore 対象）                      | —                                     |
| 4    | `skills/`                                          | リポジトリ → `.openclaw-desktop/skills/`     | 常に上書き（最新を反映）              |
| 5    | `.python/` + `vendor/` コピー                      | リポジトリ → `.openclaw-desktop/`            | 既存スキップ（`-Force` で上書き）     |
| 6    | `vendor/` パッケージを harness venv へインストール | `uv pip install -e` / pip / `py -3 -m pip`   | 毎回実行（editable install は冪等）   |

### 統合ポイント

```powershell
# scripts/launchers/Sovereign-Portal.ps1 (起動時に自動実行)
& $syncPs1 -ProjectDir $ProjectDir -Quiet

# package.json
"setup":     "powershell -File scripts/Sync-OpenClawDesktop.ps1"
"setup:dry": "powershell -File scripts/Sync-OpenClawDesktop.ps1 -DryRun"
```

---

## 3. 初回ダウンロード機能設計 (to-be)

### 3.1 対象コンポーネントと取得元

| コンポーネント         | 取得元                                                                   | ローカルパス           | サイズ目安  | 用途                                 |
| ---------------------- | ------------------------------------------------------------------------ | ---------------------- | ----------- | ------------------------------------ |
| Python 3.14 embeddable | `https://www.python.org/ftp/python/3.14.3/python-3.14.3-embed-amd64.zip` | `.python/`             | ~170 MB     | harness / AI Scientist Lite 実行環境 |
| ATLAS V3               | `github.com/zapabob/ATLAS` (tarball)                                     | `vendor/ATLAS/`        | ~31 MB 以下 | コード生成エンジン                   |
| ShinkaEvolve           | `github.com/SakanaAI/ShinkaEvolve` (tarball)                             | `vendor/ShinkaEvolve/` | 既存        | 進化エンジン                         |
| AI-Scientist           | `github.com/SakanaAI/AI-Scientist` (tarball)                             | `vendor/AI-Scientist/` | TBD         | フル AI Scientist（オプション）      |

> **Note**: AI Scientist **Lite** (`ai_scientist_lite.py`) はすでに `extensions/hypura-harness/scripts/` にある。`vendor/AI-Scientist/` は SakanaAI 公式のフル実装（オプション取得）。

### 3.2 ダウンロードスクリプト仕様

**新規ファイル**: `scripts/Download-Vendor.ps1`

```powershell
param(
    [string]$ProjectDir = (Get-Item $PSScriptRoot).Parent.FullName,
    [string[]]$Component,   # 絞り込み: "python", "ATLAS", "ShinkaEvolve", "AI-Scientist"
    [switch]$Force,          # 既存を上書き
    [switch]$DryRun
)
```

フロー：

1. `scripts/vendor-manifest.json` をロード
2. 各コンポーネントについて：
   - a. ローカルパスが存在し `-Force` なければスキップ（冪等）
   - b. `type == "zip-extract"` → `Invoke-WebRequest` で直接 URL からダウンロード
   - c. `type == "github-tarball"` → `https://github.com/{repo}/archive/refs/heads/{ref}.zip` からダウンロード
   - d. `Expand-Archive` → 一時ディレクトリへ展開 → ターゲットパスへ移動
   - e. `install == true` → harness venv へ `pip install -e`

### 3.3 vendor-manifest.json スキーマ

**新規ファイル**: `scripts/vendor-manifest.json`

```json
{
  "python": {
    "url": "https://www.python.org/ftp/python/3.14.3/python-3.14.3-embed-amd64.zip",
    "target": ".python",
    "type": "zip-extract",
    "install": false,
    "description": "Python 3.14 embeddable (Windows amd64)"
  },
  "ATLAS": {
    "repo": "zapabob/ATLAS",
    "ref": "main",
    "target": "vendor/ATLAS",
    "type": "github-tarball",
    "install": true,
    "description": "ATLAS V3 coding pipeline (zapabob fork with Hypura integration)"
  },
  "ShinkaEvolve": {
    "repo": "SakanaAI/ShinkaEvolve",
    "ref": "main",
    "target": "vendor/ShinkaEvolve",
    "type": "github-tarball",
    "install": true,
    "description": "ShinkaEvolve evolutionary optimization engine"
  },
  "AI-Scientist": {
    "repo": "SakanaAI/AI-Scientist",
    "ref": "main",
    "target": "vendor/AI-Scientist",
    "type": "github-tarball",
    "install": false,
    "description": "SakanaAI AI-Scientist full framework (optional)"
  }
}
```

### 3.4 pnpm setup との統合

`package.json` の `setup` スクリプトを拡張：

```json
"setup":         "powershell -File scripts/Download-Vendor.ps1 ; powershell -File scripts/Sync-OpenClawDesktop.ps1",
"setup:dry":     "powershell -File scripts/Download-Vendor.ps1 -DryRun ; powershell -File scripts/Sync-OpenClawDesktop.ps1 -DryRun",
"setup:force":   "powershell -File scripts/Download-Vendor.ps1 -Force ; powershell -File scripts/Sync-OpenClawDesktop.ps1 -Force"
```

または `Sync-OpenClawDesktop.ps1` の先頭から `Download-Vendor.ps1` を呼ぶ方法も可。

---

## 4. ATLAS ↔ Hypura ↔ AI Scientist Lite ↔ ShinkaEvolve 統合アーキテクチャ

### 4.1 コンポーネント一覧

| コンポーネント     | ファイル                                                  | ポート / 種別                                                                                       | 言語            |
| ------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------- |
| ATLAS task-worker  | `vendor/ATLAS/atlas/task-worker/worker.py`                | Docker サービス                                                                                     | Python          |
| ATLAS sandbox      | `vendor/ATLAS/atlas/sandbox/executor_server.py`           | port 8020                                                                                           | Python          |
| ATLAS rag-api      | `vendor/ATLAS/rag-api/`                                   | port 8001                                                                                           | Python          |
| llama-service      | `vendor/ATLAS/llama-server/`                              | port 8000                                                                                           | C++ (llama.cpp) |
| Hypura Harness TS  | `extensions/hypura-harness/index.ts`                      | OpenClaw plugin                                                                                     | TypeScript      |
| Hypura daemon      | `extensions/hypura-harness/scripts/harness_daemon.py`     | port 18794 (FastAPI)                                                                                | Python          |
| AI Scientist Lite  | `extensions/hypura-harness/scripts/ai_scientist_lite.py`  | Docker サービス（1h毎）— `atlas:failures → shinka:fitness_hints`                                    | Python          |
| AI Scientist Pulse | `extensions/hypura-harness/scripts/ai_scientist_pulse.py` | Docker サービス（1h毎）— 自律研究ループ (Scavenge→Propose→Verify→Report)、`_docs/resonance/` へ記録 | Python          |
| lora_watcher       | `extensions/hypura-harness/scripts/lora_watcher.py`       | Docker サービス                                                                                     | Python          |
| ShinkaEvolve       | `vendor/ShinkaEvolve/shinka/core/`                        | harness_daemon 経由呼出し                                                                           | Python          |
| Redis              | `docker-compose.override.yml`                             | port 6379                                                                                           | —               |

### 4.2 Redis キーマップ（完全版）

| キー                   | 型      | 書き込み元                  | 読み取り先        | 保持数    | 用途                                      |
| ---------------------- | ------- | --------------------------- | ----------------- | --------- | ----------------------------------------- |
| `tasks:p0`             | List    | openclaw agent              | task-worker       | unlimited | タスクキュー（INTERACTIVE 優先度）        |
| `tasks:p1`             | List    | openclaw agent              | task-worker       | unlimited | タスクキュー（FIRE_FORGET）               |
| `tasks:p2`             | List    | openclaw agent              | task-worker       | unlimited | タスクキュー（BATCH）                     |
| `task:{id}`            | Hash    | task-worker                 | openclaw          | TTL       | タスク状態・メタデータ                    |
| `results:{id}`         | Hash    | task-worker                 | openclaw          | TTL       | 実行結果・最終コード                      |
| `task:complete:{id}`   | Pub/Sub | task-worker                 | openclaw          | —         | 完了通知チャンネル                        |
| `training:examples`    | List    | `_store_training_example()` | lora_watcher      | unlimited | 成功例（LoRA 学習データ）                 |
| `atlas:failures`       | List    | `_record_failure()`         | ai_scientist_lite | max 500   | 失敗パターン（`ltrim -500` で上限管理）   |
| `shinka:fitness_hints` | List    | ai_scientist_lite           | ShinkaEvolve      | max 100   | 改善方向ヒント（`ltrim -100` で上限管理） |
| `metrics:daily:{date}` | Hash    | `metrics.py`                | atlas-dashboard   | per day   | 日次パフォーマンス集計                    |
| `metrics:recent_tasks` | List    | `metrics.py`                | atlas-dashboard   | max N     | 最近のタスク一覧                          |

### 4.3 全体シーケンス図

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[定期実行: AI_SCIENTIST_INTERVAL_SEC = 3600 秒 (1 時間毎)]

  ai_scientist_lite
    ← Redis: atlas:failures  lrange(-20, -1)
    → llama-service :8000   POST /v1/chat/completions
        system: "analyze failures → generate 3 hypotheses (fitness_hint)"
        temperature: 0.7, max_tokens: 512
    → Redis: shinka:fitness_hints  rpush × 3, ltrim(-100)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[リアルタイム: タスク処理]

  openclaw agent (port 18789)
    → Redis: tasks:p{0|1|2}  rpush(task_json)

  ATLAS task-worker
    ← Redis: tasks:p0 (blpop, priority順)
    → RalphLoop.run() × RALPH_MAX_RETRIES
      → executor.py → sandbox :8020 (コード実行・テスト)
      → rag-api :8001 (コンテキスト取得)
      → llama-service :8000 (コード生成)

      ┌── 成功 (pass all tests) ──────────────────────────────────────┐
      │  _store_training_example()                                     │
      │  → Redis: training:examples  rpush(jsonl)                     │
      │      ↓                                                         │
      │  lora_watcher                                                  │
      │      ← Redis: training:examples  blpop                        │
      │      → TinyLoRA SFT (arXiv:2602.04118, 13 params, GRPO)      │
      │      → Ollama hot-reload (新 LoRA アダプタ反映)               │
      └───────────────────────────────────────────────────────────────┘

      ┌── 失敗 (max_attempts 到達) ───────────────────────────────────┐
      │  _record_failure()                                             │
      │  → Redis: atlas:failures  rpush(failure_json), ltrim(-500)   │
      │                                                                │
      │  [HYPURA_EVOLVE_ENABLED=true の場合]                          │
      │  _try_evolve()                                                 │
      │  → POST http://hypura-harness:18794/evolve                    │
      │      body: {                                                   │
      │        target: "code",                                         │
      │        seed: result.final_code,                               │
      │        fitness_hint: "Fix: {error}. Task: {prompt[:200]}",   │
      │        generations: 3                                          │
      │      }                                                         │
      │    → harness_daemon.py (FastAPI)                              │
      │      → ShinkaEvolve AsyncEvolutionRunner                      │
      │          ← Redis: shinka:fitness_hints  lrange(-10, -1)       │
      │          → LLM mutation operators (qwen-Hakua-core2)          │
      │          → fitness evaluation (sandbox 実行 × generations)   │
      │          → 最良個体を選択                                      │
      │      ← evolved_code (string)                                  │
      │  result.final_code = evolved_code                             │
      │  result.success = True                                        │
      └───────────────────────────────────────────────────────────────┘

    → Redis: task:{id}  hset(result)
    → Redis: task:complete:{id}  publish
    → Redis: metrics:daily:{date}  hincrby

  openclaw agent
    ← Redis: task:complete:{id}  subscribe
    ← Redis: results:{id}  hgetall
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4.4 設定ファイルマップ

```
.openclaw-desktop/openclaw.json        ← ユーザー設定の Single Source of Truth
  └─ models.primary: "ollama/qwen-Hakua-core2"
  └─ models.subagentModel: "ollama/qwen-Hakua-core2"
         ↓ (Start-Hypura-Harness.ps1 起動時に自動同期)
extensions/hypura-harness/config/harness.config.json
  └─ models.primary                    → harness_daemon.py の LLM 呼び出し
  └─ models.ollama_base_url            → ShinkaEvolve llm/ インターフェイス
  └─ evolution.default_generations: 5  ← /evolve デフォルト（worker.py は 3 を上書き）
  └─ daemon_port: 18794

vendor/ATLAS/.env  (docker-compose で読み込み)
  └─ HYPURA_URL: "http://hypura-harness:18794"
  └─ HYPURA_EVOLVE_ENABLED: "true"
  └─ LLAMA_URL: "http://llama-service:8000"
  └─ REDIS_URL: "redis://redis:6379"

extensions/hypura-harness/scripts/ai_scientist_lite.py
  └─ REDIS_URL (env)
  └─ LLAMA_URL (env)
  └─ LLAMA_MODEL (env) → MAIN_MODEL_FILE に対応
  └─ AI_SCIENTIST_INTERVAL_SEC: 3600
  └─ AI_SCIENTIST_MAX_FAILURES: 20
  └─ AI_SCIENTIST_MAX_HINTS: 100
```

### 4.5 Docker サービス構成

**`docker-compose.override.yml`** で定義されるサービス：

| サービス名          | image / build           | ポート | 依存                 |
| ------------------- | ----------------------- | ------ | -------------------- |
| `hypura-harness`    | `hypura-harness:latest` | 18794  | redis                |
| `ai-scientist-lite` | `hypura-harness:latest` | —      | redis, llama-service |
| `lora-watcher`      | `hypura-harness:latest` | —      | redis                |
| `lora-service`      | `hypura-harness:latest` | —      | redis                |
| `redis`             | `redis:7-alpine`        | 6379   | —                    |

**ATLAS の `docker-compose.yml`** で定義されるサービス：

| サービス名        | ポート | 役割                          |
| ----------------- | ------ | ----------------------------- |
| `llama-service`   | 8000   | GPU 推論 (llama.cpp)          |
| `llm-proxy`       | 8080   | OpenAI 互換プロキシ           |
| `rag-api`         | 8001   | Retrieval API                 |
| `task-worker`     | —      | コード生成エンジン            |
| `sandbox`         | 8020   | コード実行環境                |
| `api-portal`      | 3000   | 認証・API キー管理            |
| `atlas-dashboard` | 3001   | リアルタイムダッシュボード    |
| `redis`           | 6379   | 共有 Redis（override で統合） |

---

## 5. データフロー全体図

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        clawdbot Desktop Stack                            │
│                                                                          │
│  ┌──────────────┐   HTTP    ┌──────────────────────────────────────┐    │
│  │  OpenClaw    │◀─────────▶│         Redis :6379                  │    │
│  │  Gateway     │           │  tasks:p{0,1,2}  task:{id}           │    │
│  │  :18789      │           │  training:examples  atlas:failures    │    │
│  └──────────────┘           │  shinka:fitness_hints  results:{id}  │    │
│         │                   └──────────────────────────────────────┘    │
│         │ agent                      ▲  ▲  ▲  ▲  ▲                    │
│         ▼                            │  │  │  │  │                    │
│  ┌──────────────┐  POST /evolve  ┌───┴──┴──┴──┴──┴──────────────────┐ │
│  │  ATLAS       │◀──────────────▶│      Hypura Harness :18794        │ │
│  │  task-worker │                │  ┌──────────────────────────────┐ │ │
│  │  (Docker)    │                │  │ harness_daemon.py (FastAPI)  │ │ │
│  └──────────────┘                │  │   └─ ShinkaEvolve            │ │ │
│         │                        │  │       AsyncEvolutionRunner   │ │ │
│         ▼                        │  └──────────────────────────────┘ │ │
│  ┌──────────────┐                │  ┌──────────────────────────────┐ │ │
│  │ llama-service│                │  │ ai_scientist_lite.py (1h毎) │ │ │
│  │ :8000 (GPU)  │◀───────────────│  │   atlas:failures → hints    │ │ │
│  └──────────────┘                │  └──────────────────────────────┘ │ │
│         ▲                        │  ┌──────────────────────────────┐ │ │
│         │ LoRA hot-reload        │  │ lora_watcher.py              │ │ │
│  ┌──────┴───────┐                │  │   training:examples → SFT   │ │ │
│  │  Ollama      │                │  └──────────────────────────────┘ │ │
│  │  :11434      │                └──────────────────────────────────── │
│  └──────────────┘                                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. 未実装項目 / Roadmap

| 優先度 | 項目                                         | 説明                                                                 |
| ------ | -------------------------------------------- | -------------------------------------------------------------------- |
| **高** | `scripts/Download-Vendor.ps1`                | 初回ダウンロードスクリプト本体                                       |
| **高** | `scripts/vendor-manifest.json`               | ダウンロードマニフェスト                                             |
| **高** | `package.json` setup スクリプト更新          | Download-Vendor 呼び出し追加                                         |
| **中** | ShinkaEvolve `shinka:fitness_hints` 読み込み | `AsyncEvolutionRunner` が Redis からヒントを取得する実装の確認・追加 |
| **中** | `vendor/AI-Scientist/` ダウンロード追加      | `vendor-manifest.json` に追記するだけ                                |
| **低** | atlas-dashboard の openclaw UI 統合          | dashboard :3001 へのリンクを Web UI に追加                           |
| **低** | `training:examples` の品質フィルタ           | テスト pass 率が高い例のみを LoRA 学習データにする                   |

---

## 7. ファイル一覧

### 新規作成予定

| ファイル                       | 内容                                 |
| ------------------------------ | ------------------------------------ |
| `scripts/Download-Vendor.ps1`  | 初回ダウンロードスクリプト           |
| `scripts/vendor-manifest.json` | コンポーネント URL・設定マニフェスト |

### 既存（参照のみ）

| ファイル                                                 | 役割                                            |
| -------------------------------------------------------- | ----------------------------------------------- |
| `scripts/Sync-OpenClawDesktop.ps1`                       | Step 1-6 の同期処理                             |
| `vendor/ATLAS/atlas/task-worker/worker.py`               | `_try_evolve()` L265 / `_record_failure()` L289 |
| `extensions/hypura-harness/index.ts`                     | `/evolve` エンドポイント                        |
| `extensions/hypura-harness/scripts/ai_scientist_lite.py` | AiScientistLite クラス (176行)                  |
| `extensions/hypura-harness/scripts/harness_daemon.py`    | FastAPI ラッパー                                |
| `extensions/hypura-harness/config/harness.config.json`   | Hypura 設定                                     |
| `vendor/ShinkaEvolve/shinka/core/async_runner.py`        | 並列進化エンジン                                |
| `docker-compose.override.yml`                            | Docker サービス定義                             |

---

## 8. 検証方法

```powershell
# 1. ドライランで対象確認
pnpm setup:dry

# 2. 初回セットアップ実行
pnpm setup

# 3. Python 動作確認
.python/python.exe --version

# 4. vendor インストール確認
py -3 -c "import atlas; import shinka; print('OK')"

# 5. Hypura harness 起動確認
Invoke-RestMethod http://127.0.0.1:18794/health

# 6. Redis キー確認（Docker 起動後）
docker exec clawdbot-redis-1 redis-cli keys "*" | sort
```
