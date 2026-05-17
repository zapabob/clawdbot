import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const extensionRoot = path.resolve(import.meta.dirname);

describe("Hypura Harness plugin skills", () => {
  it("bundles the harness operating skills with the plugin", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(extensionRoot, "openclaw.plugin.json"), "utf8"),
    ) as { skills?: string[] };
    const skillText = fs.readFileSync(
      path.join(extensionRoot, "skills", "voice-io", "SKILL.md"),
      "utf8",
    );
    const vrchatSkillText = fs.readFileSync(
      path.join(extensionRoot, "skills", "vrchat-existing-avatar", "SKILL.md"),
      "utf8",
    );
    const companion3dSkillText = fs.readFileSync(
      path.join(extensionRoot, "skills", "desktop-companion-3d", "SKILL.md"),
      "utf8",
    );
    const channelReadinessSkillText = fs.readFileSync(
      path.join(extensionRoot, "skills", "channel-readiness", "SKILL.md"),
      "utf8",
    );

    expect(manifest.skills).toEqual(["./skills"]);
    expect(skillText).toContain("name: hypura-voice-io");
    expect(skillText).toContain("user-invocable: false");
    expect(skillText).toContain("hypura_harness_companion");
    expect(skillText).toContain('"action": "permission"');
    expect(skillText).toContain("nested `micResult.ok=false`");
    expect(skillText).toContain('"tts_provider": "voicevox"');
    expect(skillText).toContain("Kasukabe Tsumugi speaker 8");
    expect(vrchatSkillText).toContain("name: hypura-vrchat-existing-avatar");
    expect(vrchatSkillText).toContain("hypura_harness_vrc_status");
    expect(vrchatSkillText).toContain("approved: false");
    expect(companion3dSkillText).toContain("name: hypura-desktop-companion-3d");
    expect(companion3dSkillText).toContain("hypura_harness_companion3d_load_model");
    expect(companion3dSkillText).toContain("Remote URLs are rejected");
    expect(channelReadinessSkillText).toContain("name: hypura-channel-readiness");
    expect(channelReadinessSkillText).toContain("hypura_harness_channel_readiness");
    expect(channelReadinessSkillText).toContain("liveRoundtripReady");
  });
});
