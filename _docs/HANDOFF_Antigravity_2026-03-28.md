# Antigravity 引き継ぎ実装計画書

**作成日:** 2026-03-28
**引き継ぎ元:** Claude Sonnet 4.6 (前セッション)
**対象リポジトリ:** `C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main`

---

## 0. セッション全体の作業概要

このセッションでは以下の2つの大きなプロジェクトを並行して作業した：

### A. ATLAS × ShinkaEvolve × TinyLoRA — Docker 統合

clawdbot-main の Docker 環境に ATLAS V3 コーディングパイプライン・ShinkaEvolve 進化エンジン・AI Scientist Lite・継続的 TinyLoRA 学習を統合した。

### B. Openclaw 起動不能修復 + Python 3.14 uv 実行エクステンション

公式リポジトリのマージ後に発生した起動不能問題の診断と修復計画、および Python 3.14 実行機能の新規実装。

---

## 1. 完了済み作業（このセッションで実装・コミット済み）

### 1-1. `extensions/hypura-harness/scripts/`（Python ハーネス群）

| ファイル               | 状態         | 内容                                                                                    |
| ---------------------- | ------------ | --------------------------------------------------------------------------------------- |
| `harness_daemon.py`    | **修正済**   | `/run`, `/evolve` エンドポイント、`redis_loop` 統合                                     |
| `lora_service.py`      | **修正済**   | `mode` パラメータ、TinyLoRA/SFT 分岐                                                    |
| `lora_trainer.py`      | **修正済**   | BitsAndBytes QLoRA 4-bit + `train_tiny_lora()` 関数追加                                 |
| `shinka_adapter.py`    | **修正済**   | `LLAMA_API_BASE` 対応、Redis fitness_hint 取得                                          |
| `pyproject.toml`       | **修正済**   | `redis>=5.0.0` を base deps に追加、lora extras に `bitsandbytes`, `aioredis`, `docker` |
| `redis_loop.py`        | **新規作成** | Redis ループヘルパー（training:examples / atlas:failures / shinka:fitness_hints）       |
| `tiny_lora.py`         | **新規作成** | TinyLoRA 実装（arXiv:2602.04118、13パラメータ、GRPO）                                   |
| `lora_watcher.py`      | **新規作成** | 継続 LoRA 学習デーモン（Ollama hot-reload 対応）                                        |
| `ai_scientist_lite.py` | **新規作成** | 失敗パターン分析→仮説生成→Redis 保存                                                    |

### 1-2. `extensions/hypura-harness/`（TypeScript/設定）

| ファイル                           | 状態         | 内容                                                                            |
| ---------------------------------- | ------------ | ------------------------------------------------------------------------------- |
| `index.ts`                         | **修正済**   | `hypura_loop_status`, `hypura_tinylora_train` ツール追加、`stringEnum` バグ修正 |
| `Dockerfile`                       | **新規作成** | python:3.11-slim ベース、lora extras インストール                               |
| `config/harness.atlas.docker.json` | **新規作成** | Docker 環境用ハーネス設定                                                       |
| `config/governance_policy.json`    | **修正済**   | `vendor/ATLAS`, `vendor/ShinkaEvolve` を restricted_directories に追加          |

### 1-3. `vendor/ATLAS/`

| ファイル                             | 状態       | 内容                                       |
| ------------------------------------ | ---------- | ------------------------------------------ |
| `atlas/task-worker/worker.py`        | **修正済** | `_try_evolve()`, `_record_failure()` 追加  |
| `llama-server/entrypoint-rtx3060.sh` | **修正済** | `--lora $LORA_ADAPTER_PATH` オプション追加 |

### 1-4. プロジェクトルート

| ファイル                      | 状態         | 内容                                                             |
| ----------------------------- | ------------ | ---------------------------------------------------------------- |
| `docker-compose.override.yml` | **新規作成** | 11サービス定義（llama-service, hypura-harness, lora-watcher 等） |
| `.env.atlas.example`          | **新規作成** | ATLAS+LoRA 環境変数テンプレート                                  |

### 1-5. バグ修正（このセッション後半）

```python
# harness_daemon.py /run エンドポイント（修正済）
# WRONG: seed=result.get("code", req.task)
# FIXED: seed=result.get("output", req.task)

# harness_daemon.py /evolve エンドポイント（修正済）
# WRONG: shinka.evolve_code(combined_hint and req.seed, ...)
# FIXED: shinka.evolve_code(req.seed, combined_hint, ...)
```

```typescript
// extensions/hypura-harness/index.ts（修正済）
// WRONG: stringEnum(["auto", "tinylora", "sft"], "auto")
// FIXED: stringEnum(["auto", "tinylora", "sft"] as const, { default: "auto" })
```

---

## 2. 未完了作業（Antigravity が実装すべき）

### 2-1. Openclaw 起動不能の原因調査と修復【最優先】

#### 診断結果

- `dist/index.js` は **存在する**（ビルド自体は成功している）
- `src/infra/sovereign-protocols.ts` は **存在する**（内容も正しい）
- 実際の起動失敗原因は **未特定**

#### 調査すべき箇所

```bash
# 1. 実際にGatewayを起動してエラーを確認
cd C:/Users/downl/Desktop/clawdbot-main3/clawdbot-main
node dist/index.js gateway 2>&1 | head -50

# 2. TypeScript 型チェック実行
pnpm check 2>&1 | grep -E "error TS" | head -30

# 3. Docker Compose の状態確認
docker compose ps
docker compose logs openclaw-gateway 2>&1 | tail -50
```

#### 疑わしいファイル（調査対象）

1. **`src/hooks/bundled/sovereign-pulse/`** — metadata JSON ファイルが存在しない
   - 他の bundled hooks には `hook.json` または `metadata.json` が必要な可能性
   - 確認: `ls src/hooks/bundled/*/` で metadata ファイルの存在を確認

2. **`extensions/hypura-provider/index.ts`** — `api as any` で `registerProvider` を呼び出している
   - 公式リポジトリのバージョンアップで `registerProvider` API が変更された可能性

3. **ngrok 動的 URL 注入** — `start_ngrok.ps1` が不完全
   - 現状: ngrok を起動するだけで URL を取得しない
   - 修正方法: 下記 **2-2** を参照

#### sovereign-pulse フック metadata 確認・追加

```bash
# 他の bundled hook の構造を確認
ls src/hooks/bundled/session-memory/
ls src/hooks/bundled/boot-md/
```

もし `hook.json` / `metadata.json` が必要なら sovereign-pulse にも追加:

```json
// src/hooks/bundled/sovereign-pulse/hook.json（推測）
{
  "name": "sovereign-pulse",
  "events": ["gateway:startup"],
  "export": "default"
}
```

---

### 2-2. ngrok 動的 URL 注入スクリプト修正

**ファイル:** `scripts/launchers/start_ngrok.ps1`

**現状の問題:**

```powershell
# 現在: ngrok を起動するだけ
param([int]$Port = 18789)
ngrok http $Port
```

**修正後の設計:**

```powershell
param(
    [int]$Port = 18789,
    [string]$ProjectDir = (Split-Path $PSScriptRoot -Parent | Split-Path -Parent),
    [int]$PollRetries = 30,
    [int]$PollIntervalSec = 1
)

# env-tools.ps1 をインポート（同ディレクトリ）
. "$PSScriptRoot\env-tools.ps1"

$EnvFile = Get-ProjectEnvFile -ProjectDir $ProjectDir

Write-Host "[ngrok] Starting tunnel on port $Port..." -ForegroundColor Cyan

# バックグラウンドジョブとして ngrok 起動
$NgrokPath = Join-Path $ProjectDir "bin\ngrok.exe"
if (-not (Test-Path $NgrokPath)) { $NgrokPath = "ngrok" }

$job = Start-Job -ScriptBlock {
    param($ngrok, $port)
    & $ngrok http $port
} -ArgumentList $NgrokPath, $Port

# ngrok ローカル API をポーリング
$publicUrl = $null
for ($i = 0; $i -lt $PollRetries; $i++) {
    Start-Sleep -Seconds $PollIntervalSec
    try {
        $resp = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        $tunnel = $resp.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
        if (-not $tunnel) {
            $tunnel = $resp.tunnels | Select-Object -First 1
        }
        if ($tunnel) {
            $publicUrl = $tunnel.public_url
            break
        }
    } catch { }
}

if ($publicUrl) {
    Write-Host "[ngrok] Public URL: $publicUrl" -ForegroundColor Green

    # .env に書き込む
    Set-EnvValues -EnvFile $EnvFile -Values @{
        OPENCLAW_PUBLIC_URL   = $publicUrl
        TELEGRAM_WEBHOOK_URL  = "$publicUrl/webhook/telegram"
        LINE_WEBHOOK_URL      = "$publicUrl/webhook/line"
    }
    Write-Host "[ngrok] .env updated: OPENCLAW_PUBLIC_URL, TELEGRAM_WEBHOOK_URL, LINE_WEBHOOK_URL" -ForegroundColor Green
} else {
    Write-Host "[ngrok] WARNING: Could not retrieve public URL after $PollRetries attempts." -ForegroundColor Yellow
    Write-Host "[ngrok] Is ngrok authenticated? Run: ngrok config add-authtoken <TOKEN>" -ForegroundColor Yellow
}

# フォアグラウンドで待機（Ctrl+C で停止）
Write-Host "[ngrok] Running. Press Ctrl+C to stop." -ForegroundColor Cyan
Wait-Job $job
```

---

### 2-3. Python 3.14 uv 実行エクステンション（新規）

**場所:** `extensions/python-exec/`

#### `extensions/python-exec/package.json`

```json
{
  "name": "@openclaw/python-exec",
  "version": "2026.3.28",
  "private": true,
  "description": "OpenClaw Python execution plugin via uv",
  "type": "module",
  "dependencies": {
    "@sinclair/typebox": "0.34.48"
  },
  "devDependencies": {
    "openclaw": "workspace:*"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.22"
  },
  "openclaw": {
    "extensions": ["./index.ts"]
  }
}
```

#### `extensions/python-exec/index.ts`

````typescript
/**
 * python-exec — OpenClaw extension for executing Python 3.14 via uv.
 *
 * Tool: python_exec
 *   code: string           Python ソースコード
 *   timeout_sec?: number   タイムアウト秒数（デフォルト 30）
 *   python_version?: string Python バージョン（デフォルト "3.14"）
 *
 * 実行方法:
 *   uv run --python <version> - < code  (stdin 経由)
 *
 * 環境変数:
 *   UV_PATH  カスタム uv バイナリパス（デフォルト "uv"）
 */
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFile, unlink } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { Type } from "@sinclair/typebox";
import { definePluginEntry, type OpenClawPluginApi } from "openclaw/plugin-sdk/core";

type PythonExecPluginConfig = {
  uvPath?: string;
  defaultPythonVersion?: string;
};

function getUvPath(api: OpenClawPluginApi): string {
  const cfg = (api.pluginConfig ?? {}) as PythonExecPluginConfig;
  return process.env.UV_PATH || (typeof cfg.uvPath === "string" ? cfg.uvPath.trim() : "") || "uv";
}

function getDefaultPythonVersion(api: OpenClawPluginApi): string {
  const cfg = (api.pluginConfig ?? {}) as PythonExecPluginConfig;
  return (
    (typeof cfg.defaultPythonVersion === "string" ? cfg.defaultPythonVersion.trim() : "") || "3.14"
  );
}

async function runPython(opts: {
  uv: string;
  pythonVersion: string;
  code: string;
  timeoutMs: number;
}): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  // 一時ファイル経由で実行（stdin が uv で機能しない場合のフォールバック）
  const tmpFile = join(tmpdir(), `openclaw-pyexec-${randomBytes(8).toString("hex")}.py`);
  await writeFile(tmpFile, opts.code, "utf-8");

  return new Promise((resolve) => {
    const proc = spawn(opts.uv, ["run", "--python", opts.pythonVersion, tmpFile], {
      timeout: opts.timeoutMs,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    proc.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString();
    });

    proc.once("close", (code) => {
      void unlink(tmpFile).catch(() => {});
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });

    proc.once("error", (err) => {
      void unlink(tmpFile).catch(() => {});
      resolve({ stdout: "", stderr: String(err), exitCode: 1 });
    });
  });
}

export default definePluginEntry({
  id: "python-exec",
  name: "Python Exec",
  description: "Execute Python code via uv (Python 3.14 by default).",
  register(api: OpenClawPluginApi) {
    api.registerTool({
      name: "python_exec",
      label: "Python Exec",
      description:
        "Run Python code using `uv run --python <version>`. " +
        "Returns stdout, stderr, and exit_code. " +
        "uv が未インストールの場合はエラーになります（uv をインストール: https://github.com/astral-sh/uv）。",
      parameters: Type.Object({
        code: Type.String({ description: "実行する Python コード" }),
        timeout_sec: Type.Optional(
          Type.Number({ description: "タイムアウト秒数（デフォルト 30）" }),
        ),
        python_version: Type.Optional(
          Type.String({ description: "Python バージョン（デフォルト 3.14）" }),
        ),
      }),
      async execute(_id: string, params: Record<string, unknown>) {
        const code = typeof params.code === "string" ? params.code : "";
        const timeoutSec =
          typeof params.timeout_sec === "number" && params.timeout_sec > 0
            ? params.timeout_sec
            : 30;
        const pythonVersion =
          typeof params.python_version === "string" && params.python_version.trim()
            ? params.python_version.trim()
            : getDefaultPythonVersion(api);

        if (!code.trim()) {
          return {
            content: [{ type: "text" as const, text: "Error: code is empty" }],
          };
        }

        const uv = getUvPath(api);
        const result = await runPython({
          uv,
          pythonVersion,
          code,
          timeoutMs: timeoutSec * 1000,
        });

        const summary = [
          `exit_code: ${result.exitCode}`,
          result.stdout ? `stdout:\n${result.stdout.trimEnd()}` : "stdout: (empty)",
          result.stderr ? `stderr:\n${result.stderr.trimEnd()}` : "",
        ]
          .filter(Boolean)
          .join("\n\n");

        return {
          content: [{ type: "text" as const, text: summary }],
          exit_code: result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
        };
      },
    });

    api.on("before_prompt_build", () => ({
      appendSystemContext: [
        "## Python Exec (python-exec plugin)",
        "",
        "- **`python_exec`**: uv 経由で Python コードを実行する。",
        `- デフォルト Python バージョン: ${getDefaultPythonVersion(api)}`,
        "- uv が未インストールの場合は事前に `winget install astral-sh.uv` または `pip install uv` を実行する。",
        "- 標準ライブラリのみ使用可能（追加パッケージは PEP 723 インラインメタデータで指定）。",
        "",
        "### PEP 723 インラインパッケージ例",
        "```python",
        "# /// script",
        '# requires-python = ">=3.14"',
        '# dependencies = ["requests"]',
        "# ///",
        "import requests",
        "print(requests.get('https://example.com').status_code)",
        "```",
      ].join("\n"),
    }));
  },
});
````

#### openclaw.json への追加

`openclaw.json` の `plugins.entries` に追加:

```json
"python-exec": {
  "path": "./extensions/python-exec",
  "config": {
    "uvPath": "uv",
    "defaultPythonVersion": "3.14"
  }
}
```

---

## 3. アーキテクチャ概要（現在の完成形）

```
[Openclaw Gateway :18789]
    │
    ├─ extensions/telegram      ← Telegram Bot（グラミー）
    ├─ extensions/line           ← LINE Messaging API
    ├─ extensions/hypura-provider ← Ollama互換AIプロバイダー（:8080）
    ├─ extensions/hypura-harness  ← Python ハーネス HTTP プロキシ（:18794）
    │       │
    │       └─ harness_daemon.py（FastAPI）
    │               ├─ /run    → CodeRunner → training:examples (Redis)
    │               ├─ /evolve → ShinkaAdapter → shinka:fitness_hints
    │               ├─ /speak  → VOICEVOX
    │               ├─ /osc    → VRChat OSC
    │               └─ /lora/* → LoRA学習パイプライン
    │
    └─ extensions/python-exec    ← Python 3.14 実行（uv）【未実装】

[Redis :6379]
    ├─ training:examples    → lora_watcher → TinyLoRA 学習
    ├─ atlas:failures       → ai_scientist_lite → 仮説生成
    └─ shinka:fitness_hints → ShinkaEvolve 改善ヒント

[Ollama]
    └─ qwen-Hakua-core2 (Qwen3.5-9B Q4_K_M) ← TinyLoRA アダプター適用後更新

[Docker Compose Override]
    ├─ llama-service :8000   GPU推論（RTX 3060 Q8_0）
    ├─ llm-proxy :8081       OpenAI互換プロキシ
    ├─ redis :6379
    ├─ hypura-harness :18794
    ├─ lora-watcher          継続学習デーモン
    └─ ai-scientist-lite     仮説生成デーモン
```

---

## 4. 環境変数リファレンス（`.env`）

```bash
# ── モデル ──────────────────────────────────────────────────
MODELS_PATH=C:\Users\downl\Downloads
MAIN_MODEL_FILE=Qwen3.5-9B-Uncensored-HauhauCS-Aggressive-Q8_0.gguf
DRAFT_MODEL_FILE=Qwen3-0.6B-Q8_0.gguf
HAKUA_CORE2_GGUF=Qwen3.5-9B-Uncensored-HauhauCS-Aggressive-Q4_K_M.gguf
HF_MODEL_DIR=C:\Users\downl\Downloads\hf\Qwen3.5-9B

# ── Openclaw ──────────────────────────────────────────────────
OPENCLAW_GATEWAY_TOKEN=<生成済みトークン>
OPENCLAW_CONFIG_DIR=./.openclaw-desktop
OPENCLAW_WORKSPACE_DIR=./workspace

# ── ngrok（start_ngrok.ps1 が自動注入） ───────────────────────
OPENCLAW_PUBLIC_URL=
TELEGRAM_WEBHOOK_URL=
LINE_WEBHOOK_URL=

# ── ATLAS ──────────────────────────────────────────────────
JWT_SECRET=<ランダム文字列>
CONTEXT_LENGTH=8192

# ── LoRA ──────────────────────────────────────────────────
LORA_TRAINING_THRESHOLD=50
LORA_CONTAINER_NAME=clawdbot-main3-llama-service-1
USE_TINY_LORA=true
OLLAMA_MODEL_NAME=qwen-Hakua-core2
LLAMA_API_BASE=http://llama-service:8000/v1
LLAMA_MODEL_NAME=Qwen3.5-9B-Uncensored-HauhauCS-Aggressive-Q8_0.gguf
```

---

## 5. VRAM タイムスライシング設計（RTX 3060 12GB）

```
通常推論:     qwen-Hakua-core2 Q4_K_M ~5.5 GB（Ollama）
TinyLoRA学習: 4-bit QLoRA base ~5.6 GB + train ~3.5 GB = ~9.1 GB（llama-serviceとは別プロセス）

TinyLoRサイクル（lora_watcher.py）:
  1. Redis training:examples ≥ 50 件蓄積
  2. Ollama停止不要（TinyLoRA は別プロセス）
  3. train_tiny_lora() 実行（13パラメータ、秒〜分単位）
  4. アダプター JSON → PEFT変換 → GGUF変換
  5. Modelfile更新 → `ollama create qwen-Hakua-core2 -f Modelfile`
  6. Ollama は新モデルを自動反映（ダウンタイムなし）
```

---

## 6. 既知の課題・注意点

| #   | 課題                                                                                                                                                              | 優先度  | 状態   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------ |
| 1   | Openclaw Gateway/TUI 起動不能の実際の原因未特定                                                                                                                   | 🔴 最高 | 未解決 |
| 2   | `sovereign-pulse` hook の metadata JSON 欠如                                                                                                                      | 🟡 中   | 未確認 |
| 3   | `python-exec` エクステンション未実装                                                                                                                              | 🟡 中   | 未実装 |
| 4   | `start_ngrok.ps1` URL 注入不完全                                                                                                                                  | 🟡 中   | 未修正 |
| 5   | `docker-compose.override.yml` の `hypura-harness` サービスが `harness.atlas.docker.json` を参照しているが、このファイルのパスが Docker コンテナ内で正しいか未検証 | 🟠 低   | 未検証 |

---

## 7. 次のアクション手順（優先順）

```
1. [ ] node dist/index.js gateway を実行してエラーログを取得
2. [ ] pnpm check でTypeScriptエラーを全確認
3. [ ] sovereign-pulse の hook metadata JSON を確認・追加
4. [ ] start_ngrok.ps1 を上記 2-2 の設計で書き換え
5. [ ] extensions/python-exec/ を上記 2-3 の設計で新規作成
6. [ ] openclaw.json に python-exec を追加
7. [ ] uv install 確認: uv --version && uv python install 3.14
8. [ ] docker compose up -d で全サービス起動確認
```

---

## 8. 重要ファイルパス一覧

| 役割                   | パス                                                         |
| ---------------------- | ------------------------------------------------------------ |
| Harness デーモン       | `extensions/hypura-harness/scripts/harness_daemon.py`        |
| ShinkaEvolve           | `extensions/hypura-harness/scripts/shinka_adapter.py`        |
| TinyLoRA 実装          | `extensions/hypura-harness/scripts/tiny_lora.py`             |
| LoRA 学習サービス      | `extensions/hypura-harness/scripts/lora_service.py`          |
| LoRA ウォッチャー      | `extensions/hypura-harness/scripts/lora_watcher.py`          |
| AI Scientist           | `extensions/hypura-harness/scripts/ai_scientist_lite.py`     |
| Redis ループ           | `extensions/hypura-harness/scripts/redis_loop.py`            |
| Harness TS プロキシ    | `extensions/hypura-harness/index.ts`                         |
| Hypura プロバイダー    | `extensions/hypura-provider/index.ts`                        |
| Gateway エントリー     | `src/entry.ts`                                               |
| Heartbeat ランナー     | `src/infra/heartbeat-runner.ts`                              |
| Sovereign プロトコル   | `src/infra/sovereign-protocols.ts`                           |
| Sovereign Pulse フック | `src/hooks/bundled/sovereign-pulse/handler.ts`               |
| ngrok 起動スクリプト   | `scripts/launchers/start_ngrok.ps1`                          |
| env ユーティリティ     | `scripts/launchers/env-tools.ps1`                            |
| Docker 本体            | `docker-compose.yml`                                         |
| Docker ATLAS 拡張      | `docker-compose.override.yml`                                |
| 環境変数テンプレ       | `.env.atlas.example`                                         |
| Docker ハーネス設定    | `extensions/hypura-harness/config/harness.atlas.docker.json` |
| ATLAS ワーカー         | `vendor/ATLAS/atlas/task-worker/worker.py`                   |
| llama-server 起動      | `vendor/ATLAS/llama-server/entrypoint-rtx3060.sh`            |
| ガバナンス設定         | `extensions/hypura-harness/config/governance_policy.json`    |

---

_このドキュメントは Claude Sonnet 4.6 が 2026-03-28 のセッションの作業内容を Antigravity へ引き継ぐために作成した。_
