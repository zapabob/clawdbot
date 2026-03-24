# scripts/hypura/tests/test_harness_daemon.py
from unittest.mock import patch

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
    assert "hakua_inference_enabled" in data


def test_osc_endpoint_chatbox() -> None:
    from harness_daemon import app

    with patch("harness_daemon.osc_ctrl") as mock_osc:
        client = TestClient(app)
        resp = client.post(
            "/osc", json={"action": "chatbox", "payload": {"text": "hi"}}
        )
        assert resp.status_code == 200
        mock_osc.send_chatbox.assert_called_once_with("hi")


def test_run_endpoint_returns_result() -> None:
    from harness_daemon import app

    with patch("harness_daemon.code_runner_instance") as mock_runner:
        mock_runner.run_task.return_value = {"success": True, "output": "done"}
        client = TestClient(app)
        resp = client.post("/run", json={"task": "print hello"})
        assert resp.status_code == 200
        assert resp.json()["success"] is True
