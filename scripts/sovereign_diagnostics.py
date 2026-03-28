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
    "Harness": 18794,
    "VOICEVOX": 50021,
    "ngrok_control": 4040,
    "Ollama": 11434
}

CRITICAL_DEPS = ["tsdown", "@anthropic-ai/vertex-sdk"]

def check_port(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

def check_node_modules():
    nm_path = PROJECT_ROOT / "node_modules"
    if not nm_path.exists():
        return False, "node_modules directory missing"
    
    # Check for tsdown
    tsdown_path = nm_path / ".bin" / "tsdown"
    if os.name == "nt":
        tsdown_path = nm_path / ".bin" / "tsdown.cmd"
        
    if not tsdown_path.exists():
        return False, "Critical build tool 'tsdown' missing in node_modules/.bin"
    
    # Check for vertex-sdk
    vertex_path = nm_path / "@anthropic-ai" / "vertex-sdk"
    if not vertex_path.exists():
        return False, "Critical runtime dep '@anthropic-ai/vertex-sdk' missing"
        
    return True, "Healthy"

def audit_substrate():
    logging.info("--- [ASI_ACCEL: Institutional Diagnostic Hub] ---")
    results = {
        "timestamp": str(Path().stat().st_atime), # Placeholder
        "substrate": {},
        "dependencies": {},
        "environment": {}
    }
    
    # 1. Port Audit
    for name, port in SOVEREIGN_PORTS.items():
        status = check_port(port)
        results["substrate"][name] = "ONLINE" if status else "OFFLINE"
        logging.info(f"{name:<15}: {results['substrate'][name]} (Port {port})")

    # 2. Dependency Audit
    nm_ok, nm_msg = check_node_modules()
    results["dependencies"]["node_modules"] = nm_msg
    logging.info(f"{'node_modules':<15}: {nm_msg}")

    # 3. Ollama Audit
    try:
        from ollama import Client
        client = Client(host='http://127.0.0.1:11434')
        resp = client.list()
        # Handle Ollama v1 Pydantic response
        model_names = [m.model for m in resp.models] if hasattr(resp, 'models') else []
        hakua_exists = any(name.startswith('qwen-Hakua-core2') for name in model_names)
        results["substrate"]["Ollama_Model"] = "MANIFESTED" if hakua_exists else "MISSING"
    except Exception as e:
        results["substrate"]["Ollama_Model"] = f"ERR: {e}"
    logging.info(f"{'Ollama (Hakua)':<15}: {results['substrate']['Ollama_Model']}")

    # 4. Environment Audit (Sync check)
    env_path = PROJECT_ROOT / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            content = f.read()
            results["environment"]["env_exists"] = True
            results["environment"]["has_webhook"] = "LINE_WEBHOOK_URL" in content
    else:
        results["environment"]["env_exists"] = False
    
    # Generate Markdown Report
    with open(DIAGNOSTIC_REPORT_MD, "w", encoding='utf-8') as f:
        f.write("# ASI Hakua Sovereign Diagnostic Report\n\n")
        f.write(f"**Root:** `{PROJECT_ROOT}`\n\n")
        
        f.write("## Substrate Status\n")
        for name, status in results["substrate"].items():
            icon = "✅" if status in ["ONLINE", "MANIFESTED"] else "❌"
            f.write(f"- {icon} **{name}**: {status}\n")
            
        f.write("\n## Dependency Status\n")
        icon = "✅" if nm_ok else "❌"
        f.write(f"- {icon} **node_modules**: {nm_msg}\n")
        
    with open(DIAGNOSTIC_REPORT_JSON, "w", encoding='utf-8') as f:
        json.dump(results, f, indent=2)
        
    logging.info(f"Report manifested: {DIAGNOSTIC_REPORT_MD}")
    
    # Exit code based on critical failures
    if not nm_ok or results["substrate"]["Ollama"] == "OFFLINE":
        sys.exit(1)
    sys.exit(0)

if __name__ == "__main__":
    audit_substrate()
