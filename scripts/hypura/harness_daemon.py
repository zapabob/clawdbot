"""Hypura Harness — central FastAPI daemon (port 18790).

OpenClaw calls this as a general-purpose agent toolkit.
"""
from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Any

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from code_runner import CodeRunner
from osc_controller import OSCController, load_param_map
from shinka_adapter import ShinkaAdapter
from skill_generator import SkillGenerator
from voicevox_sequencer import VoicevoxSequencer

logger = logging.getLogger(__name__)
ROOT = Path(__file__).parent
CONFIG_PATH = ROOT / "harness.config.json"
config: dict = (
    json.loads(CONFIG_PATH.read_text(encoding="utf-8")) if CONFIG_PATH.exists() else {}
)

app = FastAPI(title="Hypura Harness", version="0.1.0")

osc_ctrl: OSCController = OSCController(
    host=config.get("osc_host", "127.0.0.1"),
    port=config.get("osc_port", 9000),
    param_map=load_param_map(),
)
voicevox_seq: VoicevoxSequencer = VoicevoxSequencer(
    voicevox_url=config.get("voicevox_url", "http://127.0.0.1:50021"),
    cable_device_name=config.get("virtual_cable_name", "CABLE Input"),
)
code_runner_instance: CodeRunner = CodeRunner()
skill_gen: SkillGenerator = SkillGenerator()
shinka: ShinkaAdapter = ShinkaAdapter()


class OscRequest(BaseModel):
    action: str
    payload: dict[str, Any] = {}


class SpeakRequest(BaseModel):
    text: str = ""
    emotion: str = "neutral"
    speaker: int = 8
    scene: list[dict[str, Any]] = []


class RunRequest(BaseModel):
    task: str
    model: str = "auto"
    max_retries: int = 3


class SkillRequest(BaseModel):
    name: str
    description: str
    examples: list[str] = []


class EvolveRequest(BaseModel):
    target: str
    seed: str
    fitness_hint: str = ""
    generations: int = 5


@app.get("/status")
async def status() -> dict:
    vx_ok = False
    ollama_ok = False
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(
                config.get("voicevox_url", "http://127.0.0.1:50021") + "/version"
            )
            vx_ok = r.status_code == 200
    except Exception:
        pass
    try:
        ollama_url = config.get("models", {}).get(
            "ollama_base_url", "http://127.0.0.1:11434"
        )
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(ollama_url + "/api/tags")
            ollama_ok = r.status_code == 200
    except Exception:
        pass
    hakua_on = config.get("models", {}).get("hakua_inference_enabled", False)
    return {
        "daemon_version": "0.1.0",
        "osc_connected": True,
        "voicevox_alive": vx_ok,
        "ollama_alive": ollama_ok,
        "hakua_inference_enabled": hakua_on,
    }


@app.post("/osc")
async def osc(req: OscRequest) -> dict:
    action = req.action
    payload = req.payload
    try:
        if action == "chatbox":
            osc_ctrl.send_chatbox(payload.get("text", ""))
        elif action == "emotion":
            osc_ctrl.apply_emotion(payload.get("emotion", "neutral"))
        elif action == "param":
            osc_ctrl.set_param(payload.get("name", ""), payload.get("value", 0))
        elif action in (
            "move",
            "jump",
            "move_forward",
            "move_back",
            "turn_left",
            "turn_right",
        ):
            osc_ctrl.send_action(action, payload.get("value", 1.0))
        else:
            raise HTTPException(status_code=400, detail=f"Unknown OSC action: {action}")
    except Exception as e:
        logger.error("OSC error: %s", e)
        return {"success": False, "error": str(e)}
    return {"success": True}


@app.post("/speak")
async def speak(req: SpeakRequest) -> dict:
    try:
        if req.scene:
            await voicevox_seq.play_scene(req.scene, speaker=req.speaker)
        elif req.text:
            await voicevox_seq.speak(req.text, emotion=req.emotion, speaker=req.speaker)
        else:
            raise HTTPException(status_code=400, detail="text or scene required")
    except Exception as e:
        logger.error("Speak error: %s", e)
        return {"success": False, "error": str(e)}
    return {"success": True}


@app.post("/run")
async def run(req: RunRequest) -> dict:
    return await asyncio.to_thread(code_runner_instance.run_task, req.task)


@app.post("/skill")
async def skill(req: SkillRequest) -> dict:
    return await asyncio.to_thread(
        skill_gen.create_skill, req.name, req.description, req.examples
    )


@app.post("/evolve")
async def evolve(req: EvolveRequest) -> dict:
    if req.target == "code":
        result = await shinka.evolve_code(
            req.seed, req.fitness_hint, req.generations
        )
    elif req.target == "skill":
        result = await shinka.evolve_skill(
            req.seed, [req.fitness_hint], req.generations
        )
    else:
        result = req.seed
    return {"success": True, "result": result}


if __name__ == "__main__":
    port = config.get("daemon_port", 18790)
    uvicorn.run("harness_daemon:app", host="127.0.0.1", port=port, reload=False)
