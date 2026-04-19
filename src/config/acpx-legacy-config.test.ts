import { describe, expect, it } from "vitest";
import { readConfigFileSnapshot } from "./config.js";
import { withTempHome, writeOpenClawConfig } from "./test-helpers.js";

describe("ACPX legacy plugin config", () => {
  it("accepts legacy codexHarness via setup migration and reports legacyIssues", async () => {
    await withTempHome(async (home) => {
      await writeOpenClawConfig(home, {
        plugins: {
          entries: {
            acpx: {
              enabled: true,
              config: {
                permissionMode: "approve-all",
                nonInteractivePermissions: "fail",
                codexHarness: true,
              },
            },
          },
        },
      });

      const snap = await readConfigFileSnapshot();

      expect(snap.valid).toBe(true);
      expect(
        snap.legacyIssues.some(
          (issue) => issue.path === "plugins.entries.acpx.config.codexHarness",
        ),
      ).toBe(true);
      const acpxConfig = (
        snap.sourceConfig.plugins?.entries as
          | Record<string, { config?: Record<string, unknown> }>
          | undefined
      )?.acpx?.config;
      expect(acpxConfig).toEqual({
        permissionMode: "approve-all",
        nonInteractivePermissions: "fail",
      });
    });
  });
});
