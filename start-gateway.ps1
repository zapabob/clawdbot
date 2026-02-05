$env:OPENCLAW_STATE_DIR = "C:\Users\downl\.openclaw"
$env:OPENCLAW_CONFIG_PATH = "C:\Users\downl\.openclaw\openclaw.json"

node dist/index.mjs gateway run --port 18789 --allow-unconfigured
