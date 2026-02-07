#!/usr/bin/env python3
"""
Gemini CLI ↔ OpenClaw Gateway Bidirectional Bridge

This script creates a bidirectional communication bridge between:
- Gemini CLI (Google's AI assistant with MCP tools)
- OpenClaw Gateway (Multi-channel AI assistant)

Features:
- Forward messages from Gemini CLI to OpenClaw channels
- Forward messages from OpenClaw to Gemini CLI
- Support for text, images, and tool calls
- Local websocket-based communication

Usage:
    python gemini-openclaw-bridge.py [--gemini-port 8080] [--openclaw-port 18789]
"""

import asyncio
import json
import sys
import argparse
from datetime import datetime
from pathlib import Path

try:
    import websockets
except ImportError:
    print("Installing websockets...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets", "-q"])
    import websockets

try:
    import httpx
except ImportError:
    print("Installing httpx...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "httpx", "-q"])
    import httpx

CONFIG = {
    "gemini_port": 8080,
    "openclaw_port": 18789,
    "bridge_host": "127.0.0.1",
    "auto_start_gemini": True,
    "auto_start_openclaw": False,
}

MESSAGES = []


class GeminiOpenClawBridge:
    def __init__(self, config):
        self.config = config
        self.gemini_ws = None
        self.openclaw_ws = None
        self.running = False

    async def connect_gemini(self):
        """Connect to Gemini CLI via WebSocket."""
        uri = f"ws://{self.config['bridge_host']}:{self.config['gemini_port']}/ws"
        print(f"Connecting to Gemini CLI at {uri}...")
        try:
            self.gemini_ws = await websockets.connect(uri)
            print("✓ Connected to Gemini CLI")
            return True
        except Exception as e:
            print(f"✗ Failed to connect to Gemini CLI: {e}")
            print("  Make sure Gemini CLI is running with MCP/WebSocket support")
            return False

    async def connect_openclaw(self):
        """Connect to OpenClaw Gateway."""
        uri = f"ws://{self.config['bridge_host']}:{self.config['openclaw_port']}"
        print(f"Connecting to OpenClaw Gateway at {uri}...")
        try:
            self.openclaw_ws = await websockets.connect(uri)
            print("✓ Connected to OpenClaw Gateway")
            return True
        except Exception as e:
            print(f"✗ Failed to connect to OpenClaw Gateway: {e}")
            return False

    async def forward_to_gemini(self, message):
        """Forward message from OpenClaw to Gemini CLI."""
        if self.gemini_ws:
            await self.gemini_ws.send(json.dumps(message))
            print(f"[→ Gemini] {message.get('type', 'message')}")

    async def forward_to_openclaw(self, message):
        """Forward message from Gemini CLI to OpenClaw."""
        if self.openclaw_ws:
            await self.openclaw_ws.send(json.dumps(message))
            print(f"[→ OpenClaw] {message.get('type', 'message')}")

    async def handle_gemini_message(self, data):
        """Handle incoming message from Gemini CLI."""
        msg_type = data.get("type", "text")

        if msg_type == "text":
            await self.forward_to_openclaw(
                {
                    "type": "message",
                    "content": data.get("content", ""),
                    "source": "gemini-cli",
                    "timestamp": datetime.now().isoformat(),
                }
            )

        elif msg_type == "tool_call":
            await self.forward_to_openclaw(
                {
                    "type": "tool_request",
                    "tool": data.get("tool", ""),
                    "params": data.get("params", {}),
                    "source": "gemini-cli",
                }
            )

        elif msg_type == "image":
            await self.forward_to_openclaw(
                {
                    "type": "image",
                    "data": data.get("data", ""),
                    "mime_type": data.get("mime_type", "image/png"),
                    "source": "gemini-cli",
                }
            )

    async def handle_openclaw_message(self, data):
        """Handle incoming message from OpenClaw Gateway."""
        msg_type = data.get("type", "message")

        if msg_type == "message":
            await self.forward_to_gemini(
                {
                    "type": "text",
                    "content": data.get("content", ""),
                    "source": "openclaw",
                    "timestamp": datetime.now().isoformat(),
                }
            )

        elif msg_type == "channel_message":
            await self.forward_to_gemini(
                {
                    "type": "text",
                    "content": f"[{data.get('channel', 'unknown')}] {data.get('sender', 'unknown')}: {data.get('content', '')}",
                    "source": "openclaw",
                    "channel": data.get("channel"),
                }
            )

        elif msg_type == "tool_response":
            await self.forward_to_gemini(
                {
                    "type": "tool_response",
                    "tool": data.get("tool", ""),
                    "result": data.get("result", ""),
                    "success": data.get("success", True),
                }
            )

    async def bridge_loop(self):
        """Main bridge loop."""
        print("\n" + "=" * 60)
        print("Gemini CLI ↔ OpenClaw Gateway Bridge")
        print("=" * 60)
        print(
            f"Gemini CLI:  ws://{self.config['bridge_host']}:{self.config['gemini_port']}"
        )
        print(
            f"OpenClaw:    ws://{self.config['bridge_host']}:{self.config['openclaw_port']}"
        )
        print("=" * 60 + "\n")

        self.running = True

        while self.running:
            try:
                if self.gemini_ws and self.openclaw_ws:
                    # Bridge messages between both directions
                    await asyncio.gather(
                        self._bridge_gemini_to_openclaw(),
                        self._bridge_openclaw_to_gemini(),
                        return_exceptions=True,
                    )
                else:
                    await asyncio.sleep(1)

            except Exception as e:
                print(f"Bridge error: {e}")
                await asyncio.sleep(1)

    async def _bridge_gemini_to_openclaw(self):
        """Bridge messages from Gemini CLI to OpenClaw."""
        async for message in self.gemini_ws:
            try:
                data = json.loads(message)
                await self.handle_gemini_message(data)
            except json.JSONDecodeError:
                await self.handle_gemini_message({"type": "text", "content": message})

    async def _bridge_openclaw_to_gemini(self):
        """Bridge messages from OpenClaw to Gemini CLI."""
        async for message in self.openclaw_ws:
            try:
                data = json.loads(message)
                await self.handle_openclaw_message(data)
            except json.JSONDecodeError:
                await self.handle_openclaw_message({"type": "text", "content": message})

    async def start(self):
        """Start the bridge."""
        gemini_connected = await self.connect_gemini()
        openclaw_connected = await self.connect_openclaw()

        if gemini_connected and openclaw_connected:
            await self.bridge_loop()
        else:
            print("\n[!] Bridge started but some connections failed")
            print("    Ensure both services are running and try again")

    def stop(self):
        """Stop the bridge."""
        self.running = False
        if self.gemini_ws:
            asyncio.get_event_loop().run_until_complete(self.gemini_ws.close())
        if self.openclaw_ws:
            asyncio.get_event_loop().run_until_complete(self.openclaw_ws.close())
        print("\nBridge stopped")


async def main():
    parser = argparse.ArgumentParser(description="Gemini CLI ↔ OpenClaw Gateway Bridge")
    parser.add_argument(
        "--gemini-port",
        "-g",
        type=int,
        default=8080,
        help="Gemini CLI WebSocket port (default: 8080)",
    )
    parser.add_argument(
        "--openclaw-port",
        "-o",
        type=int,
        default=18789,
        help="OpenClaw Gateway WebSocket port (default: 18789)",
    )
    parser.add_argument(
        "--host", type=str, default="127.0.0.1", help="Bridge host (default: 127.0.0.1)"
    )

    args = parser.parse_args()

    config = {
        "gemini_port": args.gemini_port,
        "openclaw_port": args.openclaw_port,
        "bridge_host": args.host,
    }

    bridge = GeminiOpenClawBridge(config)

    try:
        await bridge.start()
    except KeyboardInterrupt:
        print("\nShutting down bridge...")
        bridge.stop()


if __name__ == "__main__":
    print("""
╔═══════════════════════════════════════════════════════════════╗
║       Gemini CLI ↔ OpenClaw Gateway Bridge                     ║
║                                                               ║
║  Prerequisites:                                               ║
║    1. Run Gemini CLI with MCP/WebSocket:                      ║
║       gemini --mcp-server=8080                                ║
║                                                               ║
║    2. Run OpenClaw Gateway:                                   ║
║       node dist/entry.mjs gateway --port 18789                 ║
║                                                               ║
║    3. Run this bridge:                                        ║
║       python gemini-openclaw-bridge.py                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
""")
    asyncio.run(main())
