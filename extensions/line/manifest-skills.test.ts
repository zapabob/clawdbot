import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const extensionRoot = path.resolve(import.meta.dirname);

describe("LINE plugin skills", () => {
  it("bundles the channel operating skill with the plugin", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(extensionRoot, "openclaw.plugin.json"), "utf8"),
    ) as { skills?: string[] };
    const skillText = fs.readFileSync(
      path.join(extensionRoot, "skills", "line-channel", "SKILL.md"),
      "utf8",
    );

    expect(manifest.skills).toEqual(["./skills"]);
    expect(skillText).toContain("name: line-channel");
    expect(skillText).toContain("user-invocable: false");
    expect(skillText).toContain("openclaw channels status line");
    expect(skillText).toContain("Recipient and roundtrip handling");
    expect(skillText).toContain("line:user:<userId>");
    expect(skillText).toContain("Credential and webhook tests prove setup");
    expect(skillText).toContain("extensions/line/src/gateway.lifecycle.test.ts");
  });
});
