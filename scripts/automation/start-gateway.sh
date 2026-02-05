#!/bin/bash

set -e

echo "============================================"
echo "OpenClaw + LINE 双方向通信スターター"
echo "============================================"
echo ""

# 設定ファイルのパス
CONFIG_DIR="${HOME}/.openclaw"
CONFIG_FILE="${CONFIG_DIR}/openclaw.json"

# 設定ファイルが存在するか確認
if [ ! -f "$CONFIG_FILE" ]; then
    echo "⚠️  設定ファイルが見つかりません: $CONFIG_FILE"
    echo ""
    echo "📋 セットアップ手順:"
    echo ""
    echo "1. LINE Developer Console で設定:"
    echo "   https://developers.line.biz/console/"
    echo ""
    echo "2. 以下の情報を取得:"
    echo "   - Channel access token"
    echo "   - Channel secret"
    echo ""
    echo "3. 設定ファイルを作成: $CONFIG_FILE"
    echo "   openclaw-config-example.json をコピーして編集してください"
    echo ""
    echo "4. または環境変数を設定:"
    echo "   export LINE_CHANNEL_ACCESS_TOKEN=your_token"
    echo "   export LINE_CHANNEL_SECRET=your_secret"
    echo ""
    exit 1
fi

echo "✅ 設定ファイルが見つかりました: $CONFIG_FILE"
echo ""

# ゲートウェイの起動
echo "🚀 ゲートウェイを起動しています..."
echo "   URL: http://127.0.0.1:18789/"
echo "   LINE Webhook: http://127.0.0.1:18789/line/webhook"
echo ""
echo "📱 Web UI を開くには:"
echo "   1. ブラウザで http://127.0.0.1:18789/ を開く"
echo "   2. または「openclaw dashboard」コマンドを実行"
echo ""
echo "⛔ 停止するには Ctrl+C を押してください"
echo ""

node openclaw.mjs gateway --port 18789 --verbose
