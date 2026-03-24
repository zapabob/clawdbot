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
  OpenClawが汎用エージェントとしてこれらのツールを組み合わせて自律的に動作する。
---

# Hypura Harness

デーモンURL: `http://127.0.0.1:18790`

## デーモン起動確認

まず `GET /status` で稼働確認。応答なし → 起動:

```bash
cd scripts/hypura && uv run harness_daemon.py
```

または `skills/hypura-harness/scripts/start_daemon.py` を実行。

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
{"task":"CSVを読んでグラフを作るスクリプトを書いて実行して"}
```

### /skill — スキル自動生成

```json
{"name":"my-skill","description":"○○をする","examples":["使用例1","使用例2"]}
```

### /evolve — ShinkaEvolve進化

```json
{"target":"code","seed":"既存コード","fitness_hint":"エラーなく実行できること","generations":5}
```

## OpenClawを汎用エージェントとして使う

OpenClawはこのスキル経由でハーネスの全ツールを組み合わせられる:

- ユーザーの要求を分析 → 適切なエンドポイントを選択
- 複数ステップのタスクを順次実行
- 失敗時は `/evolve` で改善ループ
- 新しい能力が必要な場合は `/skill` で自己拡張
