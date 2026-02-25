# EVOLUTION.md - ShinkaEvolve風自己進化システム

## 概要

このシステムはShinkaEvolveのアルゴリズムに基づき、Ollama (dolphin-llama3) を使用して自己進化・自己修復を行います。

## Pythonプロジェクト構造

```
evolution-py/
├── src/evolution/
│   ├── __init__.py      # メインエントリポイント
│   ├── core.py          # 進化エンジン (ShinkaEvolve風)
│   ├── search.py        # 検索API (DuckDuckGo, Brave, Perplexity)
│   ├── deep_research.py # Deep Research機能
│   ├── ollama_client.py # Ollama統合
│   ├── gpu.py           # CUDA/ROCm最適化
│   └── system.py        # 統合システム
├── tests/
└── docs/
```

## インストール

```bash
cd C:\Users\downl\.openclaw\workspace\evolution-py
pip install -e .
```

## 使用方法

### 基本的なResearch

```python
from evolution import create_system

system = create_system(ollama_model="dolphin-llama3")

# Deep Research実行
report = system.research("ShinkaEvolve algorithm implementation")
print(report.summary)
print(report.recommendations)
```

### 自己進化の実行

```python
# 初期コード
initial_code = [
    """
def solve_problem(data):
    # ベースライン実装
    return sum(data)
    """
]

# 評価関数
def eval_fn(code):
    # 実際の評価ロジック
    score = 0.8  # 例
    return score

# 進化実行
best = system.evolve(initial_code, eval_fn)
print(f"Best fitness: {best.fitness}")
print(f"Best code: {best.code}")
```

### Research + Evolution

```python
# ResearchしてからEvolution
best, report = system.evolve_with_research(
    task="最適化アルゴリズムの実装",
    eval_fn=my_eval_fn,
    max_generations=50
)
```

## 機能

### 1. Ollama連携 (dolphin-llama3)

- ローカルLLMでのコード生成
- CUDA/ROCmGPU加速
- プロンプト最適化

### 2. 検索API

- **DuckDuckGo** (免费)
- **Brave Search** (APIキー必要)
- **Perplexity** (APIキー必要)
- キャッシュ・レート制限付き

### 3. DeepResearch

- 複数ソースから調査
- 事実検証・信頼性スコアリング
- アクション可能なレコメンデーション

### 4. GPU最適化

- CUDA (NVIDIA) 対応
- ROCm (AMD) 対応
- メモリ管理・自動バックエンド選択

## MILSPECソフトウェア工学

### 標準
- **MIL-STD-1553** - データバス規格
- **MIL-STD-1773** - 航空電子
- **DO-178C** - 航空ソフトウェア
- **MISRA C** - 組み込みソフトウェア

### ベストプラクティス
1. **トレーサビリティ** - 要件→実装→テスト
2. **カバレッジ** - ユニットテスト 80%以上
3. **静的解析** - コード品質ツール活用
4. **セキュリティ** - セキュアコーディング

## 設定

環境変数:
```bash
export OLLAMA_BASE_URL=http://localhost:11434
export BRAVE_API_KEY=your_key
export PERPLEXITY_API_KEY=your_key
```

## Heartbeat自己実行

```
Heartbeat実行時:
1. research() で最新技術トレンド調査
2. evolve_with_research() でコード自己改善
3. 改善があれば git commit & push
4. 結果をMEMORY.mdに記録
```

### 評価基準
- 正確性 (Correctness)
- パフォーマンス
- コードの品質
- セキュリティ

## MILSPECソフトウェア工学

### 標準
- **MIL-STD-1553** - データバス規格
- **MIL-STD-1773** - 航空電子
- **DO-178C** - 航空ソフトウェア
- **MISRA C** - 組み込みソフトウェア

### ベストプラクティス
1. **トレーサビリティ** - 要件→実装→テスト
2. **カバレッジ** - ユニットテスト 80%以上
3. **静的解析** - コード品質ツール活用
4. **セキュリティ** - セキュアコーディング

## DeepResearch

### 调查プロセス
1. **情報収uevos** - 多个情報源から調査
2. **仮説生成** -  패턴識別
3. **検証** - 事实确认
4. **综合** - レポート作成

### ツール
- DuckDuckGo検索
- 学術論文調査
- GitHubコード検索

## 音声API

### TTS (Text-to-Speech)
- **Style-Bert-VITS2** (ローカル/免费)
- **Coqui TTS** (オープンソース)
- **Web Speech API** (ブラウザ組み込み)

### STT (Speech-to-Text)
- **Whisper** (ローカル/免费)
- **Faster Whisper** (高速版)
- **Web Speech API** (ブラウザ組み込み)

### 設定
```json
{
  "sttProvider": "whisper",
  "ttsProvider": "style-bert-vits2",
  "sbv2Endpoint": "http://localhost:5000"
}
```

## Heartbeat自己実行プロンプト

```
Heartbeat実行時:
1. エラーログ確認 → 自動修復
2. git status → 変更あればコミット
3. Ollamaでコード最適化提案受uevos
4. セキュリティスキャン実行
5. パフォーマンス測定
6. 必要に応じて自己改善

DuckDuckGo検索:
- 技術トレンド最新情報を取得
- エラー解決策を検索
- 最佳プラクティスを調査

音声:
- 起動時/完了時に音声フィードバック
- 対話モードでは音声入力対応
```
