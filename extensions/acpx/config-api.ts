import type { OpenClawConfig } from "openclaw/plugin-sdk/plugin-entry";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function migrateAcpxLegacyConfig(config: OpenClawConfig): {
  config: OpenClawConfig;
  changes: string[];
} | null {
  const rawAcpxConfig = config.plugins?.entries?.acpx?.config;
  if (!isRecord(rawAcpxConfig)) {
    return null;
  }
  if (!Object.prototype.hasOwnProperty.call(rawAcpxConfig, "codexHarness")) {
    return null;
  }

  const { codexHarness: _legacyCodexHarness, ...nextAcpxConfig } = rawAcpxConfig;
  const plugins = structuredClone(config.plugins ?? {});
  const entries = { ...plugins.entries };
  const existingAcpxEntry = isRecord(entries.acpx) ? (entries.acpx as Record<string, unknown>) : {};
  entries.acpx = {
    ...existingAcpxEntry,
    config: nextAcpxConfig,
  };
  plugins.entries = entries;

  return {
    config: {
      ...config,
      plugins,
    },
    changes: ["Removed plugins.entries.acpx.config.codexHarness (legacy ACPX compatibility flag)."],
  };
}
