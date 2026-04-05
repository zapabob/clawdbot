import { describe, expect, it } from "vitest";
import { rewriteBundledDistRuntimePathToDist } from "./bundled-dist-runtime-path.js";

describe("rewriteBundledDistRuntimePathToDist", () => {
  it("rewrites dist-runtime to dist with backslashes", () => {
    expect(
      rewriteBundledDistRuntimePathToDist(
        String.raw`C:\repo\dist-runtime\extensions\telegram\index.js`,
      ),
    ).toBe(String.raw`C:\repo\dist\extensions\telegram\index.js`);
  });

  it("rewrites dist-runtime to dist with forward slashes", () => {
    expect(
      rewriteBundledDistRuntimePathToDist("C:/repo/dist-runtime/extensions/telegram/index.js"),
    ).toBe("C:/repo/dist/extensions/telegram/index.js");
  });

  it("rewrites mixed separators on Windows-style roots", () => {
    expect(
      rewriteBundledDistRuntimePathToDist(String.raw`C:\repo/dist-runtime\extensions/x/index.js`),
    ).toBe(String.raw`C:\repo/dist\extensions/x/index.js`);
  });

  it("is a no-op when dist-runtime is absent", () => {
    expect(
      rewriteBundledDistRuntimePathToDist(String.raw`C:\repo\dist\extensions\telegram\index.js`),
    ).toBe(String.raw`C:\repo\dist\extensions\telegram\index.js`);
  });
});
