import { describe, expect, it, vi } from "vitest";
import { createAvatarController, inferAvatarType } from "./avatar-factory.js";

vi.mock("./vrm-controller.js", () => ({
  VrmController: class {
    readonly avatarType = "vrm" as const;
  },
}));

vi.mock("./fbx-controller.js", () => ({
  FbxController: class {
    readonly avatarType = "fbx" as const;
  },
}));

vi.mock("./live2d-controller.js", () => ({
  Live2DController: class {
    readonly avatarType = "live2d" as const;
  },
}));

describe("Desktop Companion avatar factory", () => {
  it("infers VRM and FBX as the preferred local 3D formats", () => {
    expect(inferAvatarType("C:/avatars/Hakua.VRM")).toBe("vrm");
    expect(inferAvatarType("assets/NFD/Hakua/FBX/FBX/Hakua.fbx")).toBe("fbx");
  });

  it("keeps Live2D available only when a Live2D model is explicit", () => {
    expect(inferAvatarType("models/hakua.model3.json")).toBe("live2d");
    expect(inferAvatarType("models/legacy.model.json")).toBe("live2d");
  });

  it("falls back to VRM for auto or unknown avatar paths", async () => {
    expect(inferAvatarType("avatar-without-known-extension")).toBe("vrm");

    await expect(createAvatarController("auto")).resolves.toMatchObject({
      avatarType: "vrm",
    });
  });
});
