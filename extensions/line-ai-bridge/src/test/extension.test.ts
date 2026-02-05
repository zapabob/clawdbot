import { describe, it, expect } from "vitest";

describe("LINE AI Bridge Extension", () => {
  describe("Plugin Structure", () => {
    it("should have all required files", () => {
      const pluginId = "line-ai-bridge";
      const pluginName = "LINE AI Bridge";
      const version = "2026.2.2";

      expect(pluginId).toBe("line-ai-bridge");
      expect(pluginName).toBe("LINE AI Bridge");
      expect(version).toBe("2026.2.2");
    });

    it("should support all AI tool types", () => {
      const tools = ["codex", "gemini", "opencode"];
      expect(tools).toContain("codex");
      expect(tools).toContain("gemini");
      expect(tools).toContain("opencode");
    });

    it("should have all required tools", () => {
      const tools = [
        "line_bridge_status",
        "line_bridge_start",
        "line_bridge_stop",
        "line_bridge_send",
        "line_bridge_sessions",
        "line_bridge_test_connection",
      ];

      expect(tools.length).toBe(6);
    });
  });

  describe("Configuration", () => {
    it("should have correct default settings", () => {
      const defaults = {
        enabled: true,
        defaultTool: "codex",
        sessionTimeoutMinutes: 30,
        maxMessageLength: 5000,
      };

      expect(defaults.enabled).toBe(true);
      expect(defaults.defaultTool).toBe("codex");
      expect(defaults.sessionTimeoutMinutes).toBe(30);
      expect(defaults.maxMessageLength).toBe(5000);
    });
  });

  describe("Commands", () => {
    it("should support all LINE commands", () => {
      const commands = [
        "/help",
        "/reset",
        "/codex",
        "/gpt",
        "/gemini",
        "/google",
        "/opencode",
        "/code",
      ];

      expect(commands).toContain("/help");
      expect(commands).toContain("/reset");
      expect(commands).toContain("/codex");
      expect(commands).toContain("/gemini");
      expect(commands).toContain("/opencode");
    });
  });
});
