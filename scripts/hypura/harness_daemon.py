"""Hypura Harness — central FastAPI daemon (default port 18794; avoids OpenClaw Bridge on 18790).

OpenClaw calls this as a general-purpose agent toolkit.
"""
from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Literal

import httpx
import uvicorn
from code_runner import CodeRunner
from companion_bridge import CompanionBridge
from fastapi import BackgroundTasks, FastAPI, HTTPException
from lora_jobs import JobStore
from lora_paths import resolve_artifacts_root
from lora_paths import status_summary as lora_status_summary
from lora_service import (
    run_build_curriculum,
    run_grpo_job_async,
    run_train_job,
)
from osc_controller import OSCController, load_param_map
from pydantic import BaseModel
from shinka_adapter import ShinkaAdapter
from skill_generator import SkillGenerator
from voicevox_sequencer import VoicevoxSequencer

DEFAULT_DAEMON_PORT = 18794

logger = logging.getLogger(__name__)
ROOT = Path(__file__).parent
REPO_ROOT = ROOT.parent.parent
CONFIG_PATH = ROOT / "harness.config.json"
config: dict[str, Any] = {}
job_store: JobStore | None = None


def load_config() -> dict[str, Any]:
    """Load JSON config from disk into the module-level ``config`` dict."""
    global config
    if CONFIG_PATH.exists():
        config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    else:
        config = {}
    return config


load_config()

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
companion_bridge: CompanionBridge = CompanionBridge(
    config.get("companion_url", "http://127.0.0.1:18791"),
)


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


class CurriculumBuildRequest(BaseModel):
    arxiv_ids: list[str] = []
    include_soul: bool = True
    extra_jsonl: list[str] = []


class LoraTrainRequest(BaseModel):
    dry_run: bool = True
    dataset_path: str | None = None


class GrpoPlaceholderRequest(BaseModel):
    dataset_path: str | None = None


class GrpoJobRequest(BaseModel):
    mode: Literal["placeholder", "train"] = "placeholder"
    dataset_path: str | None = None


def _get_job_store() -> JobStore:
    global job_store
    if job_store is None:
        job_store = JobStore(resolve_artifacts_root(config) / "jobs")
    return job_store


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
    lora = lora_status_summary(config, REPO_ROOT)
    return {
        "daemon_version": "0.1.0",
        "osc_connected": True,
        "voicevox_alive": vx_ok,
        "ollama_alive": ollama_ok,
        "lora": lora,
    }


@app.post("/osc")
async def osc(req: OscRequest) -> dict:
    action = req.action
    payload = req.payload
    try:
        if action == "chatbox":
            osc_ctrl.send_chatbox(payload.get("text", ""))
        elif action == "emotion":
            emotion = payload.get("emotion", "neutral")
            osc_ctrl.apply_emotion(emotion)
            await companion_bridge.forward_emotion(emotion)
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
    await companion_bridge.forward_speak(req.text or "", req.emotion)
    return {"success": True}


@app.post("/reload")
async def reload_config_endpoint() -> dict[str, Any]:
    global companion_bridge, job_store
    cfg = load_config()
    job_store = None
    companion_bridge = CompanionBridge(
        cfg.get("companion_url", "http://127.0.0.1:18791"),
    )
    return {"reloaded": True, "config": cfg}


@app.get("/lora/status")
async def lora_status() -> dict[str, Any]:
    return {"lora": lora_status_summary(config, REPO_ROOT)}


@app.post("/lora/curriculum/build")
async def lora_curriculum_build(
    req: CurriculumBuildRequest, background_tasks: BackgroundTasks
) -> dict[str, Any]:
    store = _get_job_store()
    rec = store.create("curriculum_build")
    background_tasks.add_task(
        run_build_curriculum,
        rec.job_id,
        store,
        config,
        REPO_ROOT,
        req.arxiv_ids,
        req.include_soul,
        req.extra_jsonl,
    )
    return {"job_id": rec.job_id, "status": "pending"}


@app.post("/lora/train")
async def lora_train(
    req: LoraTrainRequest, background_tasks: BackgroundTasks
) -> dict[str, Any]:
    store = _get_job_store()
    rec = store.create("lora_train")
    ds = Path(req.dataset_path).expanduser() if req.dataset_path else None
    background_tasks.add_task(
        run_train_job,
        rec.job_id,
        store,
        config,
        ds,
        req.dry_run,
    )
    return {"job_id": rec.job_id, "status": "pending"}


@app.post("/lora/grpo")
async def lora_grpo(
    req: GrpoJobRequest, background_tasks: BackgroundTasks
) -> dict[str, Any]:
    store = _get_job_store()
    rec = store.create("grpo")
    ds = Path(req.dataset_path).expanduser() if req.dataset_path else None
    background_tasks.add_task(
        run_grpo_job_async,
        rec.job_id,
        store,
        config,
        ds,
        req.mode,
    )
    return {"job_id": rec.job_id, "status": "pending", "mode": req.mode}


@app.post("/lora/grpo/placeholder")
async def lora_grpo_placeholder(
    req: GrpoPlaceholderRequest, background_tasks: BackgroundTasks
) -> dict[str, Any]:
    store = _get_job_store()
    rec = store.create("grpo_placeholder")
    ds = Path(req.dataset_path).expanduser() if req.dataset_path else None
    background_tasks.add_task(
        run_grpo_job_async,
        rec.job_id,
        store,
        config,
        ds,
        "placeholder",
    )
    return {"job_id": rec.job_id, "status": "pending", "mode": "placeholder"}


@app.get("/lora/jobs/{job_id}")
async def lora_job(job_id: str) -> dict[str, Any]:
    store = _get_job_store()
    rec = store.get(job_id)
    if rec is None:
        raise HTTPException(status_code=404, detail="job not found")
    return {
        "job_id": rec.job_id,
        "kind": rec.kind,
        "status": rec.status,
        "message": rec.message,
        "result": rec.result,
        "error": rec.error,
    }


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
    port = config.get("daemon_port", DEFAULT_DAEMON_PORT)
    uvicorn.run("harness_daemon:app", host="127.0.0.1", port=port, reload=False)
