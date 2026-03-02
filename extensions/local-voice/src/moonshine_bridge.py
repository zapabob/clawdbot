import sys
import numpy as np
import moonshine
import soundfile as sf
import warnings
import io

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

                # Return the result string with success prefix
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
