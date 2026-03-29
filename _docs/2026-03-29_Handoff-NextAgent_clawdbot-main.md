# 次エージェント引き継ぎ計画書 — 2026-03-29

> **このドキュメントを読んでいるエージェントへ:**
> 前のセッションから引き継ぎます。以下を順に読んでから作業を開始してください。

---

## プロジェクト基本情報

| 項目                 | 値                                                     |
| -------------------- | ------------------------------------------------------ |
| リポジトリ           | `C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main`  |
| ブランチ             | `main`                                                 |
| Python コマンド      | **`py -3`**（`python` / `python3` は不可）             |
| パッケージマネージャ | `pnpm`                                                 |
| 主要モデル           | `ollama/qwen-Hakua-core2`（Ollama on localhost:11434） |

### 主要サービスポート

| サービス                | ポート  |
| ----------------------- | ------- |
| Hypura Harness daemon   | `18794` |
| Live2D コンパニオン制御 | `18791` |
| Redis                   | `6379`  |
| Ollama                  | `11434` |
| VOICEVOX                | `50021` |

---

## 2026-03-29 セッションで完了した作業

### 完了 ✅

| 作業                                                                                | コミット                     |
| ----------------------------------------------------------------------------------- | ---------------------------- |
| `Sync-OpenClawDesktop.ps1` 新規作成（リポジトリ設定を `.openclaw-desktop/` へ同期） | `14e573b760`                 |
| Python/vendor コピー + venv インストール（Step 5/6 追加）                           | `d61d19cfd6`                 |
| PS パーサーバグ修正 ×2（全角文字・`finally` ブロック問題）                          | `16ce68619e`, `7a3ce37d22`   |
| `scripts/vendor-manifest.json` 作成（4コンポーネント定義）                          | `83087c60bc`                 |
| `scripts/Download-Vendor.ps1` 作成（冪等ダウンロードスクリプト）                    | `83087c60bc`                 |
| `scripts/patches/ai_scientist_ollama.py` 作成（Ollama ブロック挿入パッチ）          | `83087c60bc` (fix: `latest`) |
| `vendor/AI-Scientist/` git clone 完了（2326ファイル）                               | — (git管理外)                |
| `vendor/AI-Scientist/ai_scientist/llm.py` Ollama パッチ適用                         | —                            |
| `extensions/hypura-harness/scripts/ai_scientist_runner.py` 作成                     | `83087c60bc`                 |
| `extensions/hypura-harness/scripts/redis_loop.py` に scientist 関数追記             | `83087c60bc`                 |
| `extensions/hypura-harness/scripts/harness_daemon.py` に `/scientist/*` 追記        | `83087c60bc`                 |
| `extensions/hypura-harness/index.ts` に scientist ツール追記                        | `83087c60bc`                 |
| `docker-compose.override.yml` に `ai-scientist-full` サービス追記                   | `83087c60bc`                 |
| pre-commit pytest を `-n auto`（12スレッド並列）に変更                              | latest                       |
| `_docs/` 実装ログ 2件追加                                                           | latest                       |

---

## 次セッションでやるべき作業

### 優先度 高

#### 1. 動作確認（ハーネス起動テスト）

Hypura Harness を起動して `/scientist/status` エンドポイントが応答するか確認する。

```powershell
# ハーネス起動（Start-Hypura-Harness.ps1 または直接）
cd extensions\hypura-harness
py -3 scripts\harness_daemon.py

# 別ターミナルで確認
Invoke-RestMethod http://127.0.0.1:18794/scientist/status
# 期待レスポンス: { "findings": 0, "tasks": 0, ... }
```

もしエラーが出た場合の確認箇所:

- `redis_loop.py` の `push_scientist_finding` 関数シグネチャ（keyword-only 引数）
- `harness_daemon.py` の `_get_scientist()` lazy init ロジック
- `ai_scientist_runner.py` の `_check_available()` パス解決

#### 2. AI-Scientist アイデア生成テスト（Ollama）

```powershell
Invoke-RestMethod http://127.0.0.1:18794/scientist/ideas `
  -Method POST -ContentType 'application/json' `
  -Body '{"topic":"improve loop code generation","num_ideas":2,"model":"ollama/qwen-Hakua-core2"}'
```

フォールバックモード（vendor/AI-Scientist なしでも動く）を確認すること。

#### 3. pip install（AI-Scientist 最小依存関係）

```powershell
# harness venv または system Python に最小パッケージインストール
py -3 -m pip install openai backoff anthropic --quiet
```

`torch` / `transformers` / `datasets` は不要（Slim モードのため）。

#### 4. TypeScript ビルド確認

```powershell
pnpm check
```

`index.ts` に追記した scientist ツールが型エラーを出していないか確認。

---

### 優先度 中

#### 5. Download-Vendor.ps1 — AI-Scientist を manifest 経由でダウンロードできるか確認

現状: `vendor/AI-Scientist/` は `git clone --depth 1` で手動ダウンロード済み。
manifest の `type=github-tarball` は ZIP ダウンロードだが、AI-Scientist は ~300MB 必要でディスク不足になりやすい。

**推奨対応**: manifest の AI-Scientist エントリに `"type": "git-clone"` を追加するか、
`Download-Vendor.ps1` に `git clone --depth 1` フォールバックを実装する。

```json
// vendor-manifest.json の AI-Scientist エントリ案
"AI-Scientist": {
  "repo": "SakanaAI/AI-Scientist",
  "ref": "main",
  "target": "vendor/AI-Scientist",
  "type": "git-clone-shallow",   // ← 新しい type
  "install": false,
  "post_patch": "scripts/patches/ai_scientist_ollama.py"
}
```

`Download-Vendor.ps1` に `git-clone-shallow` type 対応を追加:

```powershell
} elseif ($entry.type -eq "git-clone-shallow") {
    $repoUrl = "https://github.com/$($entry.repo).git"
    Write-DL "  git clone --depth 1 $repoUrl ..."
    try {
        git clone --depth 1 $repoUrl $target 2>&1 | Out-Null
        Write-DL "$name`: cloned to $target" -Color Green
        $ok = $true
    } catch {
        Write-Host "  [DL][ERROR] $name failed: $_" -ForegroundColor Red
    }
}
```

#### 6. Sync-OpenClawDesktop.ps1 の統合テスト

```powershell
# DryRun で確認
powershell -File scripts/Sync-OpenClawDesktop.ps1 -DryRun

# 実行
powershell -File scripts/Sync-OpenClawDesktop.ps1
```

`.openclaw-desktop/` に `skills/`, `openclaw.json`, `vendor/` が正しく同期されるか確認。

#### 7. Sovereign-Portal.ps1 でのハーネス一発起動

`scripts/launchers/Sovereign-Portal.ps1` を実行して全サービスが正しく起動するか確認。
`Sync-OpenClawDesktop.ps1` の呼び出しが含まれているか確認。

---

### 優先度 低（将来タスク）

#### 8. ai_scientist_runner.py — `run_experiment()` の実装詳細

現状: `run_experiment()` のスケルトンは実装済みだが、AI-Scientist の
`perform_experiments()` 関数の引数仕様を確認して実際に呼び出す実装が必要。

確認先: `vendor/AI-Scientist/launch_scientist.py`（実験ループの参考コード）

#### 9. Docker 環境での動作確認

```bash
docker compose up -d ai-scientist-full
docker logs clawdbot-main3-ai-scientist-full-1
```

`host.docker.internal:11434` で Ollama に到達できるか確認。

---

## 重要な制約・注意事項

### PowerShell 5.1 の落とし穴

| 問題                                      | 原因                                             | 対策                              |
| ----------------------------------------- | ------------------------------------------------ | --------------------------------- |
| `param()` 内に全角文字                    | PS5.1 トークナイザーが全角カッコを解釈できない   | `param()` ブロックは ASCII のみ   |
| `try/catch/finally` でパーサーエラー      | `catch` 内の `continue` + `finally` の組み合わせ | `$ok` フラグパターンを使う        |
| `TrimStart('\', '/')` が曖昧              | 文字列リテラルと配列要素の区別不能               | `TrimStart([char]'\', [char]'/')` |
| `@(... \| Where-Object { ... })` の複数行 | `})` をパーサーが誤解釈                          | `foreach` ループに書き換え        |

### Python シングルクォート文字列

`'startswith("ollama/")'` のような `"` を含む文字列でシングルクォートを使う場合、
文字列内に `'` を入れると構文エラー。ダブルクォートで囲むか文字列を変更する。

### git clone と ZIP ダウンロードの使い分け

- 小さいファイル（< 50MB）: ZIP ダウンロード OK
- 大きいファイル（AI-Scientist ~300MB）: `git clone --depth 1` が安全

---

## キーファイル早見表

```
clawdbot-main/
├── scripts/
│   ├── vendor-manifest.json          # コンポーネントダウンロード定義
│   ├── Download-Vendor.ps1           # 冪等ダウンロードスクリプト
│   ├── Sync-OpenClawDesktop.ps1      # リポジトリ → .openclaw-desktop/ 同期
│   └── patches/
│       └── ai_scientist_ollama.py    # AI-Scientist Ollama パッチ
├── extensions/hypura-harness/
│   ├── config/
│   │   └── harness.config.json       # ハーネス設定（openclaw.json から自動同期）
│   ├── scripts/
│   │   ├── harness_daemon.py         # FastAPI daemon (port 18794)
│   │   ├── redis_loop.py             # Redis キー操作ユーティリティ
│   │   ├── ai_scientist_runner.py    # AiScientistRunner + デーモン
│   │   ├── ai_scientist_lite.py      # 軽量版（失敗分析、既存）
│   │   ├── ai_scientist_pulse.py     # 自律リサーチループ（既存）
│   │   └── shinka_adapter.py         # ShinkaEvolve アダプター
│   └── index.ts                      # MCP ツール定義（scientist tools 追加済み）
├── vendor/
│   ├── AI-Scientist/                 # SakanaAI/AI-Scientist（clone済み、llm.py patch済み）
│   ├── ATLAS/                        # zapabob/ATLAS fork
│   └── ShinkaEvolve/                 # SakanaAI/ShinkaEvolve
├── docker-compose.override.yml       # ATLAS + Hypura + ai-scientist-full
└── _docs/                            # 実装ログ（このファイルも含む）
```

---

## Redis キーフロー（全体）

```
harness_daemon /run:
  成功 → training:examples        (TinyLoRA SFT 学習データ)
  失敗 → atlas:failures            (失敗パターン蓄積)
           ↓
    ai_scientist_lite   → shinka:fitness_hints → ShinkaEvolve (進化)
    ai_scientist_runner → ai_scientist:findings (max 200, LIFO)
                        → shinka:fitness_hints → ShinkaEvolve (進化)

ai_scientist:tasks     (外部 → runner へのタスク投入キュー)
```

---

## メモリファイル場所

`C:\Users\downl\.claude\projects\C--Users-downl-Desktop-clawdbot-main3-clawdbot-main\memory\`

- `MEMORY.md` — インデックス（常に読み込まれる）
- `project_atlas_integration.md` — ATLAS/AI-Scientist/ShinkaEvolve アーキテクチャ
- `feedback_python_command.md` — `py -3` を使うこと
- `user_hardware.md` — 6コア12スレッド

---

_作成: Claude Sonnet 4.6 / 2026-03-29_
