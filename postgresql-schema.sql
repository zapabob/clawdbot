-- OpenClaw PostgreSQL Schema
-- 実行: psql -U openclaw_app -d openclaw -f schema.sql

-- =====================================================
-- 1. 設定テーブル
-- =====================================================
CREATE TABLE IF NOT EXISTS openclaw_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(255) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 設定更新時のタイムスタンプ自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_openclaw_config_updated_at
    BEFORE UPDATE ON openclaw_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. ペアリング管理テーブル
-- =====================================================
CREATE TABLE IF NOT EXISTS pairing_requests (
    id SERIAL PRIMARY KEY,
    channel VARCHAR(50) NOT NULL,
    code VARCHAR(8) UNIQUE NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    meta JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
    approved_at TIMESTAMP,
    approved_by VARCHAR(255)
);

-- 承認済み送信者テーブル
CREATE TABLE IF NOT EXISTS allowed_senders (
    id SERIAL PRIMARY KEY,
    channel VARCHAR(50) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255),
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by VARCHAR(255),
    notes TEXT,
    UNIQUE(channel, sender_id)
);

-- =====================================================
-- 3. メッセージログテーブル
-- =====================================================
CREATE TABLE IF NOT EXISTS message_log (
    id SERIAL PRIMARY KEY,
    channel VARCHAR(50) NOT NULL,
    sender_id VARCHAR(255),
    sender_name VARCHAR(255),
    recipient_id VARCHAR(255),
    message_type VARCHAR(50) DEFAULT 'text',
    content TEXT,
    content_binary BYTEA,
    direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
    session_id VARCHAR(255),
    processing_time_ms INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. セッションテーブル
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    channel VARCHAR(50) NOT NULL,
    peer_id VARCHAR(255) NOT NULL,
    context JSONB,
    state JSONB,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    UNIQUE(channel, peer_id)
);

-- =====================================================
-- 5. Webhookイベントテーブル
-- =====================================================
CREATE TABLE IF NOT EXISTS webhook_events (
    id SERIAL PRIMARY KEY,
    channel VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(255),
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. 監査ログテーブル
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    actor VARCHAR(255),
    target_type VARCHAR(100),
    target_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- インデックス作成
-- =====================================================

-- ペアリング用インデックス
CREATE INDEX idx_pairing_channel ON pairing_requests(channel);
CREATE INDEX idx_pairing_code ON pairing_requests(code);
CREATE INDEX idx_pairing_sender ON pairing_requests(sender_id);
CREATE INDEX idx_pairing_expires ON pairing_requests(expires_at) WHERE expires_at IS NOT NULL;

-- 承認済み送信者用インデックス
CREATE INDEX idx_allowed_channel ON allowed_senders(channel);
CREATE INDEX idx_allowed_sender ON allowed_senders(sender_id);

-- メッセージログ用インデックス
CREATE INDEX idx_message_channel ON message_log(channel);
CREATE INDEX idx_message_sender ON message_log(sender_id);
CREATE INDEX idx_message_created ON message_log(created_at);
CREATE INDEX idx_message_session ON message_log(session_id);
CREATE INDEX idx_message_direction ON message_log(direction);

-- セッション用インデックス
CREATE INDEX idx_session_channel ON sessions(channel);
CREATE INDEX idx_session_peer ON sessions(peer_id);
CREATE INDEX idx_session_expires ON sessions(expires_at);

-- Webhook用インデックス
CREATE INDEX idx_webhook_channel ON webhook_events(channel);
CREATE INDEX idx_webhook_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_processed ON webhook_events(processed) WHERE processed = FALSE;
CREATE INDEX idx_webhook_created ON webhook_events(created_at);

-- 監査ログ用インデックス
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_actor ON audit_log(actor);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- =====================================================
-- 便利なビュー
-- =====================================================

-- 有効なペアリングリクエストのみ表示
CREATE OR REPLACE VIEW active_pairing_requests AS
SELECT * FROM pairing_requests
WHERE expires_at > CURRENT_TIMESTAMP
  AND approved_at IS NULL;

-- 最近のメッセージ概要
CREATE OR REPLACE VIEW recent_messages AS
SELECT 
    channel,
    direction,
    COUNT(*) as message_count,
    MAX(created_at) as last_message_at
FROM message_log
WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY channel, direction;

-- セッション統計
CREATE OR REPLACE VIEW session_stats AS
SELECT 
    channel,
    COUNT(*) as active_sessions,
    COUNT(*) FILTER (WHERE last_activity_at > CURRENT_TIMESTAMP - INTERVAL '1 hour') as recent_sessions
FROM sessions
WHERE expires_at > CURRENT_TIMESTAMP
GROUP BY channel;

-- =====================================================
-- パーティショニング（オプション - 大量データ時）
-- =====================================================

-- メッセージログの月次パーティショニング（必要に応じて）
-- CREATE TABLE message_log_partitioned (LIKE message_log)
-- PARTITION BY RANGE (created_at);

-- =====================================================
-- 初期データ挿入
-- =====================================================

-- システム設定を保存
INSERT INTO openclaw_config (config_key, config_value)
VALUES ('schema_version', '{"version": "1.0.0", "created_at": "' || NOW() || '"}'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

-- 初期化完了
INSERT INTO audit_log (action, actor, details)
VALUES ('schema_initialized', 'system', '{"version": "1.0.0"}'::jsonb);
