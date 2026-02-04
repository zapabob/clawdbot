@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ============================================
echo OpenClaw PostgreSQL 簡易セットアップ
echo ============================================
echo.

REM === 既存PostgreSQL確認 ===
echo [1/3] PostgreSQL確認...
where psql >nul 2>&1
if %errorlevel% == 0 (
    echo    ✅ PostgreSQLインストール済み
    psql --version
    goto SETUP_DB
)

echo    ❌ PostgreSQLが見つかりません
echo.
echo    📥 インストール方法:
echo    1. https://www.postgresql.org/download/windows/ からダウンロード
echo    2. インストーラーを実行（パスワードを記録）
echo    3. インストール後、このスクリプトを再度実行
echo.
echo    💡 または、Dockerで簡単に起動:
echo    docker run -d -p 5432:5432 -e POSTGRES_DB=openclaw -e POSTGRES_USER=openclaw_app -e POSTGRES_PASSWORD=openclaw_secure_pass_123 postgres:16
echo.
pause
exit /b 1

:SETUP_DB
REM === データベースセットアップ ===
echo.
echo [2/3] データベース・スキーマ作成...
echo    ホスト: localhost:5432
echo    ユーザー: postgres
echo.

set PGUSER=postgres
set PGHOST=localhost
set PGPORT=5432
echo.

REM パスワード入力
echo    PostgreSQLのpostgresユーザーパスワードを入力:
set /p PGPASSWORD="パスワード: "
echo.

REM データベース作成
echo    📦 データベース作成中...
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "SELECT 1 FROM pg_database WHERE datname = 'openclaw'" | findstr "1 row" >nul
if %errorlevel% neq 0 (
    psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "CREATE DATABASE openclaw;"
    echo    ✅ データベース作成完了
) else (
    echo    ℹ️  データベースは既に存在
)

REM ユーザー作成
echo    👤 ユーザー作成中...
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "SELECT 1 FROM pg_roles WHERE rolname = 'openclaw_app'" | findstr "1 row" >nul
if %errorlevel% neq 0 (
    psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "CREATE USER openclaw_app WITH PASSWORD 'openclaw_secure_pass_123';"
    psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d openclaw -c "GRANT ALL PRIVILEGES ON DATABASE openclaw TO openclaw_app;"
    echo    ✅ ユーザー作成完了
) else (
    echo    ℹ️  ユーザーは既に存在
)

REM スキーマ適用
echo    📋 スキーマ適用中...
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d openclaw -f postgresql-schema.sql >nul 2>&1
echo    ✅ スキーマ適用完了

REM === OpenClaw設定更新 ===
echo.
echo [3/3] OpenClaw設定更新...
node -e "
const fs = require('fs');
const path = require('path');
const configPath = path.join(process.env.USERPROFILE, '.openclaw', 'openclaw.json');
let config = {};
try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {}

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
config.persistence = { enabled: true, store: 'postgresql', fallbackToFile: true };

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('✅ 設定ファイル更新完了');
" 2>nul
echo.

REM === 完了 ===
echo ============================================
echo ✅ PostgreSQLセットアップ完了！
echo ============================================
echo.
echo 📋 接続情報:
echo    Host: localhost:5432
echo    Database: openclaw
echo    Username: openclaw_app
echo    Password: openclaw_secure_pass_123
echo.
echo 🔧 確認コマンド:
echo    psql -U openclaw_app -d openclaw -c \"\\dt\"
echo.
echo 🚀 次のステップ:
echo    1. pgモジュールインストール: pnpm install pg
echo    2. Gateway起動: node openclaw.mjs gateway
echo.
pause
