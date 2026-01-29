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
   * Sets the zoom level (Field of View).
   * VRChat Range: 20 (Zoomed in) - 150 (Wide)
   */
  async setZoom(value: number) {
    const clamped = Math.min(150, Math.max(20, value));
    return this.client.sendRaw("/usercamera/Zoom", "f", [clamped]);
  }

  /**
   * Sets the aperture (Depth of Field / F-Stop).
   * VRChat Range: 1.4 (Blurry BG) - 32 (Sharp)
   */
  async setAperture(value: number) {
    const clamped = Math.min(32, Math.max(1.4, value));
    return this.client.sendRaw("/usercamera/Aperture", "f", [clamped]);
  }

  /**
   * Sets the focal distance.
   * VRChat Range: 0.0 (Close) - 10.0 (Far)
   */
  async setFocalDistance(value: number) {
    const clamped = Math.min(10.0, Math.max(0.0, value));
    return this.client.sendRaw("/usercamera/FocalDistance", "f", [clamped]);
  }

  /**
   * Sets the exposure level (EV).
   * VRChat Range: 0.0 - 10.0
   */
  async setExposure(value: number) {
    const clamped = Math.min(10.0, Math.max(0.0, value));
    return this.client.sendRaw("/usercamera/Exposure", "f", [clamped]);
  }

  async setPhotoRate(value: number) {
    const clamped = Math.min(2.0, Math.max(0.1, value));
    return this.client.sendRaw("/usercamera/PhotoRate", "f", [clamped]);
  }

  async setTimerDuration(value: number) {
    const clamped = Math.min(60.0, Math.max(0.1, value));
    return this.client.sendRaw("/usercamera/Duration", "f", [clamped]);
  }

  /**
   * Sets camera smoothing strength (0.1 - 10.0).
   * Note: SmoothMovement must be enabled for this to take effect.
   */
  async setSmoothingStrength(value: number) {
    const clamped = Math.min(10.0, Math.max(0.1, value));
    return this.client.sendRaw("/usercamera/SmoothingStrength", "f", [clamped]);
  }

  /**
   * Toggles Smooth Movement (Steadicam mode).
   */
  async setSmoothMovement(enabled: boolean) {
    return this.client.sendRaw("/usercamera/SmoothMovement", "T", [enabled]);
  }

  /**
   * High-level helper: Enables smoothing and sets strength.
   */
  async setSmoothing(value: number) {
    await this.setSmoothMovement(true);
    return this.setSmoothingStrength(value);
  }

  /**
   * Toggles Look-At-Me (Head Tracking).
   */
  async setLookAtMe(enabled: boolean) {
    return this.client.sendRaw("/usercamera/LookAtMe", "T", [enabled]);
  }

  /**
   * Toggles Green Screen.
   * Note: Color adjustment is handled via separate Hue/Sat/Light params.
   */
  async setGreenScreen(enabled: boolean) {
    return this.client.sendRaw("/usercamera/GreenScreen", "T", [enabled]);
  }

  /**
   * Sets Green Screen Hue (0-360).
   */
  async setGreenScreenHue(value: number) {
    const clamped = Math.min(360.0, Math.max(0.0, value));
    return this.client.sendRaw("/usercamera/Hue", "f", [clamped]);
  }

  /**
   * Sets Green Screen Saturation (0-100).
   */
  async setGreenScreenSaturation(value: number) {
    const clamped = Math.min(100.0, Math.max(0.0, value));
    return this.client.sendRaw("/usercamera/Saturation", "f", [clamped]);
  }

  /**
   * Sets Green Screen Lightness (0-50).
   */
  async setGreenScreenLightness(value: number) {
    const clamped = Math.min(50.0, Math.max(0.0, value));
    return this.client.sendRaw("/usercamera/Lightness", "f", [clamped]);
  }

  /**
   * Sets Look-At-Me X Offset (-25 to 25).
   */
  async setLookAtMeX(value: number) {
    const clamped = Math.min(25.0, Math.max(-25.0, value));
    return this.client.sendRaw("/usercamera/LookAtMeXOffset", "f", [clamped]);
  }

  /**
   * Sets Look-At-Me Y Offset (-25 to 25).
   */
  async setLookAtMeY(value: number) {
    const clamped = Math.min(25.0, Math.max(-25.0, value));
    return this.client.sendRaw("/usercamera/LookAtMeYOffset", "f", [clamped]);
  }

  /**
   * Sets Drone Fly Speed.
   * VRChat Range: 0.1 - 15.0
   */
  async setFlySpeed(value: number) {
    const clamped = Math.min(15.0, Math.max(0.1, value));
    return this.client.sendRaw("/usercamera/FlySpeed", "f", [clamped]);
  }

  /**
   * Sets Drone Turn Speed.
   * VRChat Range: 0.1 - 5.0
   */
  async setTurnSpeed(value: number) {
    const clamped = Math.min(5.0, Math.max(0.1, value));
    return this.client.sendRaw("/usercamera/TurnSpeed", "f", [clamped]);
  }

  /**
   * Helper: Sets Green Screen Key (Hue, Sat, Lit) safely.
   * Order: Enable -> Set Values.
   * Warns if Lightness > 50 (Official limit).
   */
  async setGreenScreenKey(hue: number, sat: number, lit: number) {
    // 1. Validate & Clamp
    let safeLit = lit;
    if (lit > 50) {
      console.warn(`[VRChat] WARN: GreenScreen Lightness > 50 clamped to 50 (Official Limit)`);
      safeLit = 50;
    }

    // 2. Enable First (Best practice)
    await this.setGreenScreen(true);

    // 3. Send Values
    await this.setGreenScreenHue(hue);
    await this.setGreenScreenSaturation(sat);
    await this.setGreenScreenLightness(safeLit);
  }

  /**
   * Helper: Sets Look-At-Me Composition (Offsets).
   * Optionally enables Look-At-Me if requested.
   */
  async setLookAtMeComposition(x: number, y: number, enable: boolean = false) {
    if (enable) {
        await this.setLookAtMe(true);
    }
    await this.setLookAtMeX(x);
    await this.setLookAtMeY(y);
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
