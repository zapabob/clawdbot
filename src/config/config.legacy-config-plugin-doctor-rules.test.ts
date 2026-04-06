import { describe, expect, it } from "vitest";
import { validateConfigObject } from "./validation.js";

describe("legacy config detection via plugin doctor contracts", () => {
  it("detects mattermost allowPrivateNetwork legacy alias via contract rules", () => {
    const result = validateConfigObject({
      channels: {
        mattermost: {
          allowPrivateNetwork: true,
        },
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path === "channels.mattermost")).toBe(true);
      expect(
        result.issues.some((issue) =>
          issue.message.includes("channels.mattermost.allowPrivateNetwork is legacy"),
        ),
      ).toBe(true);
    }
  });
});
