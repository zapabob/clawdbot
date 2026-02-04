# OpenClaw + LINE 双方向通信セットアップガイド

## ビルド済み！

プロジェクトのビルドが完了しました。

## 次のステップ

### 1. LINE Developer Console での設定

1. https://developers.line.biz/console/ にアクセス
2. プロバイダーを作成（または既存のものを選択）
3. 「Messaging API」チャネルを作成
4. 以下の情報を取得：
   - **Channel access token**（長期のトークン）
   - **Channel secret**

### 2. OpenClaw の設定

設定ファイルを作成します：`~/.openclaw/openclaw.json`

```json
{
  "channels": {
    "line": {
      "enabled": true,
      "channelAccessToken": "YOUR_CHANNEL_ACCESS_TOKEN",
      "channelSecret": "YOUR_CHANNEL_SECRET",
      "dmPolicy": "pairing",
      "groupPolicy": "allowlist",
      "webhookPath": "/line/webhook"
    }
  }
}
```

### 3. 環境変数として設定（オプション）

```bash
export LINE_CHANNEL_ACCESS_TOKEN="your-token-here"
export LINE_CHANNEL_SECRET="your-secret-here"
```

### 4. ゲートウェイの起動

```bash
# フォアグラウンドで起動（開発用）
node openclaw.mjs gateway --port 18789 --verbose

# またはバックグラウンドサービスとしてインストール
node openclaw.mjs gateway install
node openclaw.mjs gateway start
```

### 5. Web UI へのアクセス

ブラウザで開く：
- http://127.0.0.1:18789/

またはダッシュボードコマンド：
```bash
node openclaw.mjs dashboard
```

### 6. LINE Webhook の設定

LINE Developer Console の Messaging API 設定で：

1. 「Webhook URL」に以下を設定：
   ```
   https://your-gateway-host/line/webhook
   ```
   
   ローカル開発時は ngrok などを使用：
   ```bash
   ngrok http 18789
   ```
   
   生成された HTTPS URL を webhook URL として設定

2. 「Use webhook」を有効化

3. 「Verify」ボタンで検証

### 7. 双方向通信のテスト

1. LINE アプリからボットにメッセージを送信
2. 初回はペアリングコードが返されます：
   ```bash
   node openclaw.mjs pairing list line
   node openclaw.mjs pairing approve line <CODE>
   ```
3. 承認後、ボットが応答するようになります

## トラブルシューティング

- **Webhook 検証エラー**: HTTPS が必須、channelSecret が正しいか確認
- **インバウンドイベントなし**: webhook パスが一致しているか、ゲートウェイが外部からアクセス可能か確認
- **メディアダウンロードエラー**: `channels.line.mediaMaxMb` を増やす

## 便利なコマンド

```bash
# ステータス確認
node openclaw.mjs status

# ヘルスチェック
node openclaw.mjs health

# セキュリティ監査
node openclaw.mjs security audit --deep

# LINE へメッセージ送信
node openclaw.mjs message send --target <LINE_USER_ID> --message "Hello from OpenClaw"
```

## 設定ファイルの詳細

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "YOUR_TOKEN",
      channelSecret: "YOUR_SECRET",
      dmPolicy: "pairing",      // "open" | "allowlist" | "pairing" | "disabled"
      groupPolicy: "allowlist",  // "open" | "allowlist" | "disabled"
      allowFrom: [],           // 許可するユーザーIDリスト
      groupAllowFrom: [],      // 許可するグループ送信者リスト
      mediaMaxMb: 10,          // メディアダウンロード上限
      webhookPath: "/line/webhook",
    }
  }
}
```
