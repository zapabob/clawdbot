#!/bin/bash
# LINE + Tailscale セットアップスクリプト

set -e

echo "=== OpenClaw LINE + Tailscale セットアップ ==="

# 1. Tailscale確認
echo ""
echo "1. Tailscale状態確認..."
if ! command -v tailscale &> /dev/null; then
    echo "Tailscaleがインストールされていません。"
    echo "インストールしてください: https://tailscale.com/download"
    exit 1
fi

tailscale status > /dev/null 2>&1 || {
    echo "Tailscaleにログインしてください..."
    tailscale up
}

TAILNET_NAME=$(tailscale status --json 2>/dev/null | grep -o '"DNSName": "[^"]*"' | cut -d'"' -f4 | sed 's/\.local\.//' || echo "unknown")
echo "Tailnet: ${TAILNET_NAME:-unknown}"

# 2. OpenClaw設定
echo ""
echo "2. OpenClaw設定確認..."
CONFIG_DIR="${HOME}/.openclaw"
CONFIG_FILE="${CONFIG_DIR}/config.json"

mkdir -p "${CONFIG_DIR}"

if [ ! -f "${CONFIG_FILE}" ]; then
    echo '{"channels": {}}' > "${CONFIG_FILE}"
fi

# LINE設定
echo ""
echo "3. LINE設定..."
read -p "LINE Channel Access Token: " LINE_TOKEN
read -p "LINE Channel Secret: " LINE_SECRET

# 設定更新
python3 -c "
import json
config_file = '${CONFIG_FILE}'
with open(config_file) as f:
    config = json.load(f)

config['channels'] = config.get('channels', {})
config['channels']['line'] = {
    'enabled': True,
    'channelAccessToken': '${LINE_TOKEN}',
    'channelSecret': '${LINE_SECRET}',
    'dmPolicy': 'open',
    'groupPolicy': 'allowlist'
}

config['skills'] = config.get('skills', {})
config['skills']['entries'] = config['skills'].get('entries', {})

config['gateway'] = config.get('gateway', {})
config['gateway']['tailscale'] = {'mode': 'serve'}

with open(config_file, 'w') as f:
    json.dump(config, f, indent=2)
"

echo "LINE設定完了: ${CONFIG_FILE}"

# 3. Tailscale Serve
echo ""
echo "4. Tailscale Serve設定..."
if ! tailscale funnel status --json 2>/dev/null | grep -q '"HTTPS": true'; then
    read -p "Tailscale Funnelを有効化しますか? (y/n): " ENABLE_FUNNEL
    if [ "$ENABLE_FUNNEL" = "y" ]; then
        tailscale funnel --bg 18789 || tailscale serve --bg --yes 18789
        echo "Tailscale Funnel/Serveを有効化しました"
    fi
else
    echo "Tailscale Funnelは既に有効です"
fi

# 4. スキル設定
echo ""
echo "5. APIキー設定..."
read -p "OpenAI API Key (Codex用, 省略可): " OPENAI_KEY
read -p "Google Gemini API Key (省略可): " GEMINI_KEY

python3 -c "
import json
config_file = '${CONFIG_FILE}'
with open(config_file) as f:
    config = json.load(f)

skills = config.get('skills', {}).get('entries', {})

if '${OPENAI_KEY}':
    skills['codex'] = {'enabled': True, 'env': {'OPENAI_API_KEY': '${OPENAI_KEY}'}}

if '${GEMINI_KEY}':
    skills['gemini'] = {'enabled': True, 'env': {'GEMINI_API_KEY': '${GEMINI_KEY}'}}

skills['opencode'] = {'enabled': True}

config['skills'] = {'entries': skills}

with open(config_file, 'w') as f:
    json.dump(config, f, indent=2)
"

echo "スキル設定完了"

# 5. 接続情報表示
echo ""
echo "=== セットアップ完了 ==="
echo ""
echo "アクセスURL:"
if [ "${TAILNET_NAME}" != "unknown" ]; then
    echo "  https://${TAILNET_NAME}.ts.net:18789"
fi
echo ""
echo "LINEウェブフックURL:"
echo "  https://<your-tailnet>.ts.net:18789/webhook/line"
echo ""
echo "使用方法:"
echo "  LINEから以下のコマンドを送信:"
echo "  /codex generate <プロンプト>"
echo "  /gemini <メッセージ>"
echo "  /opencode <タスク>"
