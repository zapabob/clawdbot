import requests
import os
import sys
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def verify_voicevox(endpoint="http://localhost:50021", speaker_id=2):
    try:
        # 1. Version Check
        url_version = f"{endpoint}/version"
        logging.info("Checking version at %s", url_version)
        v_resp = requests.get(url_version, timeout=5)
        if v_resp.status_code != 200:
            logging.error("VOICEVOX Version check failed: %d", v_resp.status_code)
            return False
        logging.info("VOICEVOX Version: %s", v_resp.text)

        # 2. Synthesis Check (Audio Query + Synthesis)
        text = "はくあ、顕現中。システムオールグリーン。"
        logging.info("Testing synthesis buffer generation...")
        
        # Audio Query
        url_query = f"{endpoint}/audio_query"
        params = {"text": text, "speaker": speaker_id}
        q_resp = requests.post(url_query, params=params, timeout=10)
        if q_resp.status_code != 200:
            logging.error("Audio query failed: %d", q_resp.status_code)
            return False
            
        query_data = q_resp.json()
        
        # Synthesis
        url_synth = f"{endpoint}/synthesis"
        s_resp = requests.post(url_synth, params={"speaker": speaker_id}, data=json.dumps(query_data), timeout=20)
        
        if s_resp.status_code != 200:
            logging.error("Synthesis failed: %d", s_resp.status_code)
            return False

        # Validate WAV header (RIFF)
        audio_data = s_resp.content
        if audio_data[:4] == b'RIFF':
            logging.info("VOICEVOX Synthesis Manifestation Verified. Audio Substrate is REACTIVE.")
            return True
        else:
            logging.error("Synthesis result missing valid RIFF header.")
            return False

    except Exception as e:
        logging.error("VOICEVOX detection failure: %s", e)
        return False

if __name__ == "__main__":
    # Dynamically resolve endpoint from env if available
    target_endpoint = os.getenv("VOICEVOX_ENDPOINT", "http://localhost:50021")
    target_speaker = int(os.getenv("VOICEVOX_SPEAKER_ID", "2"))
    
    if verify_voicevox(target_endpoint, target_speaker):
        sys.exit(0)
    else:
        sys.exit(1)
