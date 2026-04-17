"""Hypura Harness daemon launcher with health-check polling."""
from __future__ import annotations

import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

DAEMON_URL = "http://127.0.0.1:18794/status"
# skills/hypura-harness/scripts/ -> repo root is parents[3]
_REPO_ROOT = Path(__file__).resolve().parents[3]
PID_FILE = _REPO_ROOT / ".openclaw-desktop" / "harness_daemon.pid"
HARNESS_DIR = _REPO_ROOT / "extensions" / "hypura-harness" / "scripts"
HARNESS_SCRIPT = HARNESS_DIR / "harness_daemon.py"
TIMEOUT_SEC = 10
POLL_INTERVAL_SEC = 0.5


def is_running() -> bool:
    try:
        with urllib.request.urlopen(DAEMON_URL, timeout=2) as r:
            return r.status == 200
    except (urllib.error.URLError, TimeoutError, OSError):
        return False


def start() -> None:
    if is_running():
        print("[hypura] Daemon already running.")
        return

    if not HARNESS_SCRIPT.exists():
        print(f"[hypura] ERROR: harness daemon not found at {HARNESS_SCRIPT}", file=sys.stderr)
        sys.exit(1)

    print("[hypura] Starting harness daemon...")
    proc = subprocess.Popen(
        ["uv", "run", "harness_daemon.py"],
        cwd=str(HARNESS_DIR),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    PID_FILE.parent.mkdir(parents=True, exist_ok=True)
    PID_FILE.write_text(str(proc.pid), encoding="utf-8")

    deadline = time.time() + TIMEOUT_SEC
    while time.time() < deadline:
        if is_running():
            print(f"[hypura] Daemon ready (PID {proc.pid}).")
            return
        time.sleep(POLL_INTERVAL_SEC)

    print("[hypura] ERROR: Daemon did not start within timeout.", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    start()
