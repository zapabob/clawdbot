#!/bin/bash
# Export current environment variables to .env file

echo "============================================"
echo "  💾 Export Current Environment to .env"
echo "============================================"
echo ""

ENV_FILE=".env.backup"

echo "📤 Exporting environment variables to $ENV_FILE..."
echo ""

cat > "$ENV_FILE" << EOF
# OpenClaw Environment Export
# Generated on: $(date)

# OpenAI Configuration
OPENAI_CLIENT_ID=${OPENAI_CLIENT_ID:-}
OPENAI_CLIENT_SECRET=${OPENAI_CLIENT_SECRET:-}
OPENAI_API_KEY=${OPENAI_API_KEY:-}

# Twilio Configuration
TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID:-}
TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN:-}
TWILIO_WHATSAPP_FROM=${TWILIO_WHATSAPP_FROM:-}

# LINE Configuration
LINE_CHANNEL_ACCESS_TOKEN=${LINE_CHANNEL_ACCESS_TOKEN:-}
LINE_CHANNEL_SECRET=${LINE_CHANNEL_SECRET:-}

# Gateway Settings
OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT:-18789}
OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND:-loopback}
OPENCLAW_GATEWAY_MODE=${OPENCLAW_GATEWAY_MODE:-local}

# Auto-Improve Settings
AUTO_IMPROVE_ENABLED=${AUTO_IMPROVE_ENABLED:-true}
AUTO_IMPROVE_MODE=${AUTO_IMPROVE_MODE:-high}
AUTO_IMPROVE_CHECK_INTERVAL=${AUTO_IMPROVE_CHECK_INTERVAL:-30}
EOF

echo "✅ Environment exported to: $ENV_FILE"
echo ""
echo "📝 To apply these to your main .env file:"
echo "   cp .env.backup .env"
echo ""
read -p "Press any key to continue..."
