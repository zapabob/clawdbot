import { describe, expect, it } from "vitest";
import { migrateAcpxLegacyConfig } from "./config-api.js";

describe("migrateAcpxLegacyConfig", () => {
  it("removes the legacy codexHarness plugin config key", () => {
    const migration = migrateAcpxLegacyConfig({
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

    expect(migration).not.toBeNull();
    expect(migration?.changes).toEqual([
      "Removed plugins.entries.acpx.config.codexHarness (legacy ACPX compatibility flag).",
    ]);
    expect(migration?.config.plugins?.entries?.acpx?.config).toEqual({
      permissionMode: "approve-all",
      nonInteractivePermissions: "fail",
    });
  });

  it("returns null when codexHarness is absent", () => {
    const migration = migrateAcpxLegacyConfig({
      plugins: {
        entries: {
          acpx: {
            config: {
              permissionMode: "approve-all",
            },
          },
        },
      },
    });

    expect(migration).toBeNull();
  });
});
