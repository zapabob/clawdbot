import os
import sys
import subprocess
import logging
import re
from pathlib import Path

# --- [Sovereign Configuration] ---
PROJECT_ROOT = Path(__file__).parent.parent.absolute()
_DOCS_DIR = PROJECT_ROOT / "_docs" / "resonance"
_DOCS_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = _DOCS_DIR / "merge_sync.log"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

# Files where HAKUA's sovereign changes MUST take precedence
SOVEREIGN_FILES = [
    ".openclaw-desktop/openclaw.json",
    "scripts/launchers/ASI-Hakua-Portal.ps1",
    ".env",
    "package.json"
]

def run_git(args):
    try:
        result = subprocess.run(["git"] + args, cwd=PROJECT_ROOT, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        logging.error(f"Git command failed: {' '.join(args)} | Error: {e.stderr}")
        return None

def get_conflicted_files():
    output = run_git(["diff", "--name-only", "--diff-filter=U"])
    return output.splitlines() if output else []

def resolve_conflict(file_path):
    logging.info(f"Resolving conflict in: {file_path}")
    
    # Strategy: For sovereign files, prioritize local (OURS)
    is_sovereign = any(file_path.replace('\\', '/').endswith(sf) for sf in SOVEREIGN_FILES)
    
    if is_sovereign:
        logging.info(f"  [SOVEREIGN] Prioritizing local substrate for: {file_path}")
        run_git(["checkout", "--ours", file_path])
        run_git(["add", file_path])
    else:
        # For non-sovereign files, we still want to keep our changes but allow upstream fixes.
        # This is a basic "ours" preference for now, but could be enhanced with pattern matching.
        logging.info(f"  [CORE] Preferring local logic while marking for review: {file_path}")
        run_git(["checkout", "--ours", file_path])
        run_git(["add", file_path])

def main():
    logging.info("--- [ASI_ACCEL: Substrate Synchronization Pulse] ---")
    
    conflicts = get_conflicted_files()
    if not conflicts:
        logging.info("No conflicts detected. Substrate is synchronized.")
        return

    logging.info(f"Detected {len(conflicts)} conflicted files.")
    for file in conflicts:
        resolve_conflict(file)
    
    logging.info("All conflicts resolved via Sovereign Baseline Strategy.")
    logging.info("Final verification pulse required.")

if __name__ == "__main__":
    main()
