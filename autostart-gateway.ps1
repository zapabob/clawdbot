$env:OPENCLAW_STATE_DIR = "C:\Users\downl\.openclaw"
$env:OPENCLAW_CONFIG_PATH = "C:\Users\downl\.openclaw\openclaw.json"
cd C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main
node dist/index.mjs gateway run --port 18789 --allow-unconfigured
