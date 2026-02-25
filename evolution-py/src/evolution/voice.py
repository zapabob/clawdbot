"""
Voice Module - Moonshine + Whisper + WebRTC Integration
Real-time speech recognition and text-to-speech for OpenClaw

Supports:
- Moonshine (when available - best for real-time)
- Whisper (OpenAI - high accuracy)
- Faster Whisper (optimized)
- Web Speech API (browser fallback)
"""

import logging
import subprocess
import tempfile
import os
from dataclasses import dataclass
from enum import Enum
from typing import Optional

logger = logging.getLogger(__name__)


class STTProvider(Enum):
    """Speech-to-Text providers."""

    MOONSHINE = "moonshine"
    WHISPER = "whisper"
    FASTER_WHISPER = "faster_whisper"
    WEB_SPEECH = "web_speech"


class TTSProvider(Enum):
    """Text-to-Speech providers."""

    COQUI = "coqui"
    EDGE_TTS = "edge"
    GTTS = "gtts"
    PIPER = "piper"
    WEB_SPEECH = "web_speech"


@dataclass
class TranscriptionResult:
    """Result from speech recognition."""

    text: str
    language: str = "ja"
    confidence: float = 1.0
    provider: str = ""


@dataclass
class TTSResult:
    """Result from text-to-speech."""

    audio_path: str
    duration: float = 0.0
    provider: str = ""


class VoiceAPI:
    """Unified voice API supporting multiple backends."""

    def __init__(
        self,
        stt_provider: STTProvider = STTProvider.FASTER_WHISPER,
        tts_provider: TTSProvider = TTSProvider.COQUI,
        device: str = "cuda",
    ):
        """Initialize voice API.

        Args:
            stt_provider: Default STT provider
            tts_provider: Default TTS provider
            device: Compute device (cuda/cpu)
        """
        self.stt_provider = stt_provider
        self.tts_provider = tts_provider
        self.device = device

        self._stt_model = None
        self._tts_model = None

        self._check_available_providers()

        logger.info(f"VoiceAPI initialized: STT={stt_provider.value}, TTS={tts_provider.value}")

    def _check_available_providers(self):
        """Check which providers are available."""
        self.available_stt = []
        self.available_tts = []

        # Check Moonshine
        try:
            import moonshine

            self.available_stt.append(STTProvider.MOONSHINE)
            logger.info("Moonshine available")
        except ImportError:
            logger.info("Moonshine not available")

        # Check Faster Whisper
        try:
            import faster_whisper

            self.available_stt.append(STTProvider.FASTER_WHISPER)
            logger.info("Faster Whisper available")
        except ImportError:
            pass

        # Check Whisper
        try:
            import whisper

            self.available_stt.append(STTProvider.WHISPER)
            logger.info("Whisper available")
        except ImportError:
            pass

        # Check Coqui TTS
        try:
            from TTS.api import TTS

            self.available_tts.append(TTSProvider.COQUI)
            logger.info("Coqui TTS available")
        except ImportError:
            pass

        # Check Edge TTS
        try:
            import edge_tts

            self.available_tts.append(TTSProvider.EDGE_TTS)
            logger.info("Edge TTS available")
        except ImportError:
            pass

    # ========== STT Methods ==========

    def speech_to_text(
        self, audio_path: str, language: str = "ja", provider: Optional[STTProvider] = None
    ) -> TranscriptionResult:
        """Convert speech to text.

        Args:
            audio_path: Path to audio file
            language: Language code (ja, en, etc.)
            provider: STT provider to use

        Returns:
            TranscriptionResult
        """
        provider = provider or self.stt_provider

        if provider == STTProvider.MOONSHINE:
            return self._stt_moonshine(audio_path, language)
        elif provider == STTProvider.FASTER_WHISPER:
            return self._stt_faster_whisper(audio_path, language)
        elif provider == STTProvider.WHISPER:
            return self._stt_whisper(audio_path, language)
        else:
            raise ValueError(f"Unknown STT provider: {provider}")

    def _stt_moonshine(self, audio_path: str, language: str) -> TranscriptionResult:
        """Moonshine STT - Best for real-time."""
        try:
            import moonshine

            if self._stt_model is None:
                self._stt_model = moonshine.load_model("moonshine/base", device=self.device)

            result = self._stt_model.transcribe(audio_path)
            text = "".join([r.text for r in result])

            return TranscriptionResult(
                text=text, language=language, confidence=0.9, provider="moonshine"
            )
        except Exception as e:
            logger.error(f"Moonshine STT failed: {e}")
            raise

    def _stt_faster_whisper(self, audio_path: str, language: str) -> TranscriptionResult:
        """Faster Whisper - Optimized Whisper."""
        try:
            from faster_whisper import WhisperModel

            if self._stt_model is None:
                # Use small model for speed
                model_size = "small"
                self._stt_model = WhisperModel(
                    model_size,
                    device=self.device,
                    compute_type="float16" if self.device == "cuda" else "int8",
                )

            segments, info = self._stt_model.transcribe(audio_path, language=language, beam_size=5)

            text = " ".join([seg.text for seg in segments])

            return TranscriptionResult(
                text=text,
                language=info.language or language,
                confidence=infoprobability or 0.9,
                provider="faster_whisper",
            )
        except Exception as e:
            logger.error(f"Faster Whisper failed: {e}")
            raise

    def _stt_whisper(self, audio_path: str, language: str) -> TranscriptionResult:
        """Standard Whisper."""
        import whisper

        if self._stt_model is None:
            self._stt_model = whisper.load_model("medium", device=self.device)

        result = self._stt_model.transcribe(audio_path, language=language)

        return TranscriptionResult(
            text=result["text"],
            language=language,
            confidence=result.get("probability", 0.9),
            provider="whisper",
        )

    # ========== TTS Methods ==========

    def text_to_speech(
        self,
        text: str,
        output_path: Optional[str] = None,
        language: str = "ja",
        provider: Optional[TTSProvider] = None,
    ) -> TTSResult:
        """Convert text to speech.

        Args:
            text: Text to speak
            output_path: Output audio file path
            language: Language code
            provider: TTS provider

        Returns:
            TTSResult
        """
        provider = provider or self.tts_provider

        if output_path is None:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                output_path = f.name

        if provider == TTSProvider.COQUI:
            return self._tts_coqui(text, output_path, language)
        elif provider == TTSProvider.EDGE_TTS:
            return self._tts_edge(text, output_path, language)
        elif provider == TTSProvider.PIPER:
            return self._tts_piper(text, output_path, language)
        else:
            raise ValueError(f"Unknown TTS provider: {provider}")

    def _tts_coqui(self, text: str, output_path: str, language: str) -> TTSResult:
        """Coqui TTS - Open source TTS."""
        from TTS.api import TTS

        if self._tts_model is None:
            # Use multi-lingual model
            self._tts_model = TTS(
                model_name="tts_models/multilingual/multi-dataset/xtts_v2",
                gpu=True if self.device == "cuda" else False,
            )

        self._tts_model.tts_to_file(text=text, file_path=output_path, language=language)

        duration = self._get_audio_duration(output_path)

        return TTSResult(audio_path=output_path, duration=duration, provider="coqui")

    def _tts_edge(self, text: str, output_path: str, language: str) -> TTSResult:
        """Edge TTS - High quality, free."""
        import edge_tts
        import asyncio
        import subprocess

        # Edge TTS outputs MP3, convert to WAV
        mp3_path = output_path.replace(".wav", ".mp3")

        async def generate():
            # Select voice based on language
            voice_map = {"ja": "ja-JP-NanamiNeural", "en": "en-US-JennyNeural"}
            voice = voice_map.get(language, "ja-JP-NanamiNeural")

            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(mp3_path)

        asyncio.run(generate())

        # Convert MP3 to WAV using ffmpeg or just rename
        try:
            subprocess.run(
                ["ffmpeg", "-i", mp3_path, "-y", output_path], capture_output=True, timeout=30
            )
            os.remove(mp3_path)
        except:
            # If ffmpeg not available, just rename
            if os.path.exists(mp3_path):
                os.rename(mp3_path, output_path)

        duration = self._get_audio_duration(output_path)

        return TTSResult(audio_path=output_path, duration=duration, provider="edge_tts")
        sd.wait()

        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            temp_path = f.name
            wavfile.write(temp_path, samplerate, recording)

        # Transcribe
        result = self.speech_to_text(temp_path, provider=provider)

        # Cleanup
        os.remove(temp_path)

        return result

    def speak(
        self, text: str, provider: Optional[TTSProvider] = None, play: bool = True
    ) -> TTSResult:
        """Speak text and optionally play audio.

        Args:
            text: Text to speak
            provider: TTS provider
            play: Whether to play audio

        Returns:
            TTSResult
        """
        result = self.text_to_speech(text, provider=provider)

        if play:
            try:
                # Use edge-tts direct playback or aplay
                import subprocess

                # Try to play with default Windows player
                subprocess.run(
                    [
                        "powershell",
                        "-Command",
                        f'Add-Type -AssemblyName System.Windows.Forms; [System.Media.SoundPlayer]::new("{result.audio_path}").PlaySync()',
                    ],
                    capture_output=True,
                    timeout=10,
                )
            except Exception as e:
                logger.warning(f"Failed to play audio: {e}")

        return result

    def close(self):
        """Clean up resources."""
        if self._stt_model is not None:
            del self._stt_model
        if self._tts_model is not None:
            del self._tts_model

        if self.device == "cuda":
            import torch

            torch.cuda.empty_cache()


# Convenience function
def create_voice_api(stt: str = "faster_whisper", tts: str = "coqui") -> VoiceAPI:
    """Create configured voice API.

    Args:
        stt: STT provider (moonshine, faster_whisper, whisper)
        tts: TTS provider (coqui, edge, piper)

    Returns:
        VoiceAPI instance
    """
    stt_provider = STTProvider(stt)
    tts_provider = TTSProvider(tts)

    import torch

    device = "cuda" if torch.cuda.is_available() else "cpu"

    return VoiceAPI(stt_provider, tts_provider, device)


# Example usage
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    print("=" * 50)
    print("Voice API Test")
    print("=" * 50)

    # Create voice API
    voice = create_voice_api(stt="faster_whisper", tts="edge")

    print(f"Available STT: {[p.value for p in voice.available_stt]}")
    print(f"Available TTS: {[p.value for p in voice.available_tts]}")

    # Test TTS
    print("\nTesting TTS...")
    try:
        result = voice.speak("こんにちは、世界！", play=False)
        print(f"TTS output: {result.audio_path}")
    except Exception as e:
        print(f"TTS failed: {e}")

    print("\nDone!")
