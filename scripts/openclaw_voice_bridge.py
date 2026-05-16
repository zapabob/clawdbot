#!/usr/bin/env python3
"""Local microphone -> Whisper.cpp -> OpenClaw -> VOICEVOX voice bridge.

This is intentionally a local helper script, not a product plugin. It keeps
device selection explicit so Windows does not silently play to the wrong sink.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

import sounddevice as sd
import soundfile as sf


DEFAULT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_WHISPER_DIR = Path.home() / "Desktop" / "whisper.cpp"
DEFAULT_WHISPER_EXE = DEFAULT_WHISPER_DIR / "Release" / "whisper-cli.exe"
DEFAULT_WHISPER_MODEL = DEFAULT_WHISPER_DIR / "models" / "ggml-small.bin"
DEFAULT_VOICEVOX_URL = "http://127.0.0.1:50021"
DEFAULT_SPEAKER = 3


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def list_devices() -> None:
    print(sd.query_devices())
    print(f"default: {sd.default.device}")


def require_file(path: Path, label: str) -> None:
    if not path.exists():
        fail(f"{label} not found: {path}")


def record_wav(path: Path, seconds: float, samplerate: int, input_device: int | None) -> None:
    print(f"recording {seconds:.1f}s -> {path}")
    data = sd.rec(
        int(seconds * samplerate),
        samplerate=samplerate,
        channels=1,
        dtype="float32",
        device=input_device,
    )
    sd.wait()
    sf.write(str(path), data, samplerate)


def transcribe(wav_path: Path, whisper_exe: Path, whisper_model: Path) -> str:
    require_file(whisper_exe, "whisper executable")
    require_file(whisper_model, "whisper model")
    result = subprocess.run(
        [
            str(whisper_exe),
            "-m",
            str(whisper_model),
            "-f",
            str(wav_path),
            "-l",
            "ja",
            "-nt",
            "-np",
        ],
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        check=True,
    )
    return result.stdout.strip()


def voicevox_wav(text: str, out_path: Path, voicevox_url: str, speaker: int) -> Path:
    query_url = (
        f"{voicevox_url.rstrip('/')}/audio_query?"
        f"text={urllib.parse.quote(text)}&speaker={speaker}"
    )
    with urllib.request.urlopen(urllib.request.Request(query_url, method="POST"), timeout=10) as res:
        query = res.read()

    synth_url = f"{voicevox_url.rstrip('/')}/synthesis?speaker={speaker}"
    req = urllib.request.Request(
        synth_url,
        data=query,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        out_path.write_bytes(res.read())
    return out_path


def play_wav(path: Path, output_device: int | None) -> None:
    data, samplerate = sf.read(str(path), dtype="float32")
    print(f"playing {path} on device {output_device if output_device is not None else 'default'}")
    sd.play(data, samplerate, device=output_device)
    sd.wait()


def extract_agent_text(raw: str) -> str:
    raw = raw.strip()
    if not raw:
        return ""
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return raw

    payloads = data.get("result", {}).get("payloads", [])
    texts = [p.get("text", "").strip() for p in payloads if isinstance(p, dict)]
    text = "\n".join(t for t in texts if t)
    return text or data.get("summary", "").strip() or raw


def call_openclaw(message: str, root: Path, timeout: int) -> str:
    template = os.environ.get(
        "OPENCLAW_VOICE_AGENT_CMD",
        "node openclaw.mjs agent --agent main --json --timeout 180 --message {message}",
    )
    if "{message}" not in template:
        fail("OPENCLAW_VOICE_AGENT_CMD must contain {message}")

    command = template.replace("{message}", json.dumps(message, ensure_ascii=False))
    print(f"openclaw <= {message}")
    result = subprocess.run(
        command,
        cwd=str(root),
        shell=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        timeout=timeout,
    )
    if result.returncode != 0:
        stderr = result.stderr.strip()
        stdout = result.stdout.strip()
        fail(f"OpenClaw command failed ({result.returncode})\nSTDOUT: {stdout}\nSTDERR: {stderr}")
    reply = extract_agent_text(result.stdout)
    print(f"openclaw => {reply}")
    return reply


def command_test_say(args: argparse.Namespace) -> None:
    wav_path = Path(args.out).resolve()
    voicevox_wav(args.text, wav_path, args.voicevox_url, args.speaker)
    play_wav(wav_path, args.output_device)


def command_transcribe(args: argparse.Namespace) -> None:
    print(transcribe(Path(args.wav), Path(args.whisper_exe), Path(args.whisper_model)))


def command_once(args: argparse.Namespace) -> None:
    with tempfile.TemporaryDirectory(prefix="openclaw-voice-") as tmp:
        wav_in = Path(tmp) / "input.wav"
        wav_out = Path(tmp) / "reply.wav"
        record_wav(wav_in, args.record_seconds, args.samplerate, args.input_device)
        message = transcribe(wav_in, Path(args.whisper_exe), Path(args.whisper_model))
        if not message:
            fail("Whisper returned empty text")
        reply = call_openclaw(message, Path(args.root), args.openclaw_timeout)
        if not reply:
            fail("OpenClaw returned empty reply")
        voicevox_wav(reply, wav_out, args.voicevox_url, args.speaker)
        play_wav(wav_out, args.output_device)


def command_loop(args: argparse.Namespace) -> None:
    print("voice loop started. Press Ctrl+C to stop.")
    while True:
        input("Press Enter, speak after the prompt, then wait... ")
        command_once(args)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="OpenClaw local voice bridge")
    parser.add_argument("--root", default=str(DEFAULT_ROOT))
    parser.add_argument("--whisper-exe", default=str(DEFAULT_WHISPER_EXE))
    parser.add_argument("--whisper-model", default=str(DEFAULT_WHISPER_MODEL))
    parser.add_argument("--voicevox-url", default=DEFAULT_VOICEVOX_URL)
    parser.add_argument("--speaker", type=int, default=DEFAULT_SPEAKER)
    parser.add_argument("--input-device", type=int)
    parser.add_argument("--output-device", type=int)
    parser.add_argument("--record-seconds", type=float, default=5.0)
    parser.add_argument("--samplerate", type=int, default=16000)
    parser.add_argument("--openclaw-timeout", type=int, default=240)

    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("devices", help="List audio input/output devices")

    test_say = sub.add_parser("test-say", help="Generate VOICEVOX speech and play it")
    test_say.add_argument("--text", default="これは音声再生のテストです")

    transcribe_cmd = sub.add_parser("transcribe", help="Transcribe an existing wav file")
    transcribe_cmd.add_argument("wav")

    sub.add_parser("once", help="Record once, send to OpenClaw, speak the reply")
    sub.add_parser("loop", help="Repeat one voice turn after each Enter key")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    if args.command == "devices":
        list_devices()
    elif args.command == "test-say":
        command_test_say(args)
    elif args.command == "transcribe":
        command_transcribe(args)
    elif args.command == "once":
        command_once(args)
    elif args.command == "loop":
        command_loop(args)


if __name__ == "__main__":
    main()
