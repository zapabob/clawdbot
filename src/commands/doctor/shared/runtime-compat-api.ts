import { isDeepStrictEqual } from "node:util";
import type { OpenClawConfig } from "../../../config/types.openclaw.js";
import { applyLegacyDoctorMigrations } from "./legacy-config-compat.js";
import { normalizeRuntimeCompatibilityConfigValues } from "./legacy-config-runtime-migrate.js";
import { applyPluginDoctorCompatibilityMigrations } from "../../../plugins/doctor-contract-registry.js";

export function applyRuntimeLegacyConfigMigrations(raw: unknown): {
  next: Record<string, unknown> | null;
  changes: string[];
} {
  if (!raw || typeof raw !== "object") {
    return { next: null, changes: [] };
  }

  const original = raw as Record<string, unknown>;
  const migrated = applyLegacyDoctorMigrations(original);
  const base = (migrated.next ?? original) as OpenClawConfig;
  const pluginIds = Object.keys(base.plugins?.entries ?? {});
  const pluginNormalized = applyPluginDoctorCompatibilityMigrations(base, {
    pluginIds,
  });
  const normalized = normalizeRuntimeCompatibilityConfigValues(pluginNormalized.config);
  const next = normalized.config as OpenClawConfig & Record<string, unknown>;
  const changes = [...migrated.changes, ...pluginNormalized.changes, ...normalized.changes];

  if (changes.length === 0 || isDeepStrictEqual(next, original)) {
    return { next: null, changes: [] };
  }
  return { next, changes };
}
