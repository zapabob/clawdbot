"""VRChat OSC controller — chatbox, params, actions, emotion."""
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
