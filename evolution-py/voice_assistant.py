#!/usr/bin/env python3
"""
OpenClaw Voice Integration Script
Real-time voice conversation with Ollama + Moonshine/Whisper STT + Edge TTS

Usage:
    py -3 voice_assistant.py --turns 5      # Voice conversation
    py -3 voice_assistant.py --speak "text" # Speak text
    py -3 voice_assistant.py --listen       # Listen only
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
        print(f"\n🎤 聞いています... ({duration}秒)")
        try:
            result = self.voice.listen_realtime(duration=duration)
            print(f"📝 認識結果: {result.text}")
            return result.text
        except Exception as e:
            print(f"❌ 音声認識エラー: {e}")
            return ""

    def speak(self, text: str):
        """Speak text."""
        print(f"🔊  Assistant: {text}")
        try:
            self.voice.speak(text, play=True)
        except Exception as e:
            print(f"❌ 音声出力エラー: {e}")

    def chat(self, message: str) -> str:
        """Chat with Ollama."""
        response = self.ollama.generate(prompt=message, temperature=0.7, num_predict=512)
        return response.response

    def converse(self, num_turns: int = 5):
        """Run voice conversation loop."""
        print("\n" + "=" * 50)
        print("🎙️ 音声エージェント会話 Started")
        print("=" * 50)
        print("MICを使用します。話しかけてください。")
        print("終了するには Ctrl+C を押してください。")

        greeting = "こんにちは！私はOpenClawの音声エージェントです。何でも聞いてください！"
        self.speak(greeting)

        turn = 0
        while turn < num_turns:
            turn += 1
            print(f"\n--- Turn {turn}/{num_turns} ---")

            # Listen
            user_text = self.listen(duration=6.0)

            if not user_text.strip():
                print("🙈 認識できませんでした。もう一度お願いします。")
                self.speak("すみません、聞こえませんでした。もう一度お願いします。")
                continue

            # Check for exit
            if any(
                word in user_text.lower()
                for word in ["終わり", "終了", "quit", "exit", "さようなら"]
            ):
                print("👋 終了します。")
                self.speak("分かりました！また話しかけてください。バイバイ！")
                break

            # Chat with Ollama
            print("🤔 Ollamaに問い合わせ中...")
            response = self.chat(user_text)

            # Speak response
            self.speak(response)

        if turn >= num_turns:
            print("\n✅ 会話を終了します。")
            self.speak("セッション終了です。また話しかけてください！")

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
    parser.add_argument("--turns", type=int, default=5, help="Number of conversation turns")
    parser.add_argument("--speak", type=str, help="Text to speak (no listening)")
    parser.add_argument("--listen", action="store_true", help="Listen and print (no speaking)")

    args = parser.parse_args()

    # Create assistant
    assistant = OpenClawVoiceAssistant(
        ollama_model=args.model, stt_provider=args.stt, tts_provider=args.tts
    )

    try:
        if args.speak:
            assistant.speak(args.speak)

        elif args.listen:
            text = assistant.listen(duration=6.0)
            print(f"\n認識テキスト: {text}")

        else:
            assistant.converse(num_turns=args.turns)

    except KeyboardInterrupt:
        print("\n\n⌨️ 中断されました")
        assistant.speak("分かりました！")
    finally:
        assistant.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
