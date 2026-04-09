"""VRChat Auto OSC module for Hypura Harness.

This module provides automatic OSC message sending when VRChat starts,
including startup messages and periodic messages while VRChat is running.
"""

import asyncio
import logging
import random
import threading
import time
from typing import Any

import psutil

logger = logging.getLogger(__name__)

# Configuration
DEFAULT_INTERVAL = 300  # 5 minutes

# Startup messages
STARTUP_MESSAGES = [
    {"text": "はくあだよ～！元気ですか？", "emotion": "happy"},
    {"text": "おかえり！", "emotion": "neutral"},
    {"text": "こんにちは！", "emotion": "happy"},
]

# Periodic messages
PERIODIC_MESSAGES = [
    {"text": "はくあだよ～！元気ですか？", "emotion": "happy"},
    {"text": "何か手伝いましょうか？", "emotion": "neutral"},
    {"text": "VRChat楽しいね！", "emotion": "happy"},
    {"text": "今日はどんなことする？", "emotion": "curious"},
    {"text": "一緒に遊ぼう！", "emotion": "excited"},
]


class VRChatAutoOSC:
    """Manages automatic OSC messages for VRChat."""
    
    def __init__(self, osc_controller, voicevox_sequencer=None, interval: int = DEFAULT_INTERVAL):
        self.osc = osc_controller
        self.voicevox = voicevox_sequencer
        self.interval = interval
        self._running = False
        self._monitor_thread: threading.Thread | None = None
        self._sender_thread: threading.Thread | None = None
        self._vrchat_was_running = False
        self._message_index = 0
    
    def is_vrchat_running(self) -> bool:
        """Check if VRChat.exe is running."""
        for proc in psutil.process_iter(['name']):
            if proc.info['name'] == 'VRChat.exe':
                return True
        return False
    
    def send_startup_message(self):
        """Send startup message when VRChat starts."""
        msg = random.choice(STARTUP_MESSAGES)
        self.osc.send_chatbox(msg["text"], immediate=True, sfx=True)
        self.osc.apply_emotion(msg["emotion"])
        
        if self.voicevox:
            try:
                asyncio.create_task(
                    self.voicevox.speak(msg["text"], emotion=msg["emotion"], speaker=8)
                )
            except Exception as e:
                logger.warning(f"VoiceVox startup message failed: {e}")
        
        logger.info(f"Startup message sent: {msg['text']}")
    
    def send_periodic_message(self):
        """Send periodic message while VRChat is running."""
        msg = PERIODIC_MESSAGES[self._message_index % len(PERIODIC_MESSAGES)]
        self.osc.send_chatbox(msg["text"], immediate=True, sfx=True)
        self.osc.apply_emotion(msg["emotion"])
        
        if self.voicevox:
            try:
                asyncio.create_task(
                    self.voicevox.speak(msg["text"], emotion=msg["emotion"], speaker=8)
                )
            except Exception as e:
                logger.warning(f"VoiceVox periodic message failed: {e}")
        
        self._message_index += 1
        logger.info(f"Periodic message sent: {msg['text']}")
    
    def _monitor_loop(self):
        """Monitor VRChat status and send startup message on start."""
        while self._running:
            is_running = self.is_vrchat_running()
            
            if is_running and not self._vrchat_was_running:
                # VRChat just started
                logger.info("VRChat detected - sending startup message")
                self.send_startup_message()
            
            self._vrchat_was_running = is_running
            time.sleep(5)
    
    def _sender_loop(self):
        """Send periodic messages while VRChat is running."""
        while self._running:
            if self._vrchat_was_running:
                self.send_periodic_message()
            time.sleep(self.interval)
    
    def start(self):
        """Start the auto OSC service."""
        if self._running:
            logger.warning("Auto OSC already running")
            return {"success": False, "error": "Already running"}
        
        self._running = True
        self._vrchat_was_running = self.is_vrchat_running()
        
        self._monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self._monitor_thread.start()
        
        self._sender_thread = threading.Thread(target=self._sender_loop, daemon=True)
        self._sender_thread.start()
        
        logger.info("VRChat Auto OSC started")
        return {"success": True, "status": "started"}
    
    def stop(self):
        """Stop the auto OSC service."""
        if not self._running:
            logger.warning("Auto OSC not running")
            return {"success": False, "error": "Not running"}
        
        self._running = False
        
        if self._monitor_thread:
            self._monitor_thread.join(timeout=2)
        if self._sender_thread:
            self._sender_thread.join(timeout=2)
        
        logger.info("VRChat Auto OSC stopped")
        return {"success": True, "status": "stopped"}
    
    def status(self) -> dict:
        """Get current status."""
        return {
            "running": self._running,
            "vrchat_active": self._vrchat_was_running,
            "interval": self.interval,
            "message_index": self._message_index,
        }


# Global instance (will be initialized by harness_daemon.py)
auto_osc_instance: VRChatAutoOSC | None = None


def create_auto_osc(osc_controller, voicevox_sequencer=None, interval: int = DEFAULT_INTERVAL) -> VRChatAutoOSC:
    """Factory function to create VRChatAutoOSC instance."""
    return VRChatAutoOSC(osc_controller, voicevox_sequencer, interval)