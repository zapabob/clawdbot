import { describe } from "vitest";
import { installChannelPluginContractSuite } from "../../../../test/helpers/channels/registry-contract-suites.js";
import { ensureBundledChannelPluginsLoaded } from "../bundled.js";
import { getPluginContractRegistry } from "./registry-plugin.js";

await ensureBundledChannelPluginsLoaded();

for (const entry of getPluginContractRegistry()) {
  describe(`${entry.id} plugin contract`, () => {
    installChannelPluginContractSuite({
      plugin: entry.plugin,
    });
  });
}
