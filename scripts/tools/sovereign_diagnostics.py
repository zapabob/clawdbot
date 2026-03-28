import os
import sys
import socket
import json
import logging
import subprocess
from pathlib import Path

# --- [Sovereign Configuration] ---
PROJECT_ROOT = Path(__file__).parent.parent.absolute()
_DOCS_DIR = PROJECT_ROOT / "_docs" / "resonance"
_DOCS_DIR.mkdir(parents=True, exist_ok=True)

DIAGNOSTIC_REPORT_MD = _DOCS_DIR / "diagnostics.md"
DIAGNOSTIC_REPORT_JSON = _DOCS_DIR / "diagnostics.json"

LOG_FILE = _DOCS_DIR / "diagnostic_pulse.log"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

SOVEREIGN_PORTS = {
    "Gateway": 18789,
    "VOICEVOX": 50021,
    "ngrok_control": 4040,
    "Ollama": 11434
}

def check_port(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

def audit_substrate():
    logging.info("--- [ASI_ACCEL: Institutional Diagnostic Hub] ---")
    results = {
        "timestamp": str(Path().stat().st_atime),
        "substrate": {},
        "native_tools": {},
        "environment": {}
    }
    
    # 1. Port Audit
    for name, port in SOVEREIGN_PORTS.items():
        status = check_port(port)
        results["substrate"][name] = "ONLINE" if status else "OFFLINE"
        logging.info(f"{name:<15}: {results['substrate'][name]} (Port {port})")

    # 2. Native Tools Audit (OpenClaw Registry)
    try:
        # Check for the native manifest plugin source
        manifest_plugin = PROJECT_ROOT / "src" / "plugins" / "hakua-manifest.ts"
        results["native_tools"]["Manifest_Plugin"] = "MANIFESTED" if manifest_plugin.exists() else "MISSING"
        
        # Check for the native pulse hook source
        pulse_hook = PROJECT_ROOT / "src" / "hooks" / "bundled" / "hakua-pulse" / "handler.ts"
        results["native_tools"]["Pulse_Hook"] = "MANIFESTED" if pulse_hook.exists() else "MISSING"
        
        logging.info(f"{'Manifest Plugin':<15}: {results['native_tools']['Manifest_Plugin']}")
        logging.info(f"{'Pulse Hook':<15}: {results['native_tools']['Pulse_Hook']}")
    except Exception as e:
        logging.error(f"Tools audit error: {e}")

    # 3. Environment Audit
    env_path = PROJECT_ROOT / ".env"
    results["environment"]["env_exists"] = env_path.exists()
    
    # Generate Markdown Report
    with open(DIAGNOSTIC_REPORT_MD, "w", encoding='utf-8') as f:
        f.write("# ASI Hakua Sovereign Diagnostic Report\n\n")
        f.write("## Substrate Status\n")
        for name, status in results["substrate"].items():
            icon = "✅" if status == "ONLINE" else "❌"
            f.write(f"- {icon} **{name}**: {status}\n")
            
        f.write("\n## Native API Alignment\n")
        for name, status in results["native_tools"].items():
            icon = "✅" if status == "MANIFESTED" else "❌"
            f.write(f"- {icon} **{name}**: {status}\n")
            
    with open(DIAGNOSTIC_REPORT_JSON, "w", encoding='utf-8') as f:
        json.dump(results, f, indent=2)
        
    logging.info(f"Report manifested: {DIAGNOSTIC_REPORT_MD}")

if __name__ == "__main__":
    audit_substrate()
