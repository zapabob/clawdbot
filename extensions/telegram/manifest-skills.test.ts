import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const extensionRoot = path.resolve(import.meta.dirname);

describe("Telegram plugin skills", () => {
  it("bundles the channel operating skill with the plugin", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(extensionRoot, "openclaw.plugin.json"), "utf8"),
    ) as { skills?: string[] };
    const skillText = fs.readFileSync(
      path.join(extensionRoot, "skills", "telegram-channel", "SKILL.md"),
      "utf8",
    );

    expect(manifest.skills).toEqual(["./skills"]);
    expect(skillText).toContain("name: telegram-channel");
    expect(skillText).toContain("user-invocable: false");
    expect(skillText).toContain("openclaw channels status telegram");
    expect(skillText).toContain("Target and roundtrip handling");
    expect(skillText).toContain(
      "A complete live proof is credential probe plus one inbound update",
    );
    expect(skillText).toContain("requireMention");
    expect(skillText).toContain("extensions/telegram/src/webhook-status.test.ts");
  });
});
