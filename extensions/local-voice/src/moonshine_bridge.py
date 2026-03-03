import io
import sys
import warnings

import moonshine
import numpy as np
import soundfile as sf

# Suppress warnings to keep stdout clean
warnings.filterwarnings("ignore")


def main():
    # Load Moonshine Model (Tiny is the fastest for continuous resonance)
    model = moonshine.load_model("tiny")

    # Send readiness signal
    sys.stdout.write("READY\n")
    sys.stdout.flush()

    while True:
        try:
            # Read magic header or file path
            path = sys.stdin.readline().strip()
            if not path:
                continue
            if path == "EXIT":
                break

            # Process the audio file sent from Node.js
            try:
                # Moonshine expects standard 16kHz audio array
                # Use soundfile to load the WAV written by Node.js
                audio, sr = sf.read(path)

                # Resample if not 16k? We will ensure Node.js sends 16k
                if sr != 16000:
                    import librosa

                    audio = librosa.resample(audio, orig_sr=sr, target_sr=16000)

                # Transcribe using Moonshine
                transcripts = moonshine.transcribe(audio, model)

                # Transcripts is a list of strings if multiple lines, or just a string
                result = (
                    transcripts[0]
                    if isinstance(transcripts, list) and len(transcripts) > 0
                    else str(transcripts)
                )

                # ASI_ACCEL: Heuristic Intent Recognition bypass
                # Skip heavy Gemma LLM dependencies and natively route critical commands at STT layer
                normalized = result.lower().replace(" ", "")
                if (
                    "ステータス報告" in normalized
                    or "システム状況" in normalized
                    or "statusreport" in normalized
                ):
                    sys.stdout.write("INTENT|status_report\n")
                elif (
                    "テスト反応" in normalized
                    or "テスト" in normalized
                    or "testreaction" in normalized
                ):
                    sys.stdout.write("INTENT|test_reaction\n")
                elif (
                    "アバターを変えて" in normalized
                    or "チェンジ" in normalized
                    or "changeavatar" in normalized
                ):
                    sys.stdout.write("INTENT|change_avatar\n")
                else:
                    # Return the result string with success prefix if no intent is extracted
                    sys.stdout.write(f"OK|{result}\n")

                sys.stdout.flush()
            except Exception as e:
                # Need to return failure on one line
                sys.stdout.write(f"ERR|{str(e)}\n")
                sys.stdout.flush()

        except EOFError:
            break
        except KeyboardInterrupt:
            break


if __name__ == "__main__":
    main()
