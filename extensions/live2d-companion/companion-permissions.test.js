import { describe, expect, it } from "vitest";
import { createCompanionPermissionState, isCompanionPermissionGranted, setCompanionPermission, } from "./companion-permissions.js";
describe("companion permissions", () => {
    it("defaults every capability to denied until approved", () => {
        const state = createCompanionPermissionState({
            mic: "deny-until-approved",
            camera: "deny-until-approved",
            screen: "deny-until-approved",
            "tab-follow": "deny-until-approved",
        }, 100);
        expect(state.mic.decision).toBe("denied");
        expect(state.camera.decision).toBe("denied");
        expect(state.screen.decision).toBe("denied");
        expect(state["tab-follow"].decision).toBe("denied");
        expect(isCompanionPermissionGranted(state, "mic")).toBe(false);
    });
    it("tracks explicit grants and denials with source metadata", () => {
        const initial = createCompanionPermissionState({
            mic: "deny-until-approved",
            camera: "deny-until-approved",
            screen: "granted",
            "tab-follow": "deny-until-approved",
        }, 10);
        const granted = setCompanionPermission(initial, "mic", "granted", "user", 20);
        const helperUpdated = setCompanionPermission(granted, "tab-follow", "granted", "helper", 30);
        expect(initial.screen.decision).toBe("granted");
        expect(helperUpdated.mic).toMatchObject({
            capability: "mic",
            decision: "granted",
            source: "user",
            updatedAt: 20,
        });
        expect(helperUpdated["tab-follow"]).toMatchObject({
            capability: "tab-follow",
            decision: "granted",
            source: "helper",
            updatedAt: 30,
        });
        expect(isCompanionPermissionGranted(helperUpdated, "tab-follow")).toBe(true);
    });
});
