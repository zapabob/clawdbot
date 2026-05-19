import { describe, expect, it } from "vitest";
import { createSetupTranslator } from "./setup-i18n.js";

describe("setup-i18n", () => {
  it("exports a setup translator factory", () => {
    const t = createSetupTranslator();
    expect(typeof t).toBe("function");
    expect(t("wizard.channels.docs", { link: "https://example.com" })).toContain(
      "https://example.com",
    );
  });
});
