#!/usr/bin/env python3
"""
OpenClaw Voice Integration Script
Real-time voice conversation with Ollama + Moonshine/Whisper STT + Edge TTS
"""

import sys
import os
import asyncio
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

from evolution import OllamaClient, create_voice_api, STTProvider, TTSProvider


class OpenClawVoiceAssistant:
    """Voice assistant integrating Ollama + STT + TTS."""

    def __init__(
        self,
        ollama_model: str = "dolphin-llama3:latest",
        stt_provider: str = "moonshine",
        tts_provider: str = "edge",
    ):
        """Initialize voice assistant."""
        print(f"Initializing Voice Assistant...")

        # Ollama client
        self.ollama = OllamaClient()
        self.ollama.config.model = ollama_model

        # Voice API
        self.voice = create_voice_api(stt=stt_provider, tts=tts_provider)

        print(f"Ollama model: {ollama_model}")
        print(f"STT: {stt_provider}")
        print(f"TTS: {tts_provider}")
        print("Ready!")

    def listen(self, duration: float = 5.0) -> str:
        """Listen and transcribe speech."""
        print(f"Listening for {duration}s...")
        result = self.voice.listen_realtime(duration=duration)
        print(f"You: {result.text}")
        return result.text

    def speak(self, text: str):
        """Speak text."""
        print(f"Assistant: {text}")
        self.voice.speak(text, play=True)

    def chat(self, message: str) -> str:
        """Chat with Ollama."""
        response = self.ollama.generate(prompt=message, temperature=0.7, num_predict=512)
        return response.response

    def converse(self, num_turns: int = 3):
        """Run voice conversation."""
        print("\n" + "=" * 50)
        print("Voice Conversation Started")
        print("=" * 50)

        for i in range(num_turns):
            print(f"\n--- Turn {i + 1}/{num_turns} ---")

            # Listen
            user_text = self.listen(duration=5.0)

            if not user_text.strip():
                print("No speech detected, skipping...")
                continue

            # Chat with Ollama
            response = self.chat(user_text)

            # Speak response
            self.speak(response)

        print("\nConversation ended!")

    def close(self):
        """Clean up resources."""
        self.ollama.close()
        self.voice.close()


def main():
    import argparse

    parser = argparse.ArgumentParser(description="OpenClaw Voice Assistant")
    parser.add_argument("--model", default="dolphin-llama3:latest", help="Ollama model")
    parser.add_argument(
        "--stt",
        default="moonshine",
        choices=["moonshine", "whisper", "faster_whisper"],
        help="STT provider",
    )
    parser.add_argument(
        "--tts", default="edge", choices=["edge", "coqui", "piper"], help="TTS provider"
    )
    parser.add_argument("--turns", type=int, default=3, help="Number of conversation turns")
    parser.add_argument("--speak-only", type=str, help="Text to speak (no listening)")
    parser.add_argument("--listen-only", action="store_true", help="Listen and print (no speaking)")

    args = parser.parse_args()

    # Create assistant
    assistant = OpenClawVoiceAssistant(
        ollama_model=args.model, stt_provider=args.stt, tts_provider=args.tts
    )

    try:
        if args.speak_only:
            # Speak only mode
            assistant.speak(args.speak_only)

        elif args.listen_only:
            # Listen only mode
            text = assistant.listen(duration=5.0)
            print(f"\nTranscribed: {text}")

        else:
            # Full conversation
            assistant.converse(num_turns=args.turns)

    finally:
        assistant.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
