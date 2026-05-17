import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const extensionRoot = path.resolve(import.meta.dirname);

describe("Local Voice plugin skills", () => {
  it("bundles the local voice operating skill with the plugin", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(extensionRoot, "openclaw.plugin.json"), "utf8"),
    ) as { skills?: string[] };
    const skillText = fs.readFileSync(
      path.join(extensionRoot, "skills", "local-voice", "SKILL.md"),
      "utf8",
    );

    expect(manifest.skills).toEqual(["./skills"]);
    expect(skillText).toContain("name: local-voice");
    expect(skillText).toContain("user-invocable: false");
    expect(skillText).toContain("/voice-assistant start");
    expect(skillText).toContain("/tts <text>");
    expect(skillText).toContain("Kasukabe Tsumugi");
    expect(skillText).toContain("vvSpeakerId");
    expect(skillText).toContain("speaker id `8`");
  });
});
