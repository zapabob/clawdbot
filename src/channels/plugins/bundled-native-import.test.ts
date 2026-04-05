import path from "node:path";
import { describe, expect, it } from "vitest";
import { shouldUseNativeImportForBundledChannelEntry } from "./bundled.js";

describe("shouldUseNativeImportForBundledChannelEntry", () => {
  it("is true for dist/extensions channel-entry.js (Windows separators)", () => {
    const abs = path.join("C:", "repo", "dist", "extensions", "telegram", "channel-entry.js");
    expect(shouldUseNativeImportForBundledChannelEntry(abs)).toBe(true);
  });

  it("is true for .mjs under dist/extensions with mixed slashes", () => {
    const abs = "D:/build/dist\\extensions/matrix/channel-entry.mjs";
    expect(shouldUseNativeImportForBundledChannelEntry(abs)).toBe(true);
  });

  it("is false for TypeScript sources", () => {
    const abs = path.join("C:", "repo", "extensions", "telegram", "channel-entry.ts");
    expect(shouldUseNativeImportForBundledChannelEntry(abs)).toBe(false);
  });

  it("is false when path is not under dist/extensions", () => {
    const abs = path.join("C:", "repo", "dist", "entry.js");
    expect(shouldUseNativeImportForBundledChannelEntry(abs)).toBe(false);
  });

  it("is false for dist-runtime shims even if named .js", () => {
    const abs = path.join("C:", "repo", "dist-runtime", "extensions", "x", "channel-entry.js");
    expect(shouldUseNativeImportForBundledChannelEntry(abs)).toBe(false);
  });
});
