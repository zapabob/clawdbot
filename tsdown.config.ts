import type { InputOptions } from "rolldown";
import { defineConfig } from "tsdown";

const env = {
  NODE_ENV: "production",
};

// Suppress Rolldown's INEFFECTIVE_DYNAMIC_IMPORT warning.
// These warnings fire when a module is both statically imported (by discord/line/telegram/etc.)
// and dynamically imported (e.g. slash.ts lazy-loads it). The warning is purely informational:
// bundling behaviour is unchanged, because the static import already pins the module to the
// main chunk. Filtering it keeps the build output clean and predictable.
const inputOptions: InputOptions = {
  onwarn(warning, defaultHandler) {
    if (warning.code === "INEFFECTIVE_DYNAMIC_IMPORT") {
      return;
    }
    defaultHandler(warning);
  },
};

export default defineConfig([
  {
    entry: "src/index.ts",
    env,
    fixedExtension: false,
    platform: "node",
    inputOptions,
  },
  {
    entry: "src/entry.ts",
    env,
    fixedExtension: false,
    platform: "node",
    inputOptions,
  },
  {
    // Ensure this module is bundled as an entry so legacy CLI shims can resolve its exports.
    entry: "src/cli/daemon-cli.ts",
    env,
    fixedExtension: false,
    platform: "node",
    inputOptions,
  },
  {
    entry: "src/infra/warning-filter.ts",
    env,
    fixedExtension: false,
    platform: "node",
    inputOptions,
  },
  {
    entry: "src/plugin-sdk/index.ts",
    outDir: "dist/plugin-sdk",
    env,
    fixedExtension: false,
    platform: "node",
    inputOptions,
  },
  {
    entry: "src/plugin-sdk/account-id.ts",
    outDir: "dist/plugin-sdk",
    env,
    fixedExtension: false,
    platform: "node",
    inputOptions,
  },
  {
    entry: "src/extensionAPI.ts",
    env,
    fixedExtension: false,
    platform: "node",
    inputOptions,
  },
  {
    entry: ["src/hooks/bundled/*/handler.ts", "src/hooks/llm-slug-generator.ts"],
    env,
    fixedExtension: false,
    platform: "node",
    inputOptions,
  },
]);
