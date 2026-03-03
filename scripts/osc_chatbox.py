"""
osc_chatbox.py — Send a message to VRChat Chatbox via OSC (python-osc)
"""

import logging
import sys
from pythonosc.udp_client import SimpleUDPClient

logging.basicConfig(level=logging.INFO, format="[osc_chatbox] %(message)s")
logger = logging.getLogger(__name__)


def send_osc(address, args, host="127.0.0.1", port=9000):
    client = SimpleUDPClient(host, port)
    client.send_message(address, args)
    logger.info(f"Sent OSC {address} -> {args} (port {port})")


def main():
    args = sys.argv[1:]
    host = "127.0.0.1"
    port = 9000
    raw_mode = False
    raw_addr = ""
    raw_values = []

    i = 0
    while i < len(args):
        if args[i] == "--host" and i + 1 < len(args):
            host = args[i + 1]
            i += 2
        elif args[i] == "--port" and i + 1 < len(args):
            port = int(args[i + 1])
            i += 2
        elif args[i] == "--raw" and i + 1 < len(args):
            raw_mode = True
            raw_addr = args[i + 1]
            i += 2
            while i < len(args) and not args[i].startswith("--"):
                val = args[i]
                if val.lower() == "true":
                    raw_values.append(True)
                elif val.lower() == "false":
                    raw_values.append(False)
                elif val.lower() == "none" or val.lower() == "null":
                    raw_values.append(None)
                else:
                    try:
                        if "." in val:
                            raw_values.append(float(val))
                        else:
                            raw_values.append(int(val))
                    except ValueError:
                        raw_values.append(val)
                i += 1
        else:
            if not raw_mode:
                # Chatbox fallback
                text = " ".join(args[i:])
                send_osc("/chatbox/input", [text, True, True], host, port)
                return
            i += 1

    if raw_mode:
        send_osc(raw_addr, raw_values, host, port)


if __name__ == "__main__":
    main()
