"""Forward Hypura daemon actions to the Desktop Companion via the public SDK bridge."""
from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class CompanionBridge:
    """Dispatch Desktop Companion commands through a Node SDK bridge with HTTP fallback."""

    def __init__(
        self,
        companion_url: str,
        *,
        repo_root: Path | None = None,
        state_dir: Path | None = None,
    ) -> None:
        self._base = companion_url.rstrip("/")
        self._repo_root = repo_root or Path(__file__).resolve().parents[3]
        self._state_dir = state_dir or (self._repo_root / ".openclaw-desktop")
        self._sdk_bridge_script = Path(__file__).with_name("companion_sdk_bridge.mjs")

    async def _run_sdk_bridge(
        self,
        *,
        text: str | None = None,
        avatar_command: dict[str, Any] | None = None,
    ) -> None:
        payload: dict[str, Any] = {"stateDir": str(self._state_dir)}
        if text:
            payload["text"] = text
        if avatar_command:
            payload["avatarCommand"] = avatar_command

        proc = await asyncio.create_subprocess_exec(
            "node",
            str(self._sdk_bridge_script),
            cwd=str(self._repo_root),
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate(json.dumps(payload).encode("utf-8"))
        if proc.returncode != 0:
            raise RuntimeError(
                (
                    stderr.decode("utf-8", errors="replace")
                    or stdout.decode("utf-8", errors="replace")
                ).strip()
                or f"node bridge exited with {proc.returncode}"
            )

    async def _post_legacy_http(
        self,
        *,
        text: str | None = None,
        avatar_command: dict[str, Any] | None = None,
    ) -> None:
        url = f"{self._base}/control"
        payload: dict[str, Any] = {}
        if text:
            payload["speakText"] = text
        if avatar_command:
            payload["avatarCommand"] = avatar_command
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(url, json=payload)

    async def _dispatch(
        self,
        *,
        text: str | None = None,
        avatar_command: dict[str, Any] | None = None,
    ) -> None:
        try:
            await self._run_sdk_bridge(text=text, avatar_command=avatar_command)
            return
        except Exception as e:  # noqa: BLE001 - preserve legacy compatibility fallback
            logger.warning("Companion SDK bridge failed, falling back to legacy HTTP: %s", e)

        try:
            await self._post_legacy_http(text=text, avatar_command=avatar_command)
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.ConnectTimeout, RuntimeError) as e:
            logger.warning("Companion bridge dispatch failed: %s", e)

    async def forward_speak(self, text: str, emotion: str) -> None:
        await self._dispatch(text=text, avatar_command={"expression": emotion})

    async def forward_emotion(self, emotion: str) -> None:
        await self._dispatch(avatar_command={"expression": emotion})

    async def forward_motion(self, motion: str, motion_index: int = 0) -> None:
        await self._dispatch(
            avatar_command={"motion": motion, "motionIndex": motion_index}
        )

    async def forward_expression(self, expression: str) -> None:
        await self._dispatch(avatar_command={"expression": expression})

    async def forward_look(self, x: float, y: float) -> None:
        await self._dispatch(avatar_command={"lookAt": {"x": x, "y": y}})

    async def forward_load_model(self, model_path: str) -> None:
        await self._dispatch(avatar_command={"loadModel": model_path})
