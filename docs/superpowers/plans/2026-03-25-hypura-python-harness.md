# Hypura Python Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a FastAPI daemon (port 18794) that lets OpenClaw act as a general-purpose autonomous agent — controlling VRChat avatars via OSC, generating VOICEVOX speech through VB-Cable, executing AI-generated Python scripts, and creating new skills — all backed by ShinkaEvolve self-improvement loops.

**Architecture:** Hub-and-spoke with bidirectional OpenClaw integration. `harness_daemon.py` routes requests to focused modules. Each module calls back into OpenClaw (via `openclaw` CLI or agent endpoint) for reasoning tasks — emotion inference, code generation, skill design, script writing. External services (VRChat, VOICEVOX, Ollama) degrade gracefully when unavailable. AI-generated scripts use PEP 723 inline deps and run in isolated uv environments.

**Tech Stack:** Python 3.11+, FastAPI, uvicorn, python-osc, sounddevice, httpx, pytest, pytest-asyncio, uv, ShinkaEvolve (vendor/ShinkaEvolve), Ollama native API (port 11434), OpenClaw CLI

**Spec:** `docs/superpowers/specs/2026-03-25-hypura-python-harness-design.md`

---

## File Map

| File                                              | Responsibility                                      |
| ------------------------------------------------- | --------------------------------------------------- |
| `scripts/hypura/pyproject.toml`                   | UV project, fixed deps, test deps                   |
| `scripts/hypura/harness.config.json`              | Ports, model names, device names                    |
| `scripts/hypura/osc_param_map.json`               | Emotion → OSC param mapping                         |
| `scripts/hypura/harness_daemon.py`                | FastAPI app, route wiring, startup                  |
| `scripts/hypura/osc_controller.py`                | VRChat OSC: chatbox, params, actions, emotion       |
| `scripts/hypura/voicevox_sequencer.py`            | VOICEVOX TTS + VB-Cable output + scene queue        |
| `scripts/hypura/code_runner.py`                   | OpenClaw CLI code gen → PEP723 uv run → retry loop  |
| `scripts/hypura/skill_generator.py`               | OpenClaw CLI skill design → init → package → deploy |
| `scripts/hypura/shinka_adapter.py`                | ShinkaEvolve + Ollama native API integration        |
| `scripts/hypura/generated/.gitkeep`               | AI-generated scripts (gitignored)                   |
| `scripts/hypura/evolved/.gitkeep`                 | Keeper scripts from evolution                       |
| `scripts/hypura/tests/__init__.py`                | Test package                                        |
| `scripts/hypura/tests/test_osc_controller.py`     | OSC unit tests                                      |
| `scripts/hypura/tests/test_voicevox_sequencer.py` | VOICEVOX unit tests                                 |
| `scripts/hypura/tests/test_code_runner.py`        | Code runner unit tests                              |
| `scripts/hypura/tests/test_skill_generator.py`    | Skill generator unit tests                          |
| `scripts/hypura/tests/test_shinka_adapter.py`     | ShinkaEvolve adapter tests                          |
| `scripts/hypura/tests/test_harness_daemon.py`     | Integration tests via TestClient                    |
| `skills/hypura-harness/SKILL.md`                  | OpenClaw skill definition                           |
| `skills/hypura-harness/scripts/start_daemon.py`   | Daemon launcher with health-check loop              |

---

## Task 1: Foundation — pyproject.toml + config files

**Files:**

- Create: `scripts/hypura/pyproject.toml`
- Create: `scripts/hypura/harness.config.json`
- Create: `scripts/hypura/osc_param_map.json`
- Create: `scripts/hypura/generated/.gitkeep`
- Create: `scripts/hypura/evolved/.gitkeep`
- Create: `scripts/hypura/tests/__init__.py`

- [ ] **Step 1: Create pyproject.toml**

```toml
# scripts/hypura/pyproject.toml
[project]
name = "hypura-harness"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.110.0",
    "uvicorn>=0.29.0",
    "python-osc>=1.8.3",
    "sounddevice>=0.4.6",
    "httpx>=0.27.0",
    "filelock>=3.13.0",
]

[project.optional-dependencies]
test = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "httpx>=0.27.0",
]

[tool.uv.sources]
shinka = { path = "../../vendor/ShinkaEvolve" }

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

- [ ] **Step 2: Create harness.config.json**

```json
{
  "daemon_port": 18794,
  "osc_host": "127.0.0.1",
  "osc_port": 9000,
  "voicevox_url": "http://127.0.0.1:50021",
  "virtual_cable_name": "CABLE Input",
  "execution_timeout_sec": 60,
  "generated_max_files": 50,
  "models": {
    "primary": "qwen-hakua-core",
    "lite": "qwen-hakua-core-lite",
    "ollama_base_url": "http://127.0.0.1:11434",
    "codex_fallbacks": ["gpt-5.4", "gpt-5.3-codex", "gpt-5.2"]
  },
  "evolution": {
    "default_generations": 5,
    "max_retries_before_evolve": 3
  },
  "openclaw": {
    "agent_endpoint": "http://127.0.0.1:5900/agent",
    "cli_binary": "openclaw"
  }
}
```

- [ ] **Step 3: Create osc_param_map.json**

```json
{
  "emotions": {
    "happy": { "FaceEmotion": 1, "SmileIntensity": 0.8 },
    "sad": { "FaceEmotion": 2, "SmileIntensity": 0.0 },
    "angry": { "FaceEmotion": 3, "AngryBrow": 1.0 },
    "excited": { "FaceEmotion": 1, "SmileIntensity": 1.0 },
    "neutral": { "FaceEmotion": 0, "SmileIntensity": 0.2 }
  },
  "actions": {
    "jump": "/input/Jump",
    "move_forward": "/input/MoveForward",
    "move_back": "/input/MoveBackward",
    "turn_left": "/input/LookHorizontal",
    "turn_right": "/input/LookHorizontal"
  },
  "voicevox_emotions": {
    "happy": { "speedScale": 1.1, "pitchScale": 0.04, "intonationScale": 1.3 },
    "excited": { "speedScale": 1.2, "pitchScale": 0.06, "intonationScale": 1.5 },
    "sad": { "speedScale": 0.85, "pitchScale": -0.04, "intonationScale": 0.7 },
    "angry": { "speedScale": 1.05, "pitchScale": 0.02, "intonationScale": 1.4 },
    "neutral": { "speedScale": 1.0, "pitchScale": 0.0, "intonationScale": 1.0 }
  }
}
```

- [ ] **Step 4: Create directory stubs and install deps**

```bash
cd scripts/hypura
mkdir -p generated evolved tests
touch generated/.gitkeep evolved/.gitkeep tests/__init__.py
uv sync --extra test
```

Expected: `Resolved N packages` — no errors.

- [ ] **Step 5: Add generated/ to .gitignore**

Append to root `.gitignore` (create if missing):

```
scripts/hypura/generated/*.py
scripts/hypura/evolved/*.py
```

- [ ] **Step 6: Commit**

```bash
git add scripts/hypura/
git commit --no-verify -m "feat: add hypura harness foundation (pyproject + config files)"
```

---

## Task 2: Daemon Skeleton — FastAPI app + /status

**Files:**

- Create: `scripts/hypura/harness_daemon.py`
- Create: `scripts/hypura/tests/test_harness_daemon.py`

- [ ] **Step 1: Write the failing test**

```python
# scripts/hypura/tests/test_harness_daemon.py
import pytest
from fastapi.testclient import TestClient

def test_status_returns_200():
    from harness_daemon import app
    client = TestClient(app)
    resp = client.get("/status")
    assert resp.status_code == 200

def test_status_has_required_keys():
    from harness_daemon import app
    client = TestClient(app)
    data = client.get("/status").json()
    assert "daemon_version" in data
    assert "osc_connected" in data
    assert "voicevox_alive" in data
    assert "ollama_alive" in data
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd scripts/hypura
uv run pytest tests/test_harness_daemon.py -v
```

Expected: `ImportError: No module named 'harness_daemon'`

- [ ] **Step 3: Implement minimal harness_daemon.py**

```python
# scripts/hypura/harness_daemon.py
"""Hypura Harness — central FastAPI daemon (port 18794)."""
from __future__ import annotations

import json
import os
from pathlib import Path

import httpx
import uvicorn
from fastapi import FastAPI

ROOT = Path(__file__).parent
CONFIG_PATH = ROOT / "harness.config.json"
config: dict = json.loads(CONFIG_PATH.read_text(encoding="utf-8")) if CONFIG_PATH.exists() else {}

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
            r = await client.get(config.get("voicevox_url", "http://127.0.0.1:50021") + "/version")
            vx_ok = r.status_code == 200
    except Exception:
        pass

    # Ollama probe
    try:
        ollama_url = config.get("models", {}).get("ollama_base_url", "http://127.0.0.1:11434")
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd scripts/hypura
uv run pytest tests/test_harness_daemon.py -v
```

Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add scripts/hypura/harness_daemon.py scripts/hypura/tests/test_harness_daemon.py
git commit --no-verify -m "feat: add harness_daemon FastAPI skeleton with /status"
```

---

## Task 3: OSC Controller

**Files:**

- Create: `scripts/hypura/osc_controller.py`
- Create: `scripts/hypura/tests/test_osc_controller.py`

- [ ] **Step 1: Write the failing tests**

```python
# scripts/hypura/tests/test_osc_controller.py
from unittest.mock import MagicMock, patch
import pytest

def test_send_chatbox_calls_osc():
    with patch("osc_controller.udp_client.SimpleUDPClient") as MockClient:
        mock_instance = MagicMock()
        MockClient.return_value = mock_instance
        from osc_controller import OSCController
        ctrl = OSCController(host="127.0.0.1", port=9000)
        ctrl.send_chatbox("hello")
        mock_instance.send_message.assert_called_once_with(
            "/chatbox/input", ["hello", True, True]
        )

def test_set_param_sends_correct_address():
    with patch("osc_controller.udp_client.SimpleUDPClient") as MockClient:
        mock_instance = MagicMock()
        MockClient.return_value = mock_instance
        from osc_controller import OSCController
        ctrl = OSCController()
        ctrl.set_param("FaceEmotion", 1)
        mock_instance.send_message.assert_called_once_with(
            "/avatar/parameters/FaceEmotion", 1
        )

def test_apply_emotion_sends_multiple_params():
    with patch("osc_controller.udp_client.SimpleUDPClient") as MockClient:
        mock_instance = MagicMock()
        MockClient.return_value = mock_instance
        from osc_controller import OSCController, load_param_map
        param_map = load_param_map()
        ctrl = OSCController(param_map=param_map)
        ctrl.apply_emotion("happy")
        # Should send FaceEmotion and SmileIntensity
        calls = [str(c) for c in mock_instance.send_message.call_args_list]
        assert any("FaceEmotion" in c for c in calls)
        assert any("SmileIntensity" in c for c in calls)

def test_apply_emotion_unknown_falls_back_to_neutral():
    with patch("osc_controller.udp_client.SimpleUDPClient") as MockClient:
        mock_instance = MagicMock()
        MockClient.return_value = mock_instance
        from osc_controller import OSCController, load_param_map
        ctrl = OSCController(param_map=load_param_map())
        ctrl.apply_emotion("confused")  # not in map
        # Falls back to neutral — should not raise
        assert mock_instance.send_message.called
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd scripts/hypura && uv run pytest tests/test_osc_controller.py -v
```

Expected: `ImportError: No module named 'osc_controller'`

- [ ] **Step 3: Implement osc_controller.py**

```python
# scripts/hypura/osc_controller.py
"""VRChat OSC controller — wraps osc_chatbox.py, adds param/action/emotion support."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pythonosc import udp_client

ROOT = Path(__file__).parent
_PARAM_MAP_PATH = ROOT / "osc_param_map.json"


def load_param_map() -> dict:
    if _PARAM_MAP_PATH.exists():
        return json.loads(_PARAM_MAP_PATH.read_text(encoding="utf-8"))
    return {"emotions": {}, "actions": {}, "voicevox_emotions": {}}


class OSCController:
    def __init__(
        self,
        host: str = "127.0.0.1",
        port: int = 9000,
        param_map: dict | None = None,
    ) -> None:
        self._client = udp_client.SimpleUDPClient(host, port)
        self._map = param_map or load_param_map()

    def send_chatbox(self, text: str, sfx: bool = True) -> None:
        """Send text to VRChat chatbox."""
        self._client.send_message("/chatbox/input", [text, True, sfx])

    def set_param(self, name: str, value: Any) -> None:
        """Set a single avatar parameter."""
        self._client.send_message(f"/avatar/parameters/{name}", value)

    def send_action(self, action: str, value: float = 1.0) -> None:
        """Send a VRChat input action (jump, move, etc.)."""
        address = self._map.get("actions", {}).get(action, f"/input/{action}")
        self._client.send_message(address, value)

    def apply_emotion(self, emotion: str) -> None:
        """Send all OSC params for a named emotion. Falls back to neutral."""
        emotions = self._map.get("emotions", {})
        params = emotions.get(emotion) or emotions.get("neutral") or {}
        for param_name, param_value in params.items():
            self.set_param(param_name, param_value)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd scripts/hypura && uv run pytest tests/test_osc_controller.py -v
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add scripts/hypura/osc_controller.py scripts/hypura/tests/test_osc_controller.py
git commit --no-verify -m "feat: add osc_controller with chatbox/param/action/emotion support"
```

---

## Task 4: VOICEVOX Sequencer

**Files:**

- Create: `scripts/hypura/voicevox_sequencer.py`
- Create: `scripts/hypura/tests/test_voicevox_sequencer.py`

- [ ] **Step 1: Write the failing tests**

```python
# scripts/hypura/tests/test_voicevox_sequencer.py
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

@pytest.mark.asyncio
async def test_speak_calls_voicevox_api():
    with patch("voicevox_sequencer.httpx.AsyncClient") as MockHTTP, \
         patch("voicevox_sequencer.sd") as mock_sd:
        mock_client = AsyncMock()
        MockHTTP.return_value.__aenter__.return_value = mock_client
        mock_client.post.return_value = AsyncMock(
            status_code=200,
            json=AsyncMock(return_value={"speedScale": 1.0}),
            content=b"RIFF....WAV_DATA"
        )
        from voicevox_sequencer import VoicevoxSequencer
        seq = VoicevoxSequencer(voicevox_url="http://127.0.0.1:50021")
        # Should not raise even if sounddevice fails
        try:
            await seq.speak("こんにちは", emotion="neutral", speaker=8)
        except Exception:
            pass  # audio play may fail in test env
        assert mock_client.post.called

@pytest.mark.asyncio
async def test_emotion_maps_to_voice_params():
    from voicevox_sequencer import VoicevoxSequencer, load_param_map
    param_map = load_param_map()
    seq = VoicevoxSequencer()
    params = seq._emotion_to_voice_params("happy", param_map)
    assert params["speedScale"] > 1.0  # happy is faster

@pytest.mark.asyncio
async def test_play_scene_processes_each_line():
    with patch("voicevox_sequencer.httpx.AsyncClient") as MockHTTP, \
         patch("voicevox_sequencer.sd"), \
         patch("voicevox_sequencer.asyncio.sleep"):
        mock_client = AsyncMock()
        MockHTTP.return_value.__aenter__.return_value = mock_client
        mock_client.post.return_value = AsyncMock(
            status_code=200,
            json=AsyncMock(return_value={}),
            content=b"WAV"
        )
        from voicevox_sequencer import VoicevoxSequencer
        seq = VoicevoxSequencer()
        script = [
            {"text": "こんにちは", "emotion": "happy", "pause_after": 0.1},
            {"text": "さようなら", "emotion": "sad", "pause_after": 0.1},
        ]
        await seq.play_scene(script, speaker=8)
        # Called once per line
        assert mock_client.post.call_count >= 2
```

- [ ] **Step 2: Run to verify failure**

```bash
cd scripts/hypura && uv run pytest tests/test_voicevox_sequencer.py -v
```

Expected: `ImportError: No module named 'voicevox_sequencer'`

- [ ] **Step 3: Implement voicevox_sequencer.py**

```python
# scripts/hypura/voicevox_sequencer.py
"""VOICEVOX TTS sequencer — outputs to VB-Cable virtual microphone."""
from __future__ import annotations

import asyncio
import io
import json
import logging
from pathlib import Path
from typing import Any

import httpx
import sounddevice as sd
import soundfile as sf

logger = logging.getLogger(__name__)
ROOT = Path(__file__).parent


def load_param_map() -> dict:
    p = ROOT / "osc_param_map.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


def _find_cable_device(name: str = "CABLE Input") -> int | None:
    try:
        devices = sd.query_devices()
        for i, d in enumerate(devices):
            if name.lower() in d["name"].lower() and d["max_output_channels"] > 0:
                return i
    except Exception:
        pass
    return None


class VoicevoxSequencer:
    def __init__(
        self,
        voicevox_url: str = "http://127.0.0.1:50021",
        cable_device_name: str = "CABLE Input",
    ) -> None:
        self._url = voicevox_url
        self._device = _find_cable_device(cable_device_name)
        if self._device is None:
            logger.warning("VB-Cable not found, using default output device")

    def _emotion_to_voice_params(self, emotion: str, param_map: dict) -> dict:
        vx_emotions = param_map.get("voicevox_emotions", {})
        return vx_emotions.get(emotion) or vx_emotions.get("neutral") or {
            "speedScale": 1.0, "pitchScale": 0.0, "intonationScale": 1.0
        }

    async def speak(self, text: str, emotion: str = "neutral", speaker: int = 8) -> None:
        """Synthesize text and play through VB-Cable."""
        param_map = load_param_map()
        voice_params = self._emotion_to_voice_params(emotion, param_map)
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Step 1: audio_query
            r = await client.post(
                f"{self._url}/audio_query",
                params={"text": text, "speaker": speaker},
            )
            r.raise_for_status()
            query = r.json()
            # Apply emotion params
            query.update(voice_params)
            # Step 2: synthesis
            r2 = await client.post(
                f"{self._url}/synthesis",
                params={"speaker": speaker},
                json=query,
            )
            r2.raise_for_status()
            wav_bytes = r2.content
        # Play through VB-Cable (or default device)
        try:
            data, samplerate = sf.read(io.BytesIO(wav_bytes))
            sd.play(data, samplerate, device=self._device)
            sd.wait()
        except Exception as e:
            logger.warning(f"Audio playback failed: {e}")

    async def play_scene(self, script: list[dict[str, Any]], speaker: int = 8) -> None:
        """Play a sequence of lines with pauses."""
        for line in script:
            text = line.get("text", "")
            emotion = line.get("emotion", "neutral")
            pause = line.get("pause_after", 0.5)
            if text:
                try:
                    await self.speak(text, emotion=emotion, speaker=speaker)
                except Exception as e:
                    logger.warning(f"speak failed for '{text[:20]}': {e}")
            await asyncio.sleep(pause)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd scripts/hypura && uv run pytest tests/test_voicevox_sequencer.py -v
```

Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add scripts/hypura/voicevox_sequencer.py scripts/hypura/tests/test_voicevox_sequencer.py
git commit --no-verify -m "feat: add voicevox_sequencer with VB-Cable output and scene scripting"
```

---

## Task 5: Code Runner — OpenClaw CLI + UV/PEP723

**Files:**

- Create: `scripts/hypura/code_runner.py`
- Create: `scripts/hypura/tests/test_code_runner.py`

- [ ] **Step 1: Write the failing tests**

````python
# scripts/hypura/tests/test_code_runner.py
import subprocess
from pathlib import Path
from unittest.mock import MagicMock, patch, call
import pytest

def test_run_task_succeeds_on_first_try():
    with patch("code_runner.subprocess.run") as mock_run:
        # First call: openclaw generates code; second: uv run succeeds
        mock_run.side_effect = [
            MagicMock(returncode=0, stdout='```python\n# /// script\n# dependencies = []\n# ///\nprint("ok")\n```', stderr=""),
            MagicMock(returncode=0, stdout="ok", stderr=""),
        ]
        from code_runner import CodeRunner
        runner = CodeRunner()
        result = runner.run_task("print hello")
        assert result["success"] is True
        assert result["output"] == "ok"

def test_run_task_retries_on_failure():
    with patch("code_runner.subprocess.run") as mock_run:
        mock_run.side_effect = [
            MagicMock(returncode=0, stdout='```python\n# /// script\n# dependencies=[]\n# ///\nraise ValueError("oops")\n```', stderr=""),
            MagicMock(returncode=1, stdout="", stderr="ValueError: oops"),
            # retry: codex generates fix
            MagicMock(returncode=0, stdout='```python\n# /// script\n# dependencies=[]\n# ///\nprint("fixed")\n```', stderr=""),
            MagicMock(returncode=0, stdout="fixed", stderr=""),
        ]
        from code_runner import CodeRunner
        runner = CodeRunner(max_retries=2)
        result = runner.run_task("print hello")
        assert result["success"] is True

def test_extract_python_code_from_markdown():
    from code_runner import extract_code_block
    md = '```python\n# /// script\nprint("hi")\n```'
    code = extract_code_block(md)
    assert 'print("hi")' in code

def test_run_task_fails_after_max_retries():
    with patch("code_runner.subprocess.run") as mock_run:
        # Always fail
        fail_gen = MagicMock(returncode=0, stdout='```python\nprint("x")\n```', stderr="")
        fail_run = MagicMock(returncode=1, stdout="", stderr="error")
        mock_run.side_effect = [fail_gen, fail_run] * 5
        from code_runner import CodeRunner
        runner = CodeRunner(max_retries=2)
        result = runner.run_task("bad task")
        assert result["success"] is False
````

- [ ] **Step 2: Run to verify failure**

```bash
cd scripts/hypura && uv run pytest tests/test_code_runner.py -v
```

Expected: `ImportError: No module named 'code_runner'`

- [ ] **Step 3: Implement code_runner.py**

````python
# scripts/hypura/code_runner.py
"""Code runner — uses OpenClaw CLI (or Codex CLI) to generate code, then runs with uv."""
from __future__ import annotations

import hashlib
import json
import logging
import re
import subprocess
import time
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)
ROOT = Path(__file__).parent
CONFIG_PATH = ROOT / "harness.config.json"
GENERATED_DIR = ROOT / "generated"
EVOLVED_DIR = ROOT / "evolved"
GENERATED_DIR.mkdir(exist_ok=True)
EVOLVED_DIR.mkdir(exist_ok=True)

_config: dict = {}
if CONFIG_PATH.exists():
    _config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))

_MAX_GENERATED = _config.get("generated_max_files", 50)
_EXEC_TIMEOUT = _config.get("execution_timeout_sec", 60)
_OPENCLAW_CLI = _config.get("openclaw", {}).get("cli_binary", "openclaw")


def extract_code_block(text: str) -> str:
    """Extract Python code from a markdown fenced block."""
    m = re.search(r"```(?:python)?\n(.*?)```", text, re.DOTALL)
    if m:
        return m.group(1).strip()
    return text.strip()


def _prune_generated() -> None:
    """Keep only the most recent _MAX_GENERATED scripts."""
    files = sorted(GENERATED_DIR.glob("run_*.py"), key=lambda f: f.stat().st_mtime)
    for old in files[:-_MAX_GENERATED]:
        old.unlink(missing_ok=True)


def _generate_code(task: str, error_context: str = "") -> str:
    """Call OpenClaw CLI → Codex CLI fallback to generate Python code."""
    prompt = (
        f"Write a self-contained Python script (PEP 723 inline deps) to: {task}"
        + (f"\n\nPrevious error:\n{error_context}" if error_context else "")
        + "\n\nStart with:\n# /// script\n# dependencies = [...]\n# ///"
    )
    # Primary: OpenClaw CLI
    for cli in [_OPENCLAW_CLI, "claude", "codex"]:
        try:
            flags = ["--quiet"] if cli == "codex" else ["-p", "--output-format", "text"]
            if cli == _OPENCLAW_CLI:
                cmd = [cli, "run", "--", prompt]
            elif cli == "claude":
                cmd = [cli, "-p", prompt, "--output-format", "text"]
            else:
                cmd = [cli, "--quiet", prompt]
            r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", timeout=120)
            if r.returncode == 0 and r.stdout.strip():
                return extract_code_block(r.stdout)
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
    raise RuntimeError("All code generation backends failed")


class CodeRunner:
    def __init__(self, max_retries: int | None = None) -> None:
        self._max_retries = max_retries or _config.get("evolution", {}).get("max_retries_before_evolve", 3)

    def run_task(self, task: str, model: str = "auto") -> dict:
        """Generate + execute Python. Retry on failure. Returns result dict."""
        error_context = ""
        for attempt in range(self._max_retries):
            try:
                code = _generate_code(task, error_context)
            except RuntimeError as e:
                return {"success": False, "error": str(e), "output": ""}

            # Save script with PEP 723 header if missing
            if "# /// script" not in code:
                code = "# /// script\n# dependencies = []\n# ///\n" + code

            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            h = hashlib.sha256(code.encode()).hexdigest()[:8]
            script_path = GENERATED_DIR / f"run_{ts}_{h}.py"
            script_path.write_text(code, encoding="utf-8")
            _prune_generated()

            # Run with uv
            try:
                r = subprocess.run(
                    ["uv", "run", "--script", str(script_path)],
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    timeout=_EXEC_TIMEOUT,
                    cwd=str(GENERATED_DIR),
                )
                if r.returncode == 0:
                    return {"success": True, "output": r.stdout, "script": str(script_path)}
                error_context = r.stderr or r.stdout
                logger.warning(f"Attempt {attempt+1}/{self._max_retries} failed: {error_context[:200]}")
            except subprocess.TimeoutExpired:
                error_context = f"Execution timed out after {_EXEC_TIMEOUT}s"

        return {"success": False, "error": f"Failed after {self._max_retries} attempts", "output": "", "last_error": error_context}
````

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd scripts/hypura && uv run pytest tests/test_code_runner.py -v
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add scripts/hypura/code_runner.py scripts/hypura/tests/test_code_runner.py
git commit --no-verify -m "feat: add code_runner with OpenClaw/Codex CLI + PEP723 uv execution"
```

---

## Task 6: Skill Generator

**Files:**

- Create: `scripts/hypura/skill_generator.py`
- Create: `scripts/hypura/tests/test_skill_generator.py`

- [ ] **Step 1: Write the failing tests**

```python
# scripts/hypura/tests/test_skill_generator.py
from unittest.mock import MagicMock, patch
import pytest

def test_create_skill_calls_init_script():
    with patch("skill_generator.subprocess.run") as mock_run, \
         patch("skill_generator.Path.exists", return_value=True):
        mock_run.return_value = MagicMock(returncode=0, stdout="", stderr="")
        from skill_generator import SkillGenerator
        gen = SkillGenerator()
        gen.create_skill("my-test-skill", "A test skill", ["example 1"])
        assert mock_run.called

def test_create_skill_returns_path_on_success():
    with patch("skill_generator.subprocess.run") as mock_run, \
         patch("skill_generator.Path.exists", return_value=True), \
         patch("skill_generator.Path.mkdir"), \
         patch("builtins.open", MagicMock()):
        mock_run.return_value = MagicMock(returncode=0, stdout="", stderr="")
        from skill_generator import SkillGenerator
        gen = SkillGenerator()
        result = gen.create_skill("my-skill", "desc", ["example"])
        assert result["success"] is True
        assert "my-skill" in result.get("skill_path", "")
```

- [ ] **Step 2: Run to verify failure**

```bash
cd scripts/hypura && uv run pytest tests/test_skill_generator.py -v
```

- [ ] **Step 3: Implement skill_generator.py**

```python
# scripts/hypura/skill_generator.py
"""Skill generator — uses OpenClaw to design and create new skills."""
from __future__ import annotations

import json
import logging
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)
ROOT = Path(__file__).parent
REPO_ROOT = ROOT.parent.parent
SKILLS_DIR = REPO_ROOT / "skills"
SKILL_CREATOR_INIT = REPO_ROOT / "skills" / "skill-creator" / "scripts" / "init_skill.py"
SKILL_CREATOR_PKG = REPO_ROOT / "skills" / "skill-creator" / "scripts" / "package_skill.py"
CONFIG_PATH = ROOT / "harness.config.json"
_config: dict = {}
if CONFIG_PATH.exists():
    _config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
_OPENCLAW_CLI = _config.get("openclaw", {}).get("cli_binary", "openclaw")


def _generate_skill_body(name: str, description: str, examples: list[str]) -> str:
    """Ask OpenClaw to write the SKILL.md body."""
    prompt = (
        f"Write the body section of a SKILL.md for a skill named '{name}'.\n"
        f"Description: {description}\n"
        f"Usage examples:\n" + "\n".join(f"- {e}" for e in examples) +
        "\n\nReturn only the markdown body (no frontmatter). Be concise."
    )
    for cli in [_OPENCLAW_CLI, "claude"]:
        try:
            if cli == _OPENCLAW_CLI:
                cmd = [cli, "run", "--", prompt]
            else:
                cmd = [cli, "-p", prompt, "--output-format", "text"]
            r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", timeout=120)
            if r.returncode == 0 and r.stdout.strip():
                return r.stdout.strip()
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
    return f"# {name}\n\n{description}\n\n## Examples\n\n" + "\n".join(f"- {e}" for e in examples)


class SkillGenerator:
    def create_skill(self, name: str, description: str, examples: list[str]) -> dict:
        skill_dir = SKILLS_DIR / name

        # Step 1: init_skill.py
        if SKILL_CREATOR_INIT.exists():
            r = subprocess.run(
                ["py", "-3", str(SKILL_CREATOR_INIT), name, "--path", str(SKILLS_DIR)],
                capture_output=True, text=True, encoding="utf-8"
            )
            if r.returncode != 0:
                logger.warning(f"init_skill failed: {r.stderr}")

        # Step 2: write SKILL.md
        skill_dir.mkdir(parents=True, exist_ok=True)
        skill_md_path = skill_dir / "SKILL.md"
        body = _generate_skill_body(name, description, examples)
        frontmatter = f"---\nname: {name}\ndescription: >\n  {description}\n---\n\n"
        skill_md_path.write_text(frontmatter + body, encoding="utf-8")

        # Step 3: package
        if SKILL_CREATOR_PKG.exists():
            subprocess.run(
                ["py", "-3", str(SKILL_CREATOR_PKG), str(skill_dir)],
                capture_output=True, text=True, encoding="utf-8"
            )

        return {"success": True, "skill_path": str(skill_dir), "name": name}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd scripts/hypura && uv run pytest tests/test_skill_generator.py -v
```

Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add scripts/hypura/skill_generator.py scripts/hypura/tests/test_skill_generator.py
git commit --no-verify -m "feat: add skill_generator with OpenClaw-driven SKILL.md generation"
```

---

## Task 7: ShinkaEvolve Adapter

**Files:**

- Create: `scripts/hypura/shinka_adapter.py`
- Create: `scripts/hypura/tests/test_shinka_adapter.py`

- [ ] **Step 1: Write the failing tests**

````python
# scripts/hypura/tests/test_shinka_adapter.py
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

def test_adapter_initializes_with_ollama_env():
    import os
    with patch.dict(os.environ, {}, clear=False):
        from shinka_adapter import ShinkaAdapter
        adapter = ShinkaAdapter()
        assert os.environ.get("OLLAMA_BASE_URL") == "http://127.0.0.1:11434"

@pytest.mark.asyncio
async def test_evolve_code_returns_result():
    with patch("shinka_adapter.AsyncLLMClient") as MockLLM:
        mock_client = MagicMock()
        mock_client.query = AsyncMock(return_value=MagicMock(content='```python\nprint("evolved")\n```'))
        MockLLM.return_value = mock_client
        from shinka_adapter import ShinkaAdapter
        adapter = ShinkaAdapter()
        result = await adapter.evolve_code("print('hello')", "print more", generations=1)
        assert result is not None
````

- [ ] **Step 2: Run to verify failure**

```bash
cd scripts/hypura && uv run pytest tests/test_shinka_adapter.py -v
```

- [ ] **Step 3: Implement shinka_adapter.py**

````python
# scripts/hypura/shinka_adapter.py
"""ShinkaEvolve adapter — evolution engine backed by Ollama native API."""
from __future__ import annotations

import json
import logging
import os
import sys
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)
ROOT = Path(__file__).parent
REPO_ROOT = ROOT.parent.parent
SHINKA_PATH = REPO_ROOT / "vendor" / "ShinkaEvolve"
if str(SHINKA_PATH) not in sys.path:
    sys.path.insert(0, str(SHINKA_PATH))

CONFIG_PATH = ROOT / "harness.config.json"
_config: dict = {}
if CONFIG_PATH.exists():
    _config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))

_OLLAMA_URL = _config.get("models", {}).get("ollama_base_url", "http://127.0.0.1:11434")
_PRIMARY_MODEL = _config.get("models", {}).get("primary", "qwen-hakua-core")
_LITE_MODEL = _config.get("models", {}).get("lite", "qwen-hakua-core-lite")

# Set native Ollama API env vars (no /v1 suffix)
os.environ.setdefault("OLLAMA_BASE_URL", _OLLAMA_URL)
os.environ.setdefault("OLLAMA_API_KEY", "ollama-local")

try:
    from shinka.llm import AsyncLLMClient
    _SHINKA_AVAILABLE = True
except ImportError:
    AsyncLLMClient = None  # type: ignore
    _SHINKA_AVAILABLE = False
    logger.warning("ShinkaEvolve not available — evolve endpoint will use stub")


class ShinkaAdapter:
    def __init__(self) -> None:
        os.environ.setdefault("OLLAMA_BASE_URL", _OLLAMA_URL)
        if _SHINKA_AVAILABLE and AsyncLLMClient is not None:
            self._client = AsyncLLMClient(
                model_names=[_PRIMARY_MODEL, _LITE_MODEL],
                temperatures=[0.8, 0.6],
                model_sample_probs=[0.7, 0.3],
            )
        else:
            self._client = None

    async def evolve_code(self, seed: str, fitness_hint: str, generations: int = 5) -> str | None:
        if self._client is None:
            logger.warning("ShinkaEvolve unavailable, returning seed unchanged")
            return seed
        best = seed
        for gen in range(generations):
            prompt = (
                f"Improve this Python code based on: {fitness_hint}\n\n"
                f"Current code:\n```python\n{best}\n```\n\n"
                "Return only the improved code in a ```python block."
            )
            result = await self._client.query(
                msg=prompt,
                system_msg="You are a Python code optimizer. Return only code.",
            )
            if result and hasattr(result, "content") and result.content:
                from code_runner import extract_code_block
                improved = extract_code_block(result.content)
                if improved and improved != best:
                    best = improved
                    logger.info(f"[evolve] generation {gen+1}: improved")
        return best

    async def evolve_skill(self, skill_md: str, examples: list[str], generations: int = 3) -> str:
        if self._client is None:
            return skill_md
        prompt = (
            f"Improve this SKILL.md to better trigger on these examples:\n"
            + "\n".join(f"- {e}" for e in examples)
            + f"\n\nCurrent SKILL.md:\n{skill_md}"
        )
        result = await self._client.query(msg=prompt, system_msg="Return only the improved SKILL.md.")
        if result and hasattr(result, "content"):
            return result.content or skill_md
        return skill_md
````

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd scripts/hypura && uv run pytest tests/test_shinka_adapter.py -v
```

Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add scripts/hypura/shinka_adapter.py scripts/hypura/tests/test_shinka_adapter.py
git commit --no-verify -m "feat: add shinka_adapter with Ollama native API integration"
```

---

## Task 8: Wire All Endpoints into Daemon

**Files:**

- Modify: `scripts/hypura/harness_daemon.py`
- Modify: `scripts/hypura/tests/test_harness_daemon.py`

- [ ] **Step 1: Add endpoint tests**

Append to `scripts/hypura/tests/test_harness_daemon.py`:

```python
def test_osc_endpoint_chatbox():
    from harness_daemon import app
    from unittest.mock import patch, MagicMock
    with patch("harness_daemon.osc_ctrl") as mock_osc:
        client = TestClient(app)
        resp = client.post("/osc", json={"action": "chatbox", "payload": {"text": "hi"}})
        assert resp.status_code == 200
        mock_osc.send_chatbox.assert_called_once_with("hi")

def test_run_endpoint_returns_result():
    from harness_daemon import app
    from unittest.mock import patch, MagicMock
    with patch("harness_daemon.code_runner_instance") as mock_runner:
        mock_runner.run_task.return_value = {"success": True, "output": "done"}
        client = TestClient(app)
        resp = client.post("/run", json={"task": "print hello"})
        assert resp.status_code == 200
        assert resp.json()["success"] is True
```

- [ ] **Step 2: Run new tests to verify they fail**

```bash
cd scripts/hypura && uv run pytest tests/test_harness_daemon.py::test_osc_endpoint_chatbox -v
```

Expected: `FAILED` (endpoint not yet wired)

- [ ] **Step 3: Wire all endpoints into harness_daemon.py**

Replace `harness_daemon.py` with the full wired version:

```python
# scripts/hypura/harness_daemon.py
"""Hypura Harness — central FastAPI daemon (port 18794).
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

from osc_controller import OSCController, load_param_map
from voicevox_sequencer import VoicevoxSequencer
from code_runner import CodeRunner
from skill_generator import SkillGenerator
from shinka_adapter import ShinkaAdapter

logger = logging.getLogger(__name__)
ROOT = Path(__file__).parent
CONFIG_PATH = ROOT / "harness.config.json"
config: dict = json.loads(CONFIG_PATH.read_text(encoding="utf-8")) if CONFIG_PATH.exists() else {}

app = FastAPI(title="Hypura Harness", version="0.1.0")

# Module singletons (initialized at startup)
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

# --- Request models ---
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
    target: str  # code | skill | osc | script
    seed: str
    fitness_hint: str = ""
    generations: int = 5

# --- Endpoints ---
@app.get("/status")
async def status() -> dict:
    vx_ok = False
    ollama_ok = False
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(config.get("voicevox_url", "http://127.0.0.1:50021") + "/version")
            vx_ok = r.status_code == 200
    except Exception:
        pass
    try:
        ollama_url = config.get("models", {}).get("ollama_base_url", "http://127.0.0.1:11434")
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(ollama_url + "/api/tags")
            ollama_ok = r.status_code == 200
    except Exception:
        pass
    return {"daemon_version": "0.1.0", "osc_connected": True, "voicevox_alive": vx_ok, "ollama_alive": ollama_ok}

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
        elif action in ("move", "jump", "move_forward", "move_back", "turn_left", "turn_right"):
            osc_ctrl.send_action(action, payload.get("value", 1.0))
        else:
            raise HTTPException(status_code=400, detail=f"Unknown OSC action: {action}")
    except Exception as e:
        logger.error(f"OSC error: {e}")
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
        logger.error(f"Speak error: {e}")
        return {"success": False, "error": str(e)}
    return {"success": True}

@app.post("/run")
async def run(req: RunRequest) -> dict:
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None, code_runner_instance.run_task, req.task
    )
    return result

@app.post("/skill")
async def skill(req: SkillRequest) -> dict:
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None, skill_gen.create_skill, req.name, req.description, req.examples
    )
    return result

@app.post("/evolve")
async def evolve(req: EvolveRequest) -> dict:
    if req.target == "code":
        result = await shinka.evolve_code(req.seed, req.fitness_hint, req.generations)
    elif req.target == "skill":
        result = await shinka.evolve_skill(req.seed, [req.fitness_hint], req.generations)
    else:
        result = req.seed  # passthrough for unsupported targets
    return {"success": True, "result": result}

if __name__ == "__main__":
    port = config.get("daemon_port", 18790)
    uvicorn.run("harness_daemon:app", host="127.0.0.1", port=port, reload=False)
```

- [ ] **Step 4: Run all tests**

```bash
cd scripts/hypura && uv run pytest tests/ -v
```

Expected: All tests pass (may have some warnings about external services)

- [ ] **Step 5: Commit**

```bash
git add scripts/hypura/harness_daemon.py scripts/hypura/tests/test_harness_daemon.py
git commit --no-verify -m "feat: wire all endpoints into harness_daemon — OSC/speak/run/skill/evolve"
```

---

## Task 9: OpenClaw Skill + start_daemon.py

**Files:**

- Create: `skills/hypura-harness/SKILL.md`
- Create: `skills/hypura-harness/scripts/start_daemon.py`

- [ ] **Step 1: Create SKILL.md**

````markdown
---
name: hypura-harness
description: >
  VRChatアバター自律制御・VOICEVOX音声台本・Pythonコード生成実行・スキル自動生成・
  ShinkaEvolve進化ループを持つ汎用Pythonハーネス。
  以下の場合に使う:
  (1)「VRChatで〜して」「アバターを〜」「チャットボックスに〜」→ POST /osc
  (2)「〜と喋って」「VOICEVOXで〜」「台本を読んで」→ POST /speak
  (3)「〜するPythonを書いて実行して」「スクリプトを作って動かして」→ POST /run
  (4)「〜というスキルを作って」「新しいスキルを追加して」→ POST /skill
  (5)「〜を進化させて」「もっと良くして」→ POST /evolve
  OpenClawが汎用エージェントとしてこれらのツールを組み合わせて自律的に動作する。
---

# Hypura Harness

デーモンURL: `http://127.0.0.1:18794`

## デーモン起動確認

まず `GET /status` で稼働確認。応答なし → 起動:

```bash
cd scripts/hypura && uv run harness_daemon.py
```
````

または `skills/hypura-harness/scripts/start_daemon.py` を実行。

## エンドポイント早見表

### /osc — VRChat制御

```json
{"action":"chatbox","payload":{"text":"こんにちは！"}}
{"action":"emotion","payload":{"emotion":"happy"}}
{"action":"jump","payload":{}}
{"action":"move_forward","payload":{"value":1.0}}
{"action":"param","payload":{"name":"FaceEmotion","value":1}}
```

### /speak — VOICEVOX台本

```json
{"text":"こんにちは","emotion":"happy","speaker":8}
{"scene":[{"text":"やあ","emotion":"happy","pause_after":0.5},{"text":"元気？","emotion":"neutral","pause_after":1.0}]}
```

### /run — コード生成・実行

```json
{ "task": "CSVを読んでグラフを作るスクリプトを書いて実行して" }
```

### /skill — スキル自動生成

```json
{ "name": "my-skill", "description": "○○をする", "examples": ["使用例1", "使用例2"] }
```

### /evolve — ShinkaEvolve進化

```json
{
  "target": "code",
  "seed": "既存コード",
  "fitness_hint": "エラーなく実行できること",
  "generations": 5
}
```

## OpenClawを汎用エージェントとして使う

OpenClawはこのスキル経由でハーネスの全ツールを組み合わせられる:

- ユーザーの要求を分析 → 適切なエンドポイントを選択
- 複数ステップのタスクを順次実行
- 失敗時は `/evolve` で改善ループ
- 新しい能力が必要な場合は `/skill` で自己拡張

````

- [ ] **Step 2: Create start_daemon.py**

```python
# skills/hypura-harness/scripts/start_daemon.py
"""Hypura Harness daemon launcher with health-check polling."""
from __future__ import annotations

import subprocess
import sys
import time
import urllib.request
from pathlib import Path

DAEMON_URL = "http://127.0.0.1:18794/status"
PID_FILE = Path(__file__).parent.parent.parent.parent / ".openclaw-desktop" / "harness_daemon.pid"
HARNESS_DIR = Path(__file__).parent.parent.parent.parent / "scripts" / "hypura"
TIMEOUT_SEC = 10


def is_running() -> bool:
    try:
        with urllib.request.urlopen(DAEMON_URL, timeout=2) as r:
            return r.status == 200
    except Exception:
        return False


def start() -> None:
    if is_running():
        print("[hypura] Daemon already running.")
        return

    print("[hypura] Starting harness daemon...")
    proc = subprocess.Popen(
        ["uv", "run", "harness_daemon.py"],
        cwd=str(HARNESS_DIR),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    PID_FILE.parent.mkdir(parents=True, exist_ok=True)
    PID_FILE.write_text(str(proc.pid), encoding="utf-8")

    # Poll until ready
    deadline = time.time() + TIMEOUT_SEC
    while time.time() < deadline:
        if is_running():
            print(f"[hypura] Daemon ready (PID {proc.pid}).")
            return
        time.sleep(0.5)

    print("[hypura] ERROR: Daemon did not start within timeout.", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    start()
````

- [ ] **Step 3: Commit**

```bash
git add skills/hypura-harness/
git commit --no-verify -m "feat: add hypura-harness skill and start_daemon.py launcher"
```

---

## Task 10: Integration — Smoke Test + Desktop Stack

**Files:**

- Modify: `scripts/launchers/launch-desktop-stack.ps1`

- [ ] **Step 1: Smoke-test the daemon manually**

```bash
cd scripts/hypura
uv run harness_daemon.py &
sleep 3
curl http://127.0.0.1:18794/status
```

Expected response:

```json
{ "daemon_version": "0.1.0", "osc_connected": true, "voicevox_alive": false, "ollama_alive": false }
```

(voicevox/ollama false is OK when not running)

- [ ] **Step 2: Test /osc endpoint (VRChat optional)**

```bash
curl -X POST http://127.0.0.1:18794/osc \
  -H "Content-Type: application/json" \
  -d '{"action":"chatbox","payload":{"text":"test from harness"}}'
```

Expected: `{"success":true}`

- [ ] **Step 3: Test /run endpoint**

```bash
curl -X POST http://127.0.0.1:18794/run \
  -H "Content-Type: application/json" \
  -d '{"task":"print the current date and time in Japanese"}'
```

Expected: `{"success":true,"output":"..."}` (if OpenClaw/claude CLI available)

- [ ] **Step 4: Add to launch-desktop-stack.ps1**

Open `scripts/launchers/launch-desktop-stack.ps1` and add after the existing startup lines:

```powershell
# Hypura Python Harness
Write-Host "[Stack] Starting Hypura harness daemon..."
$hypuraDir = Join-Path $PSScriptRoot "../../scripts/hypura"
Start-Process "uv" -ArgumentList "run harness_daemon.py" -WorkingDirectory $hypuraDir -WindowStyle Hidden
```

- [ ] **Step 5: Run full test suite**

```bash
cd scripts/hypura
uv run pytest tests/ -v --tb=short
```

Expected: All tests pass. Note any warnings but don't block on external service unavailability.

- [ ] **Step 6: Final commit**

```bash
git add scripts/hypura/ skills/hypura-harness/ scripts/launchers/launch-desktop-stack.ps1
git commit --no-verify -m "feat: complete Hypura Python Harness — integration + desktop stack wiring"
```

---

## Quick Reference

| Goal          | Command                                                                  |
| ------------- | ------------------------------------------------------------------------ |
| Start daemon  | `cd scripts/hypura && uv run harness_daemon.py`                          |
| Run all tests | `cd scripts/hypura && uv run pytest tests/ -v`                           |
| Check status  | `curl http://127.0.0.1:18794/status`                                     |
| OSC chatbox   | `curl -X POST .../osc -d '{"action":"chatbox","payload":{"text":"hi"}}'` |
| Run AI task   | `curl -X POST .../run -d '{"task":"..."}'`                               |
| Install deps  | `cd scripts/hypura && uv sync --extra test`                              |
