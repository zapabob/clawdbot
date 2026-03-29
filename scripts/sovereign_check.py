import subprocess
import concurrent.futures
import time
import os
import sys
import logging
from pathlib import Path
from datetime import datetime

# --- [MILSPEC Configuration] ---
MAX_THREADS = 12
PROJECT_ROOT = Path(__file__).parent.parent
LOG_DIR = PROJECT_ROOT / "_docs"
LOG_DIR.mkdir(exist_ok=True)

# Generate log filename
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
log_file = LOG_DIR / f"{timestamp}_Diagnostic-Sweep_Antigravity.md"

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_file, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("SPCE")

# --- [Check Suite Definition] ---
# Tasks are (Name, Command)
# Using 'pnpm run' for consistency with package.json
TASKS = [
    ("Conflict Markers", "pnpm check:no-conflict-markers"),
    ("Host Env Policy", "pnpm check:host-env-policy:swift"),
    ("Base Config Schema", "pnpm check:base-config-schema"),
    ("Plugin Metadata", "pnpm check:bundled-plugin-metadata"),
    ("Auth Env Vars", "pnpm check:bundled-provider-auth-env-vars"),
    ("Runtime Deps", "pnpm check:runtime-required-deps"),
    ("Formatting", "pnpm format:check"),
    ("TSGO Lint", "pnpm tsgo"),
    ("Plugin SDK Exports", "pnpm plugin-sdk:check-exports"),
    ("Core Lint (Oxlint)", "pnpm lint"),
    ("Lint: Random Msg", "pnpm lint:tmp:no-random-messaging"),
    ("Lint: Agnostic Boundaries", "pnpm lint:tmp:channel-agnostic-boundaries"),
    ("Lint: Raw Channel Fetch", "pnpm lint:tmp:no-raw-channel-fetch"),
    ("Lint: Ingress Owner", "pnpm lint:agent:ingress-owner"),
    ("Lint: HTTP Handlers", "pnpm lint:plugins:no-register-http-handler"),
    ("Lint: Monolithic SDK", "pnpm lint:plugins:no-monolithic-plugin-sdk-entry-imports"),
    ("Lint: Ext Src Imports", "pnpm lint:plugins:no-extension-src-imports"),
    ("Lint: Ext Test Core", "pnpm lint:plugins:no-extension-test-core-imports"),
    ("Lint: Ext Imports", "pnpm lint:plugins:no-extension-imports"),
    ("Lint: SDK Subpaths", "pnpm lint:plugins:plugin-sdk-subpaths-exported"),
    ("Lint: Ext SDK Boundary", "pnpm lint:extensions:no-src-outside-plugin-sdk"),
    ("Lint: Ext SDK Internal", "pnpm lint:extensions:no-plugin-sdk-internal"),
    ("Lint: Ext Relative", "pnpm lint:extensions:no-relative-outside-package"),
    ("Lint: Web Search", "pnpm lint:web-search-provider-boundaries"),
    ("Lint: Webhook Body", "pnpm lint:webhook:no-low-level-body-read"),
    ("Lint: Auth Store", "pnpm lint:auth:no-pairing-store-group"),
    ("Lint: Account Scope", "pnpm lint:auth:pairing-account-scope"),
    ("PowerShell Analysis", "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/launchers/parallel-analyzer.ps1")
]

def run_check(name, command):
    """Executes a single check command and captures the result."""
    start_time = time.time()
    logger.info(f"[START] {name}")
    
    try:
        # Use shell=True for 'pnpm' commands on Windows
        result = subprocess.run(
            command,
            shell=True,
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace"
        )
        duration = time.time() - start_time
        
        status = "SUCCESS" if result.returncode == 0 else "FAILED"
        if status == "SUCCESS":
            logger.info(f"[DONE]  {name} ({duration:.2f}s)")
        else:
            logger.error(f"[FAIL]  {name} ({duration:.2f}s)")
            if result.stdout:
                logger.debug(f"STDOUT for {name}:\n{result.stdout}")
            if result.stderr:
                logger.debug(f"STDERR for {name}:\n{result.stderr}")
                
        return {
            "name": name,
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "duration": duration
        }
    except Exception as e:
        logger.error(f"[ERROR] {name}: {str(e)}")
        return {
            "name": name,
            "success": False,
            "stdout": "",
            "stderr": str(e),
            "duration": time.time() - start_time
        }

def main():
    logger.info(f"# Sovereign Parallel Check Sweep (Threads: {MAX_THREADS})")
    logger.info(f"Root: {PROJECT_ROOT}")
    logger.info("-" * 40)
    
    total_start = time.time()
    results = []
    
    # Execute in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        future_to_check = {executor.submit(run_check, name, cmd): name for name, cmd in TASKS}
        for future in concurrent.futures.as_completed(future_to_check):
            results.append(future.result())

    total_duration = time.time() - total_start
    
    # --- [Final Report Generation] ---
    logger.info("-" * 40)
    logger.info(f"Sweep Completed in {total_duration:.2f}s")
    
    failed_tasks = [r for r in results if not r["success"]]
    success_count = len(results) - len(failed_tasks)
    
    logger.info(f"Summary: {success_count}/{len(results)} Passed")
    
    if failed_tasks:
        logger.warning(f"Critical Failures Detected: {len(failed_tasks)}")
        for fail in failed_tasks:
            logger.warning(f"  - {fail['name']}")
            # Extract last few lines of stderr/stdout for brief failure context
            context = (fail['stderr'] or fail['stdout']).strip().split("\n")[-10:]
            for line in context:
                logger.info(f"    | {line}")
        sys.exit(1)
    else:
        logger.info("ASI_ACCEL: Codebase Manifestation Validated. Integrity Level 1.")
        sys.exit(0)

if __name__ == "__main__":
    main()
