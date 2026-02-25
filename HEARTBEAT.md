# HEARTBEAT.md

## 自己進化タスク（ShinkaEvolve風 - Ollama + Evolution-Py）

### 1. Research実行
```
py -3 C:\Users\downl\.openclaw\workspace\evolution-py\heartbeat_evolution.py --research "最新AI技術トレンド"
```

### 2. Full Evolution (Research + 最適化)
```
py -3 C:\Users\downl\.openclaw\workspace\evolution-py\heartbeat_evolution.py --full "コード最適化アルゴリズム"
```

### 3. モデルトレーニング (SDF+KL+GRPO+MHC+imatrix)
```
py -3 C:\Users\downl\.openclaw\workspace\evolution-py\train_model.py --quick
py -3 C:\Users\downl\.openclaw\workspace\evolution-py\train_model.py --teacher "meta-llama/Llama-3.1-8B" --student "Qwen/Qwen2.5-3B"
```

### 4. 音声エージェント会話 (Moonshine STT + Edge TTS)
```
# 音声で会話 (カメラ・マイクから入力)
py -3 C:\Users\downl\.openclaw\workspace\evolution-py\voice_assistant.py --turns 5

# テキスト読み上げのみ
py -3 C:\Users\downl\.openclaw\workspace\evolution-py\voice_assistant.py --speak-only "こんにちは"

# 音声認識のみ
py -3 C:\Users\downl\.openclaw\workspace\evolution-py\voice_assistant.py --listen-only
```

### 結果を確認・コミット
- memory/latest_research.json を確認
- 必要に応じて git commit & push

## 毎朝10:00（JST）チェック
- 技術課題の進捗確認
- 今日〜48hの予定確認
- 現在地の天気・気温

## 日次/随口
- 世界情勢 / AI / 技術トレンド
- OpenClawのヘルスチェック
- LINE/Discord 連携確認
