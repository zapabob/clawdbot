/**
 * OpenClaw Extension entry point for @openclaw/live2d-companion
 *
 * This extension adds a Hakua Live2D desktop companion window.
 * The Electron app is launched separately via the launcher scripts.
 * This file serves as the OpenClaw extension registration hook.
 */
export const extension = {
  id: "live2d-companion",
  label: "Hakua Live2D Companion",
  description:
    "Transparent Electron desktop companion with Live2D avatar, VOICEVOX lip sync, STT, and LINE integration.",
  version: "2026.3.20",
};
