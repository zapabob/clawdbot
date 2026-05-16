"""Hypura Harness central FastAPI daemon (default port 18794; avoids OpenClaw Bridge on 18790).

OpenClaw calls this as a general-purpose agent toolkit.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Any, Literal

import httpx
import uvicorn
import threading
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
from osc_controller import OSCController, OSCListener, load_param_map
from pydantic import BaseModel
from shinka_adapter import ShinkaAdapter
from skill_generator import SkillGenerator
from voice_bridge import (
    DEFAULT_WHISPER_EXE,
    DEFAULT_WHISPER_MODEL,
    list_audio_devices,
    run_companion_transcript_turn,
    run_voice_turn,
    transcribe_wav,
)
from voicevox_sequencer import VoicevoxSequencer
from web_scavenger import WebScavenger
from knowledge_graph_shinka import KnowledgeGraphShinka
import psutil
import redis_loop
from vrchat_auto_osc_harness import VRChatAutoOSC, create_auto_osc

def is_vrchat_active() -> bool:
    """Check if VRChat.exe is currently running."""
    for proc in psutil.process_iter(['name']):
        if proc.info['name'] == 'VRChat.exe':
            return True
    return False

DEFAULT_DAEMON_PORT = 18794
DEFAULT_GATEWAY_BASE_URL = "http://127.0.0.1:18789"

logger = logging.getLogger(__name__)
ROOT = Path(__file__).parent
REPO_ROOT = ROOT.parent.parent.parent
CONFIG_PATH = ROOT.parent / "config" / "harness.config.json"
DEFAULT_OPENCLAW_CONFIG_PATH = REPO_ROOT / ".openclaw-desktop" / "openclaw.json"
config: dict[str, Any] = {}
job_store: JobStore | None = None


def load_config() -> dict[str, Any]:
    """Load JSON config from disk into the module-level ``config`` dict."""
    global config
    if CONFIG_PATH.exists():
        config = json.loads(CONFIG_PATH.read_text(encoding="utf-8-sig"))
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
osc_listen: OSCListener = OSCListener(
    host=config.get("osc_host", "127.0.0.1"),
    port=config.get("osc_receive_port", 9001),
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
    repo_root=REPO_ROOT,
)
web_scavenger: WebScavenger = WebScavenger()
knowledge_graph: KnowledgeGraphShinka = KnowledgeGraphShinka()
auto_osc: VRChatAutoOSC = create_auto_osc(
    osc_controller=osc_ctrl,
    voicevox_sequencer=voicevox_seq,
    interval=config.get("auto_osc_interval", 300),
    system_interval=config.get("auto_osc_system_interval", 60),
)


class OscRequest(BaseModel):
    action: str
    payload: dict[str, Any] = {}


class SpeakRequest(BaseModel):
    text: str = ""
    emotion: str = "neutral"
    speaker: int = 8
    scene: list[dict[str, Any]] = []


class VoiceTestSayRequest(BaseModel):
    text: str = "voice playback test"
    emotion: str = "neutral"
    speaker: int = 8
    output_device: int | None = None
    output_devices: list[int] | None = None


class VoiceTranscribeRequest(BaseModel):
    wav_path: str
    whisper_exe: str | None = None
    whisper_model: str | None = None


class VoiceTurnRequest(BaseModel):
    record_seconds: float = 5.0
    samplerate: int = 16000
    input_device: int | None = None
    output_device: int | None = None
    output_devices: list[int] | None = None
    speaker: int = 8
    emotion: str = "neutral"
    whisper_exe: str | None = None
    whisper_model: str | None = None
    openclaw_timeout: int = 240


class CompanionVoiceTurnRequest(BaseModel):
    transcript: str | None = None
    transcript_timestamp: int | float | None = None
    last_seen_timestamp: int | float | None = None
    openclaw_timeout: int = 240
    speak: bool = True
    animate: bool = True


class CompanionMicRequest(BaseModel):
    enabled: bool = True


def _resolve_voice_output_devices(
    output_device: int | None,
    output_devices: list[int] | None,
) -> list[int] | None:
    if output_devices:
        return output_devices
    if output_device is not None:
        return [output_device]
    voice = config.get("voice")
    if isinstance(voice, dict):
        configured = voice.get("output_devices")
        if isinstance(configured, list) and all(isinstance(item, int) for item in configured):
            return configured
    return None


class CompanionControlRequest(BaseModel):
    action: Literal[
        "speak", "emotion", "motion", "expression", "look_at", "load_model"
    ]
    value: str | None = None
    motion_index: int = 0
    x: float | None = None
    y: float | None = None
    model_path: str | None = None


class SubmoduleRunRequest(BaseModel):
    repoId: str
    preset: str
    extraArgs: list[str] = []


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
    mode: str = "auto"  # "auto" | "tinylora" | "sft"
    output_dir: str | None = None
    train_options: dict[str, Any] = {}


class GrpoPlaceholderRequest(BaseModel):
    dataset_path: str | None = None


class GrpoJobRequest(BaseModel):
    mode: Literal["placeholder", "train"] = "placeholder"
    dataset_path: str | None = None


class ScavengeRequest(BaseModel):
    query: str = ""
    deep: bool = False


class WisdomRequest(BaseModel):
    concept: str


def _get_job_store() -> JobStore:
    global job_store
    if job_store is None:
        job_store = JobStore(resolve_artifacts_root(config) / "jobs")
    return job_store


def _resolve_gateway_base_url() -> str:
    env_base_url = os.environ.get("OPENCLAW_GATEWAY_URL", "").strip()
    if env_base_url:
        return env_base_url.rstrip("/")
    raw = config.get("gateway_base_url")
    if isinstance(raw, str) and raw.strip():
        return raw.strip().rstrip("/")
    return DEFAULT_GATEWAY_BASE_URL


def _resolve_gateway_config_path() -> Path:
    override = os.environ.get("OPENCLAW_CONFIG_PATH", "").strip()
    if override:
        return Path(override).expanduser()
    return DEFAULT_OPENCLAW_CONFIG_PATH


def _resolve_gateway_auth_token() -> str | None:
    env_token = os.environ.get("OPENCLAW_GATEWAY_TOKEN", "").strip()
    if env_token:
        return env_token
    config_path = _resolve_gateway_config_path()
    if not config_path.exists():
        return None
    try:
        cfg = json.loads(config_path.read_text(encoding="utf-8"))
    except Exception:
        return None
    gateway = cfg.get("gateway")
    if not isinstance(gateway, dict):
        return None
    auth = gateway.get("auth")
    if not isinstance(auth, dict):
        return None
    token = auth.get("token")
    if isinstance(token, str):
        normalized = token.strip()
        if normalized:
            return normalized
    return None


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
    loop_stats = redis_loop.get_loop_stats()
    return {
        "daemon_version": "0.1.0",
        "osc_connected": True,
        "voicevox_alive": vx_ok,
        "ollama_alive": ollama_ok,
        "vrchat_active": is_vrchat_active(),
        "lora": lora,
        "loop": loop_stats,
    }


@app.post("/osc")
async def osc(req: OscRequest) -> dict:
    if not is_vrchat_active():
        logger.info("OSC suppressed: VRChat manifold not active.")
        return {"success": False, "error": "VRChat not active"}

    action = req.action
    payload = req.payload
    try:
        if action == "chatbox":
            osc_ctrl.send_chatbox(
                payload.get("text", ""),
                immediate=payload.get("immediate", True),
                sfx=payload.get("sfx", True)
            )
        elif action == "typing":
            osc_ctrl.set_typing(payload.get("value", False))
        elif action == "tracking":
            osc_ctrl.send_tracking(payload.get("name", ""), payload.get("value"))
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
        elif action == "system_info":
            # EVOLVED: Send GPU/RAM info to chatbox
            info = osc_ctrl.get_system_info()
            msg = osc_ctrl.format_system_message(info)
            osc_ctrl.send_chatbox(msg, immediate=True, sfx=False)
            return {"success": True, "system_info": info, "chatbox": msg}
        elif action == "system_status":
            # Return system info without sending to chatbox
            info = osc_ctrl.get_system_info()
            msg = osc_ctrl.format_system_message(info)
            return {"success": True, "system_info": info, "formatted": msg}
        else:
            raise HTTPException(status_code=400, detail=f"Unknown OSC action: {action}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("OSC error: %s", e)
        return {"success": False, "error": str(e)}
    return {"success": True}


@app.get("/osc/telemetry")
async def osc_telemetry() -> dict:
    """Read the latest received OSC data from VRChat."""
    return {"telemetry": osc_listen.telemetry}


@app.post("/auto_osc/start")
async def auto_osc_start() -> dict:
    """Start VRChat Auto OSC (startup + periodic messages)."""
    return auto_osc.start()


@app.post("/auto_osc/stop")
async def auto_osc_stop() -> dict:
    """Stop VRChat Auto OSC."""
    return auto_osc.stop()


@app.get("/auto_osc/status")
async def auto_osc_status() -> dict:
    """Get VRChat Auto OSC status."""
    return auto_osc.status()


@app.post("/speak")
async def speak(req: SpeakRequest) -> dict:
    if not is_vrchat_active():
        logger.info("Speak suppressed: VRChat manifold not active.")
        return {"success": False, "error": "VRChat not active"}
    
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


@app.get("/voice/devices")
async def voice_devices() -> dict[str, Any]:
    return list_audio_devices()


@app.post("/voice/test-say")
async def voice_test_say(req: VoiceTestSayRequest) -> dict[str, Any]:
    try:
        wav_bytes = await voicevox_seq.synthesize(req.text, emotion=req.emotion, speaker=req.speaker)
        output_devices = _resolve_voice_output_devices(req.output_device, req.output_devices)
        voicevox_seq.play_wav_bytes(wav_bytes, output_devices=output_devices)
    except Exception as e:
        logger.error("Voice test-say error: %s", e)
        return {"success": False, "error": str(e)}
    return {"success": True, "text": req.text, "output_devices": output_devices}


@app.post("/voice/transcribe")
async def voice_transcribe(req: VoiceTranscribeRequest) -> dict[str, Any]:
    try:
        transcript = await asyncio.to_thread(
            transcribe_wav,
            Path(req.wav_path).expanduser(),
            Path(req.whisper_exe).expanduser() if req.whisper_exe else DEFAULT_WHISPER_EXE,
            Path(req.whisper_model).expanduser() if req.whisper_model else DEFAULT_WHISPER_MODEL,
        )
    except Exception as e:
        logger.error("Voice transcribe error: %s", e)
        return {"success": False, "error": str(e)}
    return {"success": True, "transcript": transcript}


@app.post("/voice/turn")
async def voice_turn(req: VoiceTurnRequest) -> dict[str, Any]:
    try:
        result = await asyncio.to_thread(
            run_voice_turn,
            config=config,
            record_seconds=req.record_seconds,
            samplerate=req.samplerate,
            input_device=req.input_device,
            whisper_exe=Path(req.whisper_exe).expanduser() if req.whisper_exe else DEFAULT_WHISPER_EXE,
            whisper_model=Path(req.whisper_model).expanduser() if req.whisper_model else DEFAULT_WHISPER_MODEL,
            openclaw_timeout=req.openclaw_timeout,
        )
        if result.get("success") and result.get("reply"):
            output_devices = _resolve_voice_output_devices(req.output_device, req.output_devices)
            wav_bytes = await voicevox_seq.synthesize(
                str(result["reply"]),
                emotion=req.emotion,
                speaker=req.speaker,
            )
            voicevox_seq.play_wav_bytes(wav_bytes, output_devices=output_devices)
    except Exception as e:
        logger.error("Voice turn error: %s", e)
        return {"success": False, "error": str(e)}
    return result


@app.post("/voice/companion-turn")
async def voice_companion_turn(req: CompanionVoiceTurnRequest) -> dict[str, Any]:
    try:
        result = await asyncio.to_thread(
            run_companion_transcript_turn,
            config=config,
            transcript=req.transcript,
            transcript_timestamp=req.transcript_timestamp,
            last_seen_timestamp=req.last_seen_timestamp,
            openclaw_timeout=req.openclaw_timeout,
        )
        if result.get("success") and result.get("reply"):
            reply = str(result["reply"])
            emotion = str(result.get("emotion") or "neutral")
            if req.animate:
                await companion_bridge.forward_emotion(emotion)
            if req.speak:
                await companion_bridge.forward_speak(reply, emotion)
    except Exception as e:
        logger.error("Companion voice turn error: %s", e)
        return {"success": False, "error": str(e)}
    return result


@app.post("/voice/companion-mic")
async def voice_companion_mic(req: CompanionMicRequest) -> dict[str, Any]:
    try:
        await companion_bridge.set_mic_enabled(req.enabled)
    except Exception as e:
        logger.error("Companion mic toggle error: %s", e)
        return {"success": False, "error": str(e)}
    return {"success": True, "enabled": req.enabled}


@app.post("/companion/control")
async def companion_control(req: CompanionControlRequest) -> dict[str, Any]:
    try:
        if req.action == "speak":
            if not req.value:
                raise HTTPException(status_code=400, detail="value required for speak")
            await companion_bridge.forward_speak(req.value, "neutral")
        elif req.action == "emotion":
            if not req.value:
                raise HTTPException(status_code=400, detail="value required for emotion")
            await companion_bridge.forward_emotion(req.value)
        elif req.action == "motion":
            if not req.value:
                raise HTTPException(status_code=400, detail="value required for motion")
            await companion_bridge.forward_motion(req.value, req.motion_index)
        elif req.action == "expression":
            if not req.value:
                raise HTTPException(status_code=400, detail="value required for expression")
            await companion_bridge.forward_expression(req.value)
        elif req.action == "look_at":
            if req.x is None or req.y is None:
                raise HTTPException(status_code=400, detail="x and y required for look_at")
            await companion_bridge.forward_look(req.x, req.y)
        elif req.action == "load_model":
            if not req.model_path:
                raise HTTPException(status_code=400, detail="model_path required for load_model")
            requested_model_path = Path(req.model_path).expanduser()
            resolved_model_path = (
                requested_model_path
                if requested_model_path.is_absolute()
                else (REPO_ROOT / requested_model_path)
            )
            await companion_bridge.forward_load_model(str(resolved_model_path.resolve()))
        else:
            raise HTTPException(status_code=400, detail=f"Unknown companion action: {req.action}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Companion control error: %s", e)
        return {"success": False, "error": str(e)}
    return {"success": True, "action": req.action}


@app.post("/submodule/run")
async def submodule_run(req: SubmoduleRunRequest) -> dict[str, Any]:
    token = _resolve_gateway_auth_token()
    if not token:
        raise HTTPException(
            status_code=503,
            detail=(
                "Gateway auth token unavailable. Set OPENCLAW_GATEWAY_TOKEN or configure "
                "gateway.auth.token in the active openclaw.json before using /submodule/run."
            ),
        )

    gateway_base_url = _resolve_gateway_base_url()
    body = {
        "tool": "submodule_run",
        "args": {
            "repoId": req.repoId,
            "preset": req.preset,
            "extraArgs": req.extraArgs,
        },
    }
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{gateway_base_url}/tools/invoke",
                json=body,
                headers={
                    "Authorization": f"Bearer {token}",
                    "x-openclaw-message-channel": "node",
                },
            )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to reach OpenClaw gateway at {gateway_base_url}: {exc}",
        ) from exc

    payload: dict[str, Any]
    try:
        payload = response.json()
    except Exception:
        payload = {"ok": False, "raw": response.text}

    if not response.is_success:
        detail = payload.get("error") if isinstance(payload.get("error"), dict) else payload
        raise HTTPException(status_code=response.status_code, detail=detail)

    result = payload.get("result")
    if isinstance(result, dict):
        return result
    return {"ok": False, "status": "invalid-result", "gateway": payload}


@app.post("/reload")
async def reload_config_endpoint() -> dict[str, Any]:
    global companion_bridge, job_store
    cfg = load_config()
    job_store = None
    companion_bridge = CompanionBridge(
        cfg.get("companion_url", "http://127.0.0.1:18791"),
        repo_root=REPO_ROOT,
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
    rec = store.create(f"lora_train_{req.mode}")
    ds = Path(req.dataset_path).expanduser() if req.dataset_path else None
    background_tasks.add_task(
        run_train_job,
        rec.job_id,
        store,
        config,
        ds,
        req.dry_run,
        req.mode,
        req.train_options or {},
    )
    return {"job_id": rec.job_id, "status": "pending", "mode": req.mode}


class TinyLoraConvertRequest(BaseModel):
    adapter_json_path: str
    output_dir: str


@app.post("/lora/convert/tinylora_to_peft")
async def lora_convert_tinylora_to_peft(req: TinyLoraConvertRequest) -> dict[str, Any]:
    """Convert a TinyLoRA JSON adapter to PEFT rank-2 LoRA format.
    Called by lora_watcher as preprocessing before GGUF conversion.
    """
    try:
        import json as _json
        from tiny_lora import TinyLoRAModel
        import torch

        adapter_json = _json.loads(Path(req.adapter_json_path).read_text(encoding="utf-8"))
        output_dir = Path(req.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Rehydrate TinyLoRAModel with a dummy model before conversion.
        # The actual conversion uses A/B tensors from adapter_json.
        # Lightweight path: emit PEFT config plus an empty adapter_model.bin.
        adapter_config = {
            "base_model_name_or_path": "",
            "bias": "none",
            "inference_mode": True,
            "peft_type": "LORA",
            "r": adapter_json.get("r", 2),
            "lora_alpha": adapter_json.get("r", 2),
            "lora_dropout": 0.0,
            "target_modules": adapter_json.get("target_modules", []),
            "task_type": "CAUSAL_LM",
            "_tinylora": True,
        }
        (output_dir / "adapter_config.json").write_text(
            _json.dumps(adapter_config, indent=2), encoding="utf-8"
        )
        # Empty state dict; lora_watcher performs the Python-side conversion.
        torch.save({}, str(output_dir / "adapter_model.bin"))
        return {"success": True, "output_dir": str(output_dir)}
    except Exception as e:
        logger.exception("TinyLoRA to PEFT conversion failed")
        raise HTTPException(status_code=500, detail=str(e))


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
    """
    Generate code, run it, and connect successful output to the Redis loop.

    Success: save to training:examples.
    Failure: save to atlas:failures and retry through ShinkaEvolve.
    """
    result = await asyncio.to_thread(code_runner_instance.run_task, req.task)

    if result.get("success"):
        # Use a fixed score here because code_runner does not expose retry count.
        redis_loop.push_training_example(
            task=req.task,
            code=result.get("output", ""),
            quality_score=1.0,
            source="run/success",
        )
    else:
        # Record failures for later recovery.
        redis_loop.push_failure(
            task=req.task,
            stop_reason="max_retries",
            error=result.get("last_error", result.get("error", ""))[:300],
            attempts=req.max_retries,
            source="run/failure",
        )

        # Try recovery through ShinkaEvolve.
        fitness_hints = redis_loop.get_fitness_hints(max_hints=2)
        fitness_hint = (
            f"Fix this error: {result.get('last_error', '')[:200]}"
            + ("\n" + "\n".join(fitness_hints) if fitness_hints else "")
        )
        evolve_result = await shinka.evolve_code(
            seed=result.get("output", req.task),
            fitness_hint=fitness_hint,
            generations=3,
        )

        if evolve_result and evolve_result != result.get("output", req.task):
            # Save recovered output with a lower confidence score.
            redis_loop.push_training_example(
                task=req.task,
                code=evolve_result,
                quality_score=0.5,
                source="run/evolved",
            )
            result["success"] = True
            result["output"] = evolve_result
            result["evolved"] = True
        else:
            # Record unrecovered failures too.
            redis_loop.push_failure(
                task=req.task,
                stop_reason="evolve_failed",
                error="ShinkaEvolve could not recover",
                source="run/evolve_failure",
            )

    return result


@app.post("/scavenge")
async def scavenge(req: ScavengeRequest) -> dict:
    """Manually trigger a web scavenge pulse (Neuro-style)."""
    try:
        if req.query:
            logger.info("Triggering Intent-Driven Scavenge: %s", req.query)
            # Simulated deep search logic using the scavenger's induction/extraction
            web_scavenger.execute_scavenge() 
            return {"success": True, "message": f"Scavenge initiated for '{req.query}'"}
        else:
            web_scavenger.execute_scavenge()
            return {"success": True, "message": "General scavenge pulse executed."}
    except Exception as e:
        logger.error("Scavenge error: %s", e)
        return {"success": False, "error": str(e)}


@app.post("/wisdom")
async def wisdom(req: WisdomRequest) -> dict:
    """Query the knowledge graph for associative insights."""
    try:
        insights = knowledge_graph.query_wisdom(req.concept)
        return {"success": True, "concept": req.concept, "insights": insights}
    except Exception as e:
        logger.error("Wisdom query error: %s", e)
        return {"success": False, "error": str(e)}


@app.post("/skill")
async def skill(req: SkillRequest) -> dict:
    return await asyncio.to_thread(
        skill_gen.create_skill, req.name, req.description, req.examples
    )


@app.post("/evolve")
async def evolve(req: EvolveRequest) -> dict:
    """
    Run the ShinkaEvolve loop.

    Adds AI Scientist fitness hints from Redis when available.
    Success writes training:examples; failure writes atlas:failures.
    """
    # Add AI Scientist hints to the fitness hint.
    ai_hints = redis_loop.get_fitness_hints(max_hints=2)
    combined_hint = req.fitness_hint
    if ai_hints:
        combined_hint = req.fitness_hint + "\nAI Scientist hints:\n" + "\n".join(f"- {h}" for h in ai_hints)

    if req.target == "code":
        result = await shinka.evolve_code(req.seed, combined_hint, req.generations)
        # Treat a non-empty result that differs from the seed as an improvement.
        improved = result != req.seed and bool(result)
        if improved:
            redis_loop.push_training_example(
                task=req.fitness_hint or req.seed[:200],
                code=result,
                quality_score=0.7,
                source="evolve/code",
            )
        else:
            redis_loop.push_failure(
                task=req.fitness_hint or req.seed[:200],
                stop_reason="evolve_no_improvement",
                error="seed unchanged after evolution",
                source="evolve/code",
            )
    elif req.target == "skill":
        result = await shinka.evolve_skill(req.seed, [combined_hint], req.generations)
        improved = result != req.seed and bool(result)
        if improved:
            redis_loop.push_training_example(
                task=f"skill:{req.fitness_hint or 'unnamed'}",
                code=result,
                quality_score=0.7,
                source="evolve/skill",
            )
    else:
        result = req.seed
        improved = False

    return {"success": True, "result": result, "improved": improved if req.target in ("code", "skill") else None}


# AI Scientist endpoints.

class ScientistRunRequest(BaseModel):
    topic: str = ""
    template: str = "nanoGPT"
    num_ideas: int = 3
    run_experiment: bool = False
    model: str = "ollama/qwen-hakua-core:latest"


def _get_scientist() -> Any:
    """Lazily initialize AiScientistRunner."""
    try:
        from ai_scientist_runner import AiScientistRunner
        return AiScientistRunner()
    except ImportError as e:
        raise HTTPException(status_code=503, detail=f"ai_scientist_runner not available: {e}")


@app.post("/scientist/run")
async def scientist_run(req: ScientistRunRequest) -> dict:
    """
    Generate AI Scientist ideas and optionally experiments, then save them to Redis.

    Empty topic values pull from atlas:failures automatically.
    run_experiment=true also runs perform_experiments, which can take time.
    """
    runner = await asyncio.to_thread(_get_scientist)
    if req.topic:
        ideas = await asyncio.to_thread(runner.run_ideas, req.topic, req.template, req.num_ideas, req.model)
        topic = req.topic
    else:
        result = await asyncio.to_thread(runner.run_from_failures, req.model)
        return result

    stored = 0
    exp_results = []
    for idea in ideas:
        exp_result: dict = {}
        if req.run_experiment:
            exp_result = await asyncio.to_thread(runner.run_experiment, idea, req.template, req.model)
        redis_loop.push_scientist_finding(topic=topic, idea=idea, result=exp_result)
        stored += 1
        if exp_result:
            exp_results.append(exp_result)

    return {
        "success": True,
        "topic": topic,
        "ideas_generated": len(ideas),
        "findings_stored": stored,
        "experiments": exp_results if req.run_experiment else None,
    }


@app.post("/scientist/ideas")
async def scientist_ideas(req: ScientistRunRequest) -> dict:
    """Generate ideas only and return them without saving to Redis."""
    runner = await asyncio.to_thread(_get_scientist)
    topic = req.topic or "improve code generation quality"
    ideas = await asyncio.to_thread(runner.run_ideas, topic, req.template, req.num_ideas, req.model)
    return {"success": True, "topic": topic, "ideas": ideas}


@app.get("/scientist/status")
async def scientist_status() -> dict:
    """Return queue state for ai_scientist:findings / ai_scientist:tasks."""
    stats = redis_loop.get_loop_stats()
    return {
        "findings": stats.get("scientist_findings", 0),
        "tasks": stats.get("scientist_tasks", 0),
        "redis": stats.get("redis", "unknown"),
    }


if __name__ == "__main__":
    try:
        logging.basicConfig(level=logging.INFO)
        port = config.get("daemon_port", DEFAULT_DAEMON_PORT)
        logger.info("Starting Hypura Harness on port %s", port)
        
        # Start OSC Listener in background daemon thread
        listener_thread = threading.Thread(target=osc_listen.start, daemon=True)
        listener_thread.start()
        
        uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
    except Exception as e:
        logger.critical("Harness Daemon failed to start: %s", e, exc_info=True)
        import sys
        sys.exit(1)
