import { describe, expect, it } from "vitest";
import { SECTION_META } from "./config-form.render.ts";

describe("config form section metadata", () => {
  it("uses plugin terminology for the plugin config section", () => {
    expect(SECTION_META.plugins.description).toBe("Plugin management and policy");
    expect(SECTION_META.plugins.description).not.toMatch(/\bextensions?\b/i);
  });
});
