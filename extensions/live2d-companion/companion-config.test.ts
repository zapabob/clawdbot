import { describe, expect, it } from "vitest";
import { resolveLive2dCompanionConfig } from "./companion-config.js";
import {
  createCompanionPermissionState,
  isCompanionPermissionGranted,
  setCompanionPermission,
} from "./companion-permissions.js";

describe("resolveLive2dCompanionConfig", () => {
  it("defaults to strict local-only settings", () => {
    const config = resolveLive2dCompanionConfig({});

    expect(config.security.mode).toBe("local-only");
    expect(config.security.allowLegacyHttpControl).toBe(false);
    expect(config.security.allowLegacyFlagTransport).toBe(false);
    expect(config.capturePolicy.mic).toBe("deny-until-approved");
    expect(config.browserHelper.enabled).toBe(true);
    expect(config.assetPolicy.remoteUploadAllowed).toBe(false);
    expect(config.voice.sttBackend).toBe("local-voice-whisper");
    expect(config.voice.ttsBackend).toBe("voicevox");
  });

  it("detects legacy companionUrl config but normalizes to IPC transport", () => {
    const config = resolveLive2dCompanionConfig({
      llmMirror: {
        enabled: true,
        maxChars: 80,
        companionUrl: "http://127.0.0.1:18791/control",
      },
    });

    expect(config.legacyCompanionUrlDetected).toBe(true);
    expect(config.llmMirror.maxChars).toBe(80);
    expect(config.security.allowLegacyHttpControl).toBe(false);
  });
});

describe("companion permission state", () => {
  it("starts denied and allows explicit grant transitions", () => {
    const defaults = resolveLive2dCompanionConfig({}).capturePolicy;
    const initial = createCompanionPermissionState(defaults, 100);

    expect(isCompanionPermissionGranted(initial, "screen")).toBe(false);

    const updated = setCompanionPermission(initial, "screen", "granted", "user", 200);

    expect(isCompanionPermissionGranted(updated, "screen")).toBe(true);
    expect(updated.screen.source).toBe("user");
    expect(updated.screen.updatedAt).toBe(200);
  });
});
