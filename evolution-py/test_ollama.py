#!/usr/bin/env python3
"""
Simple Ollama test for OpenClaw Heartbeat
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

from evolution import OllamaClient


def main():
    client = OllamaClient()

    print("Available models:", client.get_available_models())
    print("Device info:", client.get_device_info())

    # Test generation
    response = client.generate(
        prompt="Say 'Hello from OpenClaw Evolution System' in Japanese",
        temperature=0.7,
        num_predict=100,
    )

    print("\nResponse:", response.response)
    print("Model:", response.model)
    print("Done:", response.done)

    return 0


if __name__ == "__main__":
    sys.exit(main())
