import { migrateAcpxLegacyConfig } from "./config-api.js";

export const legacyConfigRules = [
  {
    path: ["plugins", "entries", "acpx", "config", "codexHarness"],
    message:
      "plugins.entries.acpx.config.codexHarness is legacy; ACPX ignores it and openclaw doctor --fix will remove it.",
    requireSourceLiteral: true,
  },
];

export function normalizeCompatibilityConfig(params: { cfg: Parameters<typeof migrateAcpxLegacyConfig>[0] }) {
  return migrateAcpxLegacyConfig(params.cfg) ?? { config: params.cfg, changes: [] };
}
