# scripts/hypura/tests/test_harness_daemon.py
import json
from unittest.mock import AsyncMock, Mock, patch

from fastapi.testclient import TestClient


def test_status_returns_200() -> None:
    from harness_daemon import app

    client = TestClient(app)
    resp = client.get("/status")
    assert resp.status_code == 200


def test_status_has_required_keys() -> None:
    from harness_daemon import app

    client = TestClient(app)
    data = client.get("/status").json()
    assert "daemon_version" in data
    assert "osc_connected" in data
    assert "voicevox_alive" in data
    assert "ollama_alive" in data
    assert "lora" in data
    assert "base_model_configured" in data["lora"]


def test_osc_endpoint_chatbox() -> None:
    from harness_daemon import app

    with patch("harness_daemon.is_vrchat_active", return_value=True), patch(
        "harness_daemon.osc_ctrl"
    ) as mock_osc:
        client = TestClient(app)
        resp = client.post(
            "/osc", json={"action": "chatbox", "payload": {"text": "hi"}}
        )
        assert resp.status_code == 200
        mock_osc.send_chatbox.assert_called_once_with(
            "hi", immediate=True, sfx=True
        )


def test_run_endpoint_returns_result() -> None:
    from harness_daemon import app

    with patch("harness_daemon.code_runner_instance") as mock_runner:
        mock_runner.run_task.return_value = {"success": True, "output": "done"}
        client = TestClient(app)
        resp = client.post("/run", json={"task": "print hello"})
        assert resp.status_code == 200
        assert resp.json()["success"] is True


def test_speak_forwards_to_companion_bridge() -> None:
    from harness_daemon import app

    with patch("harness_daemon.is_vrchat_active", return_value=True), patch(
        "harness_daemon.voicevox_seq"
    ) as mock_vx, patch(
        "harness_daemon.companion_bridge"
    ) as mock_bridge:
        mock_vx.speak = AsyncMock()
        mock_bridge.forward_speak = AsyncMock()
        client = TestClient(app)
        resp = client.post(
            "/speak", json={"text": "hello", "emotion": "happy"}
        )
        assert resp.status_code == 200
        mock_bridge.forward_speak.assert_awaited_once_with("hello", "happy")


def test_osc_emotion_forwards_companion_bridge() -> None:
    from harness_daemon import app

    with patch("harness_daemon.is_vrchat_active", return_value=True), patch(
        "harness_daemon.osc_ctrl"
    ) as mock_osc, patch(
        "harness_daemon.companion_bridge"
    ) as mock_bridge:
        mock_bridge.forward_emotion = AsyncMock()
        client = TestClient(app)
        resp = client.post(
            "/osc",
            json={"action": "emotion", "payload": {"emotion": "happy"}},
        )
        assert resp.status_code == 200
        mock_osc.apply_emotion.assert_called_once_with("happy")
        mock_bridge.forward_emotion.assert_awaited_once_with("happy")


def test_companion_control_motion_endpoint() -> None:
    from harness_daemon import app

    with patch("harness_daemon.companion_bridge") as mock_bridge:
        mock_bridge.forward_motion = AsyncMock()
        client = TestClient(app)
        resp = client.post(
            "/companion/control",
            json={"action": "motion", "value": "Idle", "motion_index": 1},
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is True
        mock_bridge.forward_motion.assert_awaited_once_with("Idle", 1)


def test_companion_control_look_at_endpoint() -> None:
    from harness_daemon import app

    with patch("harness_daemon.companion_bridge") as mock_bridge:
        mock_bridge.forward_look = AsyncMock()
        client = TestClient(app)
        resp = client.post(
            "/companion/control",
            json={"action": "look_at", "x": 0.25, "y": -0.5},
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is True
        mock_bridge.forward_look.assert_awaited_once_with(0.25, -0.5)


def test_companion_control_load_model_resolves_repo_relative_path() -> None:
    from harness_daemon import app

    with patch("harness_daemon.companion_bridge") as mock_bridge:
        mock_bridge.forward_load_model = AsyncMock()
        client = TestClient(app)
        resp = client.post(
            "/companion/control",
            json={
                "action": "load_model",
                "model_path": "assets/NFD/Hakua/FBX/FBX/Hakua.fbx",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is True
        forwarded_path = mock_bridge.forward_load_model.await_args.args[0]
        assert forwarded_path.endswith("assets\\NFD\\Hakua\\FBX\\FBX\\Hakua.fbx")


def test_submodule_run_proxies_to_gateway_tool_surface() -> None:
    import harness_daemon as hd

    mock_response = Mock()
    mock_response.is_success = True
    mock_response.json.return_value = {
        "ok": True,
        "result": {
            "ok": True,
            "status": "completed",
            "repoId": "vrchat-mcp-osc",
            "preset": "status",
        },
    }

    with patch("harness_daemon._resolve_gateway_auth_token", return_value="gateway-token"), patch(
        "harness_daemon._resolve_gateway_base_url", return_value="http://127.0.0.1:18789"
    ), patch("harness_daemon.httpx.AsyncClient") as mock_client_cls:
        mock_client = mock_client_cls.return_value.__aenter__.return_value
        mock_client.post = AsyncMock(return_value=mock_response)
        client = TestClient(hd.app)
        resp = client.post(
            "/submodule/run",
            json={
                "repoId": "vrchat-mcp-osc",
                "preset": "status",
                "extraArgs": ["--branch"],
            },
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"
        mock_client.post.assert_awaited_once_with(
            "http://127.0.0.1:18789/tools/invoke",
            json={
                "tool": "submodule_run",
                "args": {
                    "repoId": "vrchat-mcp-osc",
                    "preset": "status",
                    "extraArgs": ["--branch"],
                },
            },
            headers={
                "Authorization": "Bearer gateway-token",
                "x-openclaw-message-channel": "node",
            },
        )


def test_reload_returns_reloaded_true(tmp_path, monkeypatch) -> None:
    import harness_daemon as hd

    cfg_path = tmp_path / "harness.config.json"
    cfg_path.write_text(json.dumps({"daemon_port": 18794}))
    monkeypatch.setattr(hd, "CONFIG_PATH", cfg_path)
    client = TestClient(hd.app)
    resp = client.post("/reload")
    assert resp.status_code == 200
    body = resp.json()
    assert body["reloaded"] is True
    assert "config" in body


def test_reload_reflects_updated_config(tmp_path, monkeypatch) -> None:
    import harness_daemon as hd

    cfg_path = tmp_path / "harness.config.json"
    cfg_path.write_text(
        json.dumps({"daemon_port": 18794, "test_key": "before"})
    )
    monkeypatch.setattr(hd, "CONFIG_PATH", cfg_path)
    client = TestClient(hd.app)
    assert client.post("/reload").json()["config"]["test_key"] == "before"
    cfg_path.write_text(json.dumps({"daemon_port": 18794, "test_key": "after"}))
    assert client.post("/reload").json()["config"]["test_key"] == "after"
