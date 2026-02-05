$env:OPENCLAW_SKIP_CHANNELS = "1"
$env:CLAWDBOT_SKIP_CHANNELS = "1"

node dist/index.mjs gateway run --port 18789 --dev
