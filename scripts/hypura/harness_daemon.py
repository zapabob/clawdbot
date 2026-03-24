"""Hypura Harness — central FastAPI daemon (port 18790)."""
from __future__ import annotations

import json
from pathlib import Path

import httpx
import uvicorn
from fastapi import FastAPI

ROOT = Path(__file__).parent
CONFIG_PATH = ROOT / "harness.config.json"
config: dict = (
    json.loads(CONFIG_PATH.read_text(encoding="utf-8")) if CONFIG_PATH.exists() else {}
)

app = FastAPI(title="Hypura Harness", version="0.1.0")


@app.get("/status")
async def status() -> dict:
    """Return liveness of each subsystem."""
    osc_ok = False
    vx_ok = False
    ollama_ok = False

    # VOICEVOX probe
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(
                config.get("voicevox_url", "http://127.0.0.1:50021") + "/version"
            )
            vx_ok = r.status_code == 200
    except Exception:
        pass

    # Ollama probe
    try:
        ollama_url = config.get("models", {}).get(
            "ollama_base_url", "http://127.0.0.1:11434"
        )
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(ollama_url + "/api/tags")
            ollama_ok = r.status_code == 200
    except Exception:
        pass

    return {
        "daemon_version": "0.1.0",
        "osc_connected": osc_ok,
        "voicevox_alive": vx_ok,
        "ollama_alive": ollama_ok,
    }


if __name__ == "__main__":
    port = config.get("daemon_port", 18790)
    uvicorn.run("harness_daemon:app", host="127.0.0.1", port=port, reload=False)
