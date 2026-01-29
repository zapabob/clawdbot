import type { OSCClient } from "../osc/client.js";

/**
 * Handles VRChat User Camera and Dolly OSC commands.
 * References: VRChat 2025.3.3 Open Beta and Wiki.
 */
export class CameraController {
  constructor(private client: OSCClient) {}

  /**
   * Sets the camera mode.
   * 0: Off, 1: Photo, 2: Video, etc.
   */
  async setMode(mode: number) {
    return this.client.sendRaw("/usercamera/Mode", "i", [mode]);
  }

  /**
   * Sets the zoom level (0.0 - 1.0).
   */
  async setZoom(value: number) {
    const clamped = Math.min(1.0, Math.max(0.0, value));
    return this.client.sendRaw("/usercamera/Zoom", "f", [clamped]);
  }

  /**
   * Sets the aperture (depth of field).
   */
  async setAperture(value: number) {
    const clamped = Math.min(1.0, Math.max(0.0, value));
    return this.client.sendRaw("/usercamera/Aperture", "f", [clamped]);
  }

  /**
   * Sets the focal distance.
   */
  async setFocalDistance(value: number) {
    const clamped = Math.min(1.0, Math.max(0.0, value));
    return this.client.sendRaw("/usercamera/FocalDistance", "f", [clamped]);
  }

  /**
   * Sets the exposure level.
   */
  async setExposure(value: number) {
    const clamped = Math.min(1.0, Math.max(0.0, value));
    return this.client.sendRaw("/usercamera/Exposure", "f", [clamped]);
  }

  /**
   * Toggles various camera settings (UI, Nameplates, etc).
   */
  async toggleSetting(setting: string, enabled: boolean) {
    // e.g., /usercamera/ShowUI
    return this.client.sendRaw(`/usercamera/${setting}`, enabled ? "T" : "F", []);
  }

  /**
   * Dolly Control: Play/Pause.
   */
  async dollyPlay(enabled: boolean) {
    return this.client.sendRaw("/dolly/Play", enabled ? "T" : "F", []);
  }

  /**
   * Dolly Control: Set Position on path (0.0 - 1.0).
   */
  async dollyPosition(value: number) {
    const clamped = Math.min(1.0, Math.max(0.0, value));
    return this.client.sendRaw("/dolly/Position", "f", [clamped]);
  }

  /**
   * Dolly Control: Set Speed.
   */
  async dollySpeed(value: number) {
    return this.client.sendRaw("/dolly/Speed", "f", [value]);
  }
}
