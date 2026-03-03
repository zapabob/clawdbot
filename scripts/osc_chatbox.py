"""
osc_chatbox.py — Send a message to VRChat Chatbox via OSC (python-osc)

This script is called by OpenClaw's vrchat-relay extension to send
chatbox messages that VRChat actually receives.

Usage: py -3 osc_chatbox.py "<message>" [--host 127.0.0.1] [--port 9000] [--no-sfx]
"""

import logging
import sys

logging.basicConfig(level=logging.INFO, format="[osc_chatbox] %(message)s")
logger = logging.getLogger(__name__)

try:
    from pythonosc.udp_client import SimpleUDPClient
except ImportError:
    logger.error("pythonosc not installed. Run: pip install python-osc")
    sys.exit(1)


def send_chatbox(
    text: str,
    host: str = "127.0.0.1",
    port: int = 9000,
    sfx: bool = True,
) -> None:
    """Send text to VRChat Chatbox via OSC /chatbox/input."""
    client = SimpleUDPClient(host, port)
    # /chatbox/input expects: (string message, bool immediate, bool notification_sound)
    client.send_message("/chatbox/input", [text, True, sfx])
    logger.info("Sent to VRChat Chatbox (port %d): %s", port, text)


def send_raw_osc(
    address: str,
    value: str | int | float | bool,
    host: str = "127.0.0.1",
    port: int = 9000,
) -> None:
    """Send a raw OSC message."""
    client = SimpleUDPClient(host, port)
    client.send_message(address, [value])
    logger.info("Sent OSC %s -> %s (port %d)", address, value, port)


def main() -> None:
    if len(sys.argv) < 2:
        print(
            "Usage: py -3 osc_chatbox.py <message> [--host H] [--port P] [--no-sfx] [--raw <addr> <value>]",
            file=sys.stderr,
        )
        sys.exit(1)

    host = "127.0.0.1"
    port = 9000
    sfx = True
    raw_mode = False
    raw_addr = ""
    raw_value: str | int | float = ""

    args = sys.argv[1:]
    text_parts: list[str] = []
    i = 0
    while i < len(args):
        if args[i] == "--host" and i + 1 < len(args):
            host = args[i + 1]
            i += 2
        elif args[i] == "--port" and i + 1 < len(args):
            port = int(args[i + 1])
            i += 2
        elif args[i] == "--no-sfx":
            sfx = False
            i += 1
        elif args[i] == "--raw" and i + 2 < len(args):
            raw_mode = True
            raw_addr = args[i + 1]
            raw_val_str = args[i + 2]
            # Try to parse as number
            try:
                raw_value = int(raw_val_str)
            except ValueError:
                try:
                    raw_value = float(raw_val_str)
                except ValueError:
                    if raw_val_str.lower() == "true":
                        raw_value = True  # type: ignore[assignment]
                    elif raw_val_str.lower() == "false":
                        raw_value = False  # type: ignore[assignment]
                    else:
                        raw_value = raw_val_str
            i += 3
        else:
            text_parts.append(args[i])
            i += 1

    if raw_mode:
        send_raw_osc(raw_addr, raw_value, host, port)
    else:
        text = " ".join(text_parts)
        if not text:
            print("Error: No message provided.", file=sys.stderr)
            sys.exit(1)
        send_chatbox(text, host, port, sfx)


if __name__ == "__main__":
    main()
