import requests
import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def verify_voicevox():
    url = "http://localhost:50021/version"
    try:
        logging.info("Attempting to reach VOICEVOX at %s", url)
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            logging.info("VOICEVOX Manifestation Verified. Version: %s", response.text)
            return True
        else:
            logging.error("VOICEVOX returned unexpected status: %d", response.status_code)
            return False
    except Exception as e:
        logging.error("VOICEVOX not detected: %s", e)
        return False

if __name__ == "__main__":
    if verify_voicevox():
        sys.exit(0)
    else:
        sys.exit(1)
