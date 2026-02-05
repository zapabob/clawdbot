# OpenClaw + PostgreSQL + LINE + Tailscale 統合ガイド

## 🚀 完全自動セットアップ

### ワンコマンド実行

```bash
# 管理者として実行
auto-setup-complete.bat
```

これだけで以下が自動実行されます：

### ✅ フェーズ1: PostgreSQLセットアップ（3-5分）
- [x] PostgreSQLインストール確認（なければ自動インストール）
- [x] データベース `openclaw` 作成
- [x] 専用ユーザー `openclaw_app` 作成
- [x] スキーマ作成（6テーブル + インデックス + ビュー）
- [x] OpenClaw設定ファイル更新
- [x] 既存JSONデータの自動移行

### ✅ フェーズ2: 依存関係インストール（1-2分）
- [x] pgモジュール（PostgreSQLクライアント）インストール

### ✅ フェーズ3: OpenClaw統合起動（自動）
- [x] Gateway起動（Tailscale serveモード）
- [x] ngrok起動（LINE Webhook用公開URL取得）
- [x] Webhook URL自動表示
- [x] LINEペアリング自動待機・承認（最大6分）

---

## 📁 データベーススキーマ

### テーブル構成

```sql
-- 1. 設定管理
openclaw_config (config_key, config_value JSONB)

-- 2. ペアリング管理  
pairing_requests (channel, code, sender_id, expires_at)
allowed_senders (channel, sender_id, approved_at)

-- 3. メッセージログ
message_log (channel, sender_id, content, direction, metadata JSONB)

-- 4. セッション管理
sessions (session_id, channel, peer_id, context JSONB, state JSONB)

-- 5. Webhookイベント
webhook_events (channel, event_type, payload JSONB, processed)

-- 6. 監査ログ
audit_log (action, actor, target_type, details JSONB)
```

### 便利なビュー

```sql
-- 有効なペアリングリクエスト
SELECT * FROM active_pairing_requests;

-- 最近のメッセージ統計
SELECT * FROM recent_messages;

-- セッション統計
SELECT * FROM session_stats;
```

---

## 🔌 接続情報

```yaml
Database: openclaw
Host: localhost
Port: 5432
Username: openclaw_app
Password: openclaw_secure_pass_123
SSL: false
```

### psql接続

```bash
psql -U openclaw_app -d openclaw
```

---

## 📊 データ永続化の仕組み

### 自動保存されるデータ

1. **ペアリングリクエスト** → `pairing_requests`テーブル
2. **承認済み送信者** → `allowed_senders`テーブル
3. **メッセージ履歴** → `message_log`テーブル
4. **セッション状態** → `sessions`テーブル
5. **Webhookイベント** → `webhook_events`テーブル
6. **システム設定** → `openclaw_config`テーブル

### 自動クリーンアップ

- 期限切れペアリング（1時間後自動削除）
- 期限切れセッション（24時間後自動削除）
- 処理済みWebhookイベント（定期的にクリーンアップ）

---

## 🛠️ 管理コマンド

### データベース確認

```bash
# テーブル一覧
psql -U openclaw_app -d openclaw -c "\dt"

# ペアリング状況
psql -U openclaw_app -d openclaw -c "SELECT * FROM active_pairing_requests;"

# メッセージ統計
psql -U openclaw_app -d openclaw -c "SELECT * FROM recent_messages;"

# 承認済み送信者
psql -U openclaw_app -d openclaw -c "SELECT * FROM allowed_senders;"
```

### OpenClaw管理

```bash
# ステータス確認
node openclaw.mjs status

# ヘルスチェック
node openclaw.mjs health

# ペアリング確認
node openclaw.mjs pairing list line

# セキュリティ監査
node openclaw.mjs security audit --deep
```

---

## 🌐 アクセスURL

| サービス | URL |
|---------|-----|
| ローカルGateway | http://127.0.0.1:18789/ |
| Tailscale (tailnet内) | https://[マシン名].ts.net/ |
| ngrok (公開) | https://xxx.ngrok.io/ |
| LINE Webhook | https://xxx.ngrok.io/line/webhook |

---

## 📱 LINE連携手順

### 1. Webhook設定（自動表示されます）

```
https://developers.line.biz/console/
→ あなたのMessaging APIチャンネル
→ Messaging API設定タブ
→ Webhook URL: https://xxx.ngrok.io/line/webhook
→ [Verify] ボタンクリック
```

### 2. ペアリング（自動実行されます）

```
LINEアプリ → ボットにメッセージ送信
→ ペアリングコードが届く
→ スクリプトが自動承認（最大6分待機）
→ ✅ 完了！
```

---

## 🔧 トラブルシューティング

### PostgreSQL接続エラー

```bash
# サービス状態確認
sc query postgresql-x64-16

# サービス再起動
net stop postgresql-x64-16
net start postgresql-x64-16

# パスワードリセット（必要に応じて）
psql -U postgres -c "ALTER USER openclaw_app WITH PASSWORD '新しいパスワード';"
```

### ngrok接続エラー

```bash
# 手動でngrok再起動
taskkill /F /IM ngrok.exe
ngrok http 18789

# ダッシュボードで確認
https://dashboard.ngrok.com/cloud-edge/endpoints
```

### ペアリング承認失敗

```bash
# 手動承認
node openclaw.mjs pairing list line
node openclaw.mjs pairing approve line <8文字のコード>
```

---

## 📈 パフォーマンス最適化

### インデックス確認

```sql
-- 現在のインデックス一覧
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public';
```

### クエリ最適化

```sql
-- 遅いクエリを特定
SELECT query, calls, mean_time, rows 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### VACUUM（定期メンテナンス）

```sql
-- 統計情報更新
VACUUM ANALYZE;

-- 完全クリーンアップ
VACUUM FULL;
```

---

## 🔐 セキュリティ

### 推奨設定

```sql
-- 不要なユーザーの削除
DROP USER IF EXISTS old_user;

-- 権限確認
\du

-- 接続元制限（必要に応じて）
-- pg_hba.conf を編集
```

### バックアップ

```bash
# 自動バックアップスクリプト
pg_dump -U openclaw_app -d openclaw > backup_$(date +%Y%m%d).sql

# 復元
psql -U openclaw_app -d openclaw < backup_20250203.sql
```

---

## 📚 参考リンク

- [PostgreSQL公式](https://www.postgresql.org/)
- [OpenClaw Gateway Docs](https://docs.openclaw.ai/gateway)
- [LINE Messaging API](https://developers.line.biz/)
- [Tailscale Serve](https://tailscale.com/kb/1242/tailscale-serve)
- [ngrok Documentation](https://ngrok.com/docs)

---

## ✅ セットアップ確認リスト

- [ ] PostgreSQLサービス起動確認
- [ ] データベース `openclaw` 作成確認
- [ ] ユーザー `openclaw_app` 作成確認
- [ ] スキーマ作成確認（\dtでテーブル一覧）
- [ ] OpenClaw Gateway起動確認
- [ ] Tailscale serve有効確認
- [ ] ngrok起動・URL取得確認
- [ ] LINE Webhook設定確認
- [ ] ペアリング承認確認
- [ ] テストメッセージ送受信確認

---

**セットアップ完了！🎉**
