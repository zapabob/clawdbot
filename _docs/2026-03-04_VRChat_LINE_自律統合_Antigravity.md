# 2026-03-04*VRChat_LINE*自律統合\_Antigravity.md

## 実装内容

OpenClawの中枢に **VRChat自律制御** と **LINE双方向メッセージング** を実装しました。

---

## 1. VRChat Guardian Pulse（自律ハートビート）

**ファイル:** `extensions/vrchat-relay/src/guardian-pulse.ts` （新規作成）

- プラグイン登録時に **自動起動**するバックグラウンドタイマー
- **5分ごと**にVRChatチャットボックスにはくあのメッセージを送信
  - 初回起動時は時刻に応じた挨拶（おはよう/こんにちは/こんばんは）
  - 以降は `PULSE_MESSAGES` からランダム選択
- **15分ごと**にアバター感情表現（VRCEmote パラメーター）を送信
- OSC送信は既存の Python OSC ブリッジ (`scripts/osc_chatbox.py`) を使用

**追加ツール（`vrchat-relay/index.ts`）:**

| ツール名                       | 説明                       |
| ------------------------------ | -------------------------- |
| `vrchat_guardian_pulse_start`  | パルス開始（間隔指定可能） |
| `vrchat_guardian_pulse_stop`   | パルス停止                 |
| `vrchat_guardian_pulse_status` | パルス状態確認             |

---

## 2. LINE Proactive Push（能動的メッセージング）

**ファイル:** `extensions/line/src/push-command.ts` （新規作成）

LINEプラグインに以下のコマンドを追加：

| コマンド       | 説明                                                      |
| -------------- | --------------------------------------------------------- |
| `/line_push`   | 指定のLINEユーザーID/グループIDにプッシュメッセージを送信 |
| `/line_status` | LINEチャネルの設定状態・Bot名を確認                       |

`/line_push` はWebhookを待たずにはくあから先にメッセージを送れるため、真の**双方向通信**を実現します。

---

## 3. 既存機能（確認済み）

- **AI応答のVRChatミラー**: `llm_output` フックで既に実装済み（LINEやDiscordへの返信がVRChatチャットボックスにも表示される）
- **LINE受信→AI応答**: `monitor.ts` の webhook システムで既に動作中

---

## 4. ビルド検証

```
✔ Build complete in 4838ms (319 files)
```

エラー・警告なし。

---

## 注意事項

- VRChatのOS C受信ポートが `9000` に向いている必要があります（`.env` の `VRCHAT_OSC_SEND_PORT=9000` ）
- `scripts/osc_chatbox.py` と `py -3` (Python) が動作している環境が必要
- LINEの Parent ID が不明な場合、最初にLINEからメッセージを送ると自動でそのユーザーIDで応答します
