@echo off
rem OpenClaw Gateway (profile: desktop-stack, v2026.3.14)
set "HOME=C:\Users\downl"
set "TMPDIR=C:\Users\downl\AppData\Local\Temp"
set "NO_PROXY=localhost,127.0.0.1"
set "no_proxy=localhost,127.0.0.1"
set "OPENCLAW_STATE_DIR=C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\.openclaw-desktop"
set "OPENCLAW_CONFIG_PATH=C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\.openclaw-desktop\openclaw.json"
set "OPENCLAW_PROFILE=desktop-stack"
set "OPENCLAW_GATEWAY_PORT=18789"
set "OPENCLAW_SYSTEMD_UNIT=openclaw-gateway-desktop-stack.service"
set "OPENCLAW_WINDOWS_TASK_NAME=OpenClaw Gateway (desktop-stack)"
set "OPENCLAW_SERVICE_MARKER=openclaw"
set "OPENCLAW_SERVICE_KIND=gateway"
set "OPENCLAW_SERVICE_VERSION=2026.3.14"
"C:\Program Files\nodejs\node.exe" C:\Users\downl\Desktop\clawdbot-main3\clawdbot-main\dist\index.js gateway --port 18789
