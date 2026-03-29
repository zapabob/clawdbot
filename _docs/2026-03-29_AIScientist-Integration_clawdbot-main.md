# 2026-03-29 AI-Scientist × Hypura Harness 統合実装ログ

**Branch**: main
**Author**: Claude Sonnet 4.6

---

## 概要

SakanaAI/AI-Scientist を `vendor/AI-Scientist/` にダウンロードし、
Hypura Harness の `/scientist/*` REST エンドポイント経由で
Ollama（`qwen-Hakua-core2`）で動かせるよう統合した。

関連コミット:
| コミット | 内容 |
|---------|------|
| `83087c60bc` | feat(scientist): add AI-Scientist Ollama integration + Download-Vendor.ps1 |
| `(latest)` | fix(patch): fix syntax error in ai_scientist_ollama.py |

---

## 1. 設計方針

### Windows 環境制約

- **LaTeX 不要**: Windows 環境のため texlive-full はスキップ。論文生成（PDF 出力）は行わず、アイデア生成＋実験実行のみを行う "Slim モード"
- **Python コマンド**: `py -3` を使用（`python`/`python3` は不可）
- **Ollama 互換**: SakanaAI は内部で OpenAI SDK を使用 → `base_url="http://localhost:11434/v1"` + `api_key="ollama"` でそのまま動作

### ダウンロード方式

ZIP 展開は `$env:TEMP` に ~300MB+ を要求するためディスク不足エラーが発生した。
`git clone --depth 1` に切り替えることで一時領域を節約し成功した。

---

## 2. 新規ファイル一覧

| ファイル                                                   | 役割                                                  |
| ---------------------------------------------------------- | ----------------------------------------------------- |
| `scripts/vendor-manifest.json`                             | ダウンロード対象コンポーネントの定義                  |
| `scripts/Download-Vendor.ps1`                              | 冪等ダウンロードスクリプト（manifest 読み込み）       |
| `scripts/patches/ai_scientist_ollama.py`                   | llm.py に Ollama ブロックを挿入するパッチ             |
| `extensions/hypura-harness/scripts/ai_scientist_runner.py` | AiScientistRunner クラス + デーモンエントリーポイント |

---

## 3. 変更ファイル一覧

| ファイル                                              | 変更内容                                                                                            |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `extensions/hypura-harness/scripts/redis_loop.py`     | `push_scientist_finding()` / `get_scientist_tasks()` 追加、`get_loop_stats()` に scientist キー追加 |
| `extensions/hypura-harness/scripts/harness_daemon.py` | `/scientist/run`, `/scientist/ideas`, `/scientist/status` エンドポイント追加                        |
| `extensions/hypura-harness/index.ts`                  | `hypura_scientist_run`, `hypura_scientist_ideas`, `hypura_scientist_status` ツール追加              |
| `docker-compose.override.yml`                         | `ai-scientist-full` サービス追加                                                                    |

---

## 4. vendor-manifest.json

```json
{
  "python": {
    "url": "https://www.python.org/ftp/python/3.14.3/python-3.14.3-embed-amd64.zip",
    "target": ".python",
    "type": "zip-extract",
    "install": false
  },
  "ATLAS": {
    "repo": "zapabob/ATLAS",
    "ref": "main",
    "target": "vendor/ATLAS",
    "type": "github-tarball",
    "install": true
  },
  "ShinkaEvolve": {
    "repo": "SakanaAI/ShinkaEvolve",
    "ref": "main",
    "target": "vendor/ShinkaEvolve",
    "type": "github-tarball",
    "install": true
  },
  "AI-Scientist": {
    "repo": "SakanaAI/AI-Scientist",
    "ref": "main",
    "target": "vendor/AI-Scientist",
    "type": "github-tarball",
    "install": true,
    "post_patch": "scripts/patches/ai_scientist_ollama.py"
  }
}
```

---

## 5. Download-Vendor.ps1 実装詳細

### PowerShell 5.1 対応: try/catch/finally パーサー問題

**症状:** `finally` ブロック使用時に `Try ステートメントは Catch ブロックまたは Finally ブロックが必要です` エラー

**原因:** PS5.1 では `try { ... } catch { continue } finally { ... }` の組み合わせでパーサーが誤動作する。

**修正パターン:**

```powershell
# NG パターン (finally 使用)
try {
    # 処理
} catch {
    # エラー処理
} finally {
    # クリーンアップ  ← PS5.1 でパーサーエラー
}

# OK パターン ($ok フラグ + 別関数)
$ok = $false
try {
    # 処理
    $ok = $true
} catch {
    # エラー処理
}
if ($ok) {
    Install-VendorPkg ...  # 別関数に分離
}
```

### git clone によるダウンロード（実際の運用）

`manifest.json` の `type=github-tarball` は ZIP ダウンロード→展開だが、
AI-Scientist（~33MB）は ZIP 展開時に `$env:TEMP` で ~300MB 必要になりディスク不足エラーとなった。

実際の AI-Scientist ダウンロードは以下のコマンドで実行した:

```powershell
git clone --depth 1 https://github.com/SakanaAI/AI-Scientist.git vendor/AI-Scientist
# → Updating files: 100% (2326/2326), done.
```

---

## 6. Ollama パッチ (scripts/patches/ai_scientist_ollama.py)

AI-Scientist の `llm.py` に Ollama ブロックを自動挿入する。

### 挿入対象

`vendor/AI-Scientist/ai_scientist/llm.py` 内の `create_client()` 関数。
DeepSeek / Gemini ブロックの後に挿入する。

### 挿入される内容

```python
elif model.startswith("ollama/") or model == "ollama":
    # Ollama: OpenAI 互換 API (http://localhost:11434/v1)
    import os as _os
    _ollama_base = _os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434/v1")
    client = openai.OpenAI(api_key="ollama", base_url=_ollama_base)
    return client
```

### パッチ適用確認

```bash
grep -n "ollama" vendor/AI-Scientist/ai_scientist/llm.py
# 274: elif model.startswith("ollama/") or model == "ollama":
# 277:     _ollama_base = _os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434/v1")
# 278:     client = openai.OpenAI(api_key="ollama", base_url=_ollama_base)
```

### バグ修正: シンタックスエラー (line 40)

**症状:** `SyntaxError: unmatched ')'` — 単引用符文字列内に `'` が含まれていた

**修正前:**

```python
if 'startswith("ollama/')' in src or '"ollama"' in src:
#              ↑ この ' がシングルクォート文字列を閉じてしまう
```

**修正後:**

```python
if 'startswith("ollama/")' in src or 'model == "ollama"' in src:
```

---

## 7. ai_scientist_runner.py アーキテクチャ

### クラス構造

```
AiScientistRunner
├── _check_available() → bool      SakanaAI パッケージが importable か確認
├── run_ideas(topic, num_ideas)     アイデア生成
├── run_experiment(idea, template) 実験実行（Slim モード: LaTeX スキップ）
├── run_from_failures()             atlas:failures → 自動テーマ設定 → 実行
└── _fallback_ideas(topic, n)       SakanaAI 未インストール時の Ollama 直接呼び出し
```

### フォールバックモード

`vendor/AI-Scientist` が importable でない場合も動作する:

- `_fallback_ideas()`: Ollama の `/chat/completions` API を直接呼び出し
- JSON 形式でアイデアを生成して返す
- Redis キーフロー（`atlas:failures` → `ai_scientist:findings` → `shinka:fitness_hints`）は同様に機能

### デーモンモード

```python
# 環境変数で制御
AI_SCIENTIST_INTERVAL_SEC = 7200  # 2時間ごとに実行
AI_SCIENTIST_DIR           # vendor/AI-Scientist のパス（Docker 内では /app/vendor/AI-Scientist）
OLLAMA_BASE_URL            # Ollama API ベース URL
OLLAMA_MODEL               # デフォルト: qwen-Hakua-core2
```

---

## 8. Redis キーフロー（全体像）

```
harness_daemon /run:
  成功 → training:examples (TinyLoRA SFT)
  失敗 → atlas:failures → ai_scientist_lite    → shinka:fitness_hints → ShinkaEvolve
                        → ai_scientist_runner  → ai_scientist:findings
                                               → shinka:fitness_hints → ShinkaEvolve

ai_scientist:tasks (外部 → ランナーへのタスク投入)
ai_scientist:findings  (max 200, LIFO)
```

---

## 9. harness_daemon.py エンドポイント

| エンドポイント      | メソッド | 説明                                               |
| ------------------- | -------- | -------------------------------------------------- |
| `/scientist/run`    | POST     | topic が空なら `run_from_failures()`; Redis に保存 |
| `/scientist/ideas`  | POST     | アイデア生成のみ、Redis 保存なし                   |
| `/scientist/status` | GET      | findings/tasks キューのサイズとループ統計          |

### ScientistRunRequest スキーマ

```python
class ScientistRunRequest(BaseModel):
    topic: str = ""                       # 空の場合は atlas:failures から自動設定
    num_ideas: int = 3
    run_experiment: bool = False          # True でコード実行まで行う
    model: str = "ollama/qwen-Hakua-core2"
```

---

## 10. index.ts 追加ツール

```typescript
// hypura_scientist_run: POST /scientist/run (timeout: 300s)
// hypura_scientist_ideas: POST /scientist/ideas (timeout: 120s)
// hypura_scientist_status: GET /scientist/status (timeout: 10s)
```

システムプロンプトにも追記:

```
- AI Scientist: hypura_scientist_run / hypura_scientist_ideas / hypura_scientist_status
```

---

## 11. docker-compose.override.yml — ai-scientist-full サービス

```yaml
ai-scientist-full:
  build:
    context: ./extensions/hypura-harness
    dockerfile: Dockerfile
  image: hypura-harness:latest
  command: ["python", "ai_scientist_runner.py"]
  environment:
    REDIS_URL: "redis://redis:6379"
    OLLAMA_BASE_URL: "http://host.docker.internal:11434/v1" # Docker からホスト Ollama へ
    OLLAMA_MODEL: "${OLLAMA_MODEL:-qwen-Hakua-core2}"
    AI_SCIENTIST_DIR: "/app/vendor/AI-Scientist"
    AI_SCIENTIST_INTERVAL_SEC: "7200"
  volumes:
    - ./vendor/AI-Scientist:/app/vendor/AI-Scientist:ro
  depends_on:
    redis:
      condition: service_healthy
  restart: unless-stopped
```

---

## 12. 検証方法

```powershell
# 1. DryRun で確認
powershell -File scripts/Download-Vendor.ps1 -Component AI-Scientist -DryRun

# 2. Ollama パッチ確認
grep -n "ollama" vendor/AI-Scientist/ai_scientist/llm.py

# 3. ハーネス起動後にステータス確認
Invoke-RestMethod http://127.0.0.1:18794/scientist/status

# 4. アイデア生成テスト
Invoke-RestMethod http://127.0.0.1:18794/scientist/ideas `
  -Method POST -ContentType 'application/json' `
  -Body '{"topic":"improve code generation for loops","num_ideas":2,"model":"ollama/qwen-Hakua-core2"}'
```

---

## 13. 教訓

- **PS5.1 の `finally` ブロックは try 内 `continue` と組み合わせると誤動作**: `$ok` フラグパターンで回避する
- **大容量 ZIP は `$env:TEMP` 圧迫に注意**: AI-Scientist の ZIP 展開では ~300MB 必要。`git clone --depth 1` が安全
- **Python シングルクォート文字列内に `'` を含めない**: `'startswith("ollama/")'` のような文字列は `"` で囲むか、対象文字列を変更して回避する
- **フォールバックモードを実装しておく**: SakanaAI が未インストールでも Ollama 直接呼び出しで機能させることで、段階的セットアップに対応できる
