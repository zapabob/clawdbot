import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { migrateAcpxLegacyConfig } from "./config-api.js";

export default definePluginEntry({
  id: "acpx",
  name: "ACPX Setup",
  description: "Lightweight ACPX setup hooks",
  register(api) {
    api.registerConfigMigration((config) => migrateAcpxLegacyConfig(config));
    api.registerAutoEnableProbe(({ config }) => {
      const backendRaw =
        typeof config.acp?.backend === "string" ? config.acp.backend.trim().toLowerCase() : "";
      const configured =
        config.acp?.enabled === true ||
        config.acp?.dispatch?.enabled === true ||
        backendRaw === "acpx";
      return configured && (!backendRaw || backendRaw === "acpx") ? "ACP runtime configured" : null;
    });
  },
});
