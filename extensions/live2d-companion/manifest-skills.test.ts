import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const extensionRoot = path.resolve(import.meta.dirname);

describe("Desktop Companion plugin skills", () => {
  it("bundles the companion operating skill with the plugin", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(extensionRoot, "openclaw.plugin.json"), "utf8"),
    ) as { skills?: string[] };
    const skillText = fs.readFileSync(
      path.join(extensionRoot, "skills", "desktop-companion", "SKILL.md"),
      "utf8",
    );

    expect(manifest.skills).toEqual(["./skills"]);
    expect(skillText).toContain("name: desktop-companion");
    expect(skillText).toContain("user-invocable: false");
    expect(skillText).toContain("control_companion");
    expect(skillText).toContain('"action": "permission"');
    expect(skillText).toContain('"action": "input_snapshot"');
    expect(skillText).toContain('"tts_provider": "voicevox"');
    expect(skillText).toContain("Kasukabe Tsumugi speaker 8");
  });
});
