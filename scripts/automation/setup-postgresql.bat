@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ============================================
echo OpenClaw + PostgreSQL 全自動セットアップ
echo ============================================
echo.

REM === チェック: 管理者権限 ===
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  管理者権限が必要です
echo    右クリック → 「管理者として実行」してください
echo.
pause
exit /b 1
)

REM === ステップ1: PostgreSQLインストール確認 ===
echo [1/6] PostgreSQLインストール確認...
where psql >nul 2>&1
if %errorlevel% == 0 (
    echo    ✅ PostgreSQL既にインストール済み
echo    バージョン:
psql --version
echo.
goto SKIP_INSTALL
)

echo    📥 PostgreSQLが見つかりません。インストールします...
echo.

REM Chocolatey確認
where choco >nul 2>&1
if %errorlevel% == 0 (
echo    Chocolatey経由でインストール中...
choco install postgresql -y --params '/Password:openclaw_admin /Port:5432'
if %errorlevel% == 0 (
echo    ✅ インストール完了
echo.
set PGUSER=postgres
set PGPASSWORD=openclaw_admin
set PGHOST=localhost
set PGPORT=5432
goto SETUP_DB
) else (
echo    ⚠️  インストール失敗
goto MANUAL_INSTALL
)
) else (
echo    Chocolateyが見つかりません
goto MANUAL_INSTALL
)

:MANUAL_INSTALL
echo    📥 手動インストール方法:
echo    1. https://www.postgresql.org/download/windows/ からダウンロード
echo    2. インストーラーを実行（パスワードを記録してください）
echo    3. インストール完了後、このスクリプトを再度実行
echo.
echo    または、PostgreSQLが既にインストールされている場合:
echo    - パスを手動で設定してください
echo.
set /p PG_PATH="PostgreSQLのbinフォルダパス (例: C:\Program Files\PostgreSQL\16\bin): "
if not "!PG_PATH!"=="" (
set PATH=!PG_PATH!;!PATH!
where psql >nul 2>&1
if %errorlevel% == 0 (
echo    ✅ PostgreSQLパス設定完了
goto SETUP_DB
)
)
pause
exit /b 1

:SETUP_DB
REM === ステップ2: データベースとユーザー作成 ===
echo [2/6] OpenClaw用データベース設定...
echo    ホスト: %PGHOST%
echo    ポート: %PGPORT%
echo    ユーザー: %PGUSER%
echo.

set OPENCLAW_DB=openclaw
echo    データベース名: !OPENCLAW_DB!
echo    OpenClaw専用ユーザー: openclaw_app
echo.

REM データベース作成（存在しない場合のみ）
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "SELECT 1 FROM pg_database WHERE datname = '!OPENCLAW_DB!'" | findstr "1 row" >nul
if %errorlevel% neq 0 (
echo    📦 データベース !OPENCLAW_DB! を作成中...
createdb -h %PGHOST% -p %PGPORT% -U %PGUSER% !OPENCLAW_DB!
if %errorlevel% neq 0 (
echo    ⚠️  データベース作成失敗
echo    パスワードを確認してください
echo.
set /p PGPASSWORD="postgresユーザー名のパスワード: "
createdb -h %PGHOST% -p %PGPORT% -U %PGUSER% !OPENCLAW_DB!
)
) else (
echo    ✅ データベース !OPENCLAW_DB! は既に存在します
)

REM OpenClaw専用ユーザー作成
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "SELECT 1 FROM pg_roles WHERE rolname = 'openclaw_app'" | findstr "1 row" >nul
if %errorlevel% neq 0 (
echo    👤 ユーザー openclaw_app を作成中...
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "CREATE USER openclaw_app WITH PASSWORD 'openclaw_secure_pass_123';" >nul 2>&1
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d !OPENCLAW_DB! -c "GRANT ALL PRIVILEGES ON DATABASE !OPENCLAW_DB! TO openclaw_app;" >nul 2>&1
echo    ✅ ユーザー作成完了
) else (
echo    ✅ ユーザー openclaw_app は既に存在します
)
echo.

:SKIP_INSTALL
REM === ステップ3: スキーマ作成 ===
echo [3/6] データベーススキーマ作成...

set SCHEMA_SQL=%TEMP%\openclaw_schema.sql
echo -- OpenClaw PostgreSQL Schema > !SCHEMA_SQL!
echo CREATE TABLE IF NOT EXISTS openclaw_config ( >> !SCHEMA_SQL!
echo     id SERIAL PRIMARY KEY, >> !SCHEMA_SQL!
echo     config_key VARCHAR(255) UNIQUE NOT NULL, >> !SCHEMA_SQL!
echo     config_value JSONB NOT NULL, >> !SCHEMA_SQL!
echo     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, >> !SCHEMA_SQL!
echo     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP >> !SCHEMA_SQL!
echo ); >> !SCHEMA_SQL!
echo. >> !SCHEMA_SQL!
echo CREATE TABLE IF NOT EXISTS pairing_requests ( >> !SCHEMA_SQL!
echo     id SERIAL PRIMARY KEY, >> !SCHEMA_SQL!
echo     channel VARCHAR(50) NOT NULL, >> !SCHEMA_SQL!
echo     code VARCHAR(8) UNIQUE NOT NULL, >> !SCHEMA_SQL!
echo     sender_id VARCHAR(255) NOT NULL, >> !SCHEMA_SQL!
echo     meta JSONB, >> !SCHEMA_SQL!
echo     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, >> !SCHEMA_SQL!
echo     expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour') >> !SCHEMA_SQL!
echo ); >> !SCHEMA_SQL!
echo. >> !SCHEMA_SQL!
echo CREATE TABLE IF NOT EXISTS allowed_senders ( >> !SCHEMA_SQL!
echo     id SERIAL PRIMARY KEY, >> !SCHEMA_SQL!
echo     channel VARCHAR(50) NOT NULL, >> !SCHEMA_SQL!
echo     sender_id VARCHAR(255) NOT NULL, >> !SCHEMA_SQL!
echo     approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, >> !SCHEMA_SQL!
echo     UNIQUE(channel, sender_id) >> !SCHEMA_SQL!
echo ); >> !SCHEMA_SQL!
echo. >> !SCHEMA_SQL!
echo CREATE TABLE IF NOT EXISTS message_log ( >> !SCHEMA_SQL!
echo     id SERIAL PRIMARY KEY, >> !SCHEMA_SQL!
echo     channel VARCHAR(50) NOT NULL, >> !SCHEMA_SQL!
echo     sender_id VARCHAR(255), >> !SCHEMA_SQL!
echo     message_type VARCHAR(50), >> !SCHEMA_SQL!
echo     content TEXT, >> !SCHEMA_SQL!
echo     direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')), >> !SCHEMA_SQL!
echo     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP >> !SCHEMA_SQL!
echo ); >> !SCHEMA_SQL!
echo. >> !SCHEMA_SQL!
echo CREATE INDEX IF NOT EXISTS idx_pairing_channel ON pairing_requests(channel); >> !SCHEMA_SQL!
echo CREATE INDEX IF NOT EXISTS idx_pairing_code ON pairing_requests(code); >> !SCHEMA_SQL!
echo CREATE INDEX IF NOT EXISTS idx_allowed_channel ON allowed_senders(channel); >> !SCHEMA_SQL!
echo CREATE INDEX IF NOT EXISTS idx_message_channel ON message_log(channel); >> !SCHEMA_SQL!
echo CREATE INDEX IF NOT EXISTS idx_message_created ON message_log(created_at); >> !SCHEMA_SQL!

psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d !OPENCLAW_DB! -f !SCHEMA_SQL! >nul 2>&1
if %errorlevel% == 0 (
echo    ✅ スキーマ作成完了
) else (
echo    ⚠️  スキーマ作成でエラーが発生（既存の可能性があります）
)
echo.

REM === ステップ4: 設定ファイル更新 ===
echo [4/6] OpenClaw設定を更新...
echo    データベース接続情報を設定中...
echo.

REM 既存の設定をバックアップ
if exist "%USERPROFILE%\.openclaw\openclaw.json" (
copy "%USERPROFILE%\.openclaw\openclaw.json" "%USERPROFILE%\.openclaw\openclaw.json.backup" >nul
echo    💾 既存設定をバックアップ: openclaw.json.backup
)

REM データベース接続設定を追加
node -e "
const fs = require('fs');
const path = require('path');
const configPath = path.join(process.env.USERPROFILE, '.openclaw', 'openclaw.json');
let config = {};
try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
    console.log('新規設定ファイル作成');
}

// データベース設定を追加
config.database = {
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: 'openclaw',
    username: 'openclaw_app',
    password: 'openclaw_secure_pass_123',
    ssl: false,
    poolSize: 10
};

// 永続化設定
config.persistence = {
    enabled: true,
    store: 'postgresql',
    fallbackToFile: true
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('✅ 設定ファイル更新完了');
" 2>nul

if %errorlevel% neq 0 (
echo    ⚠️  設定ファイル更新失敗
echo    手動で以下を追加してください:
echo.
echo    "database": {
echo      "type": "postgresql",
echo      "host": "localhost",
echo      "port": 5432,
echo      "database": "openclaw",
echo      "username": "openclaw_app",
echo      "password": "openclaw_secure_pass_123"
echo    }
echo.
)

REM === ステップ5: データ移行 ===
echo [5/6] 既存データの移行...
if exist "%USERPROFILE%\.openclaw\credentials\line-pairing.json" (
echo    📦 ペアリングデータを移行中...
node -e "
const fs = require('fs');
const { Client } = require('pg');
const path = require('path');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'openclaw',
    user: 'openclaw_app',
    password: 'openclaw_secure_pass_123'
});

async function migrate() {
    try {
        await client.connect();
        
        // ペアリングデータ移行
        const pairingPath = path.join(process.env.USERPROFILE, '.openclaw', 'credentials', 'line-pairing.json');
        if (fs.existsSync(pairingPath)) {
            const data = JSON.parse(fs.readFileSync(pairingPath, 'utf8'));
            if (data.requests && data.requests.length > 0) {
                for (const req of data.requests) {
                    await client.query(
                        'INSERT INTO pairing_requests (channel, code, sender_id, meta, created_at, expires_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (code) DO NOTHING',
                        ['line', req.code, req.id, JSON.stringify(req.meta || {}), req.createdAt, new Date(new Date(req.createdAt).getTime() + 60*60*1000).toISOString()]
                    );
                }
                console.log('✅ ペアリングデータ移行完了: ' + data.requests.length + '件');
            } else {
                console.log('ℹ️  移行するペアリングデータがありません');
            }
        }
        
        // allowlistデータ移行
        const allowlistPath = path.join(process.env.USERPROFILE, '.openclaw', 'credentials', 'line-allowFrom.json');
        if (fs.existsSync(allowlistPath)) {
            const data = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));
            if (data.allowFrom && data.allowFrom.length > 0) {
                for (const senderId of data.allowFrom) {
                    await client.query(
                        'INSERT INTO allowed_senders (channel, sender_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        ['line', senderId]
                    );
                }
                console.log('✅ allowlistデータ移行完了: ' + data.allowFrom.length + '件');
            }
        }
        
        await client.end();
    } catch (err) {
        console.error('移行エラー:', err.message);
    }
}

migrate();
" 2>nul
) else (
echo    ℹ️  移行するファイルデータがありません
echo    新規インストールとして続行します
)
echo.

REM === ステップ6: テストと確認 ===
echo [6/6] データベース接続テスト...
psql -h %PGHOST% -p %PGPORT% -U openclaw_app -d !OPENCLAW_DB! -c "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema = 'public';" | findstr "tables" >nul
if %errorlevel% == 0 (
echo    ✅ データベース接続テスト成功
echo.
echo    📊 データベース統計:
psql -h %PGHOST% -p %PGPORT% -U openclaw_app -d !OPENCLAW_DB! -c "SELECT 'Tables: ' || COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>nul | findstr "Tables"
psql -h %PGHOST% -p %PGPORT% -U openclaw_app -d !OPENCLAW_DB! -c "SELECT 'Pairing requests: ' || COUNT(*) FROM pairing_requests;" 2>nul | findstr "Pairing"
psql -h %PGHOST% -p %PGPORT% -U openclaw_app -d !OPENCLAW_DB! -c "SELECT 'Allowed senders: ' || COUNT(*) FROM allowed_senders;" 2>nul | findstr "Allowed"
) else (
echo    ⚠️  接続テスト失敗
echo    設定を確認してください
echo.
)
echo.

REM === 完了 ===
echo ============================================
echo ✅ PostgreSQL統合セットアップ完了！
echo ============================================
echo.
echo 📋 接続情報:
echo    ホスト: localhost
echo    ポート: 5432
echo    データベース: openclaw
echo    ユーザー: openclaw_app
echo    パスワード: openclaw_secure_pass_123
echo.
echo 🚀 次のステップ:
echo    1. Gatewayを起動: node openclaw.mjs gateway
echo    2. LINEペアリングを実行
echo    3. すべてのデータはPostgreSQLに自動保存されます
echo.
echo 📁 重要ファイル:
echo    設定: %USERPROFILE%\.openclaw\openclaw.json
echo    バックアップ: %USERPROFILE%\.openclaw\openclaw.json.backup
echo.
echo 🔧 管理コマンド:
echo    psql -U openclaw_app -d openclaw
echo    node openclaw.mjs pairing list line
echo.
pause
