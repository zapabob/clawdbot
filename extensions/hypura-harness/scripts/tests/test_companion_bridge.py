# scripts/hypura/tests/test_companion_bridge.py
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from companion_bridge import CompanionBridge


@pytest.mark.asyncio
async def test_forward_speak_prefers_sdk_bridge() -> None:
    bridge = CompanionBridge("http://127.0.0.1:18791", repo_root=Path("C:/repo"))
    with patch.object(bridge, "_run_sdk_bridge", new=AsyncMock()) as mock_sdk:
        await bridge.forward_speak("hello", "happy")

    mock_sdk.assert_awaited_once_with(
        text="hello", avatar_command={"expression": "happy"}
    )


@pytest.mark.asyncio
async def test_forward_emotion_falls_back_to_legacy_http() -> None:
    bridge = CompanionBridge("http://127.0.0.1:18791", repo_root=Path("C:/repo"))
    with patch.object(
        bridge, "_run_sdk_bridge", new=AsyncMock(side_effect=RuntimeError("sdk failed"))
    ), patch("companion_bridge.httpx.AsyncClient") as mock_cls:
        mock_client = AsyncMock()
        mock_cls.return_value.__aenter__.return_value = mock_client
        mock_cls.return_value.__aexit__.return_value = None

        await bridge.forward_emotion("neutral")

        mock_client.post.assert_awaited_once()
        call_args = mock_client.post.await_args
        assert call_args[0][0] == "http://127.0.0.1:18791/control"
        assert call_args[1]["json"] == {
            "avatarCommand": {"expression": "neutral"},
        }


@pytest.mark.asyncio
async def test_forward_speak_silently_fails_when_companion_down() -> None:
    bridge = CompanionBridge("http://127.0.0.1:18791", repo_root=Path("C:/repo"))
    with patch.object(
        bridge, "_run_sdk_bridge", new=AsyncMock(side_effect=RuntimeError("sdk failed"))
    ), patch("companion_bridge.httpx.AsyncClient") as mock_cls:
        mock_client = AsyncMock()
        req = MagicMock()
        mock_client.post = AsyncMock(
            side_effect=httpx.ConnectError("connection refused", request=req)
        )
        mock_cls.return_value.__aenter__.return_value = mock_client
        mock_cls.return_value.__aexit__.return_value = None

        await bridge.forward_speak("hi", "neutral")


@pytest.mark.asyncio
async def test_forward_motion_uses_expected_avatar_command() -> None:
    bridge = CompanionBridge("http://127.0.0.1:18791", repo_root=Path("C:/repo"))
    with patch.object(bridge, "_dispatch", new=AsyncMock()) as mock_dispatch:
        await bridge.forward_motion("Idle", 2)

    mock_dispatch.assert_awaited_once_with(
        avatar_command={"motion": "Idle", "motionIndex": 2}
    )


@pytest.mark.asyncio
async def test_forward_load_model_uses_expected_avatar_command() -> None:
    bridge = CompanionBridge("http://127.0.0.1:18791", repo_root=Path("C:/repo"))
    with patch.object(bridge, "_dispatch", new=AsyncMock()) as mock_dispatch:
        await bridge.forward_load_model("C:/repo/assets/Hakua.fbx")

    mock_dispatch.assert_awaited_once_with(
        avatar_command={"loadModel": "C:/repo/assets/Hakua.fbx"}
    )
