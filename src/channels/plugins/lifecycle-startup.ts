import type { OpenClawConfig } from "../../config/config.js";
import { isChannelConfigured } from "../../config/channel-configured.js";
import { listChannelPlugins } from "./registry.js";

type ChannelStartupLogger = {
  info?: (message: string) => void;
  warn?: (message: string) => void;
};

export async function runChannelPluginStartupMaintenance(params: {
  cfg: OpenClawConfig;
  env?: NodeJS.ProcessEnv;
  log: ChannelStartupLogger;
  trigger?: string;
  logPrefix?: string;
}): Promise<void> {
  const env = params.env ?? process.env;
  for (const plugin of listChannelPlugins()) {
    const runStartupMaintenance = plugin.lifecycle?.runStartupMaintenance;
    if (!runStartupMaintenance) {
      continue;
    }
    if (!isChannelConfigured(params.cfg, plugin.id, env)) {
      continue;
    }
    try {
      await runStartupMaintenance(params);
    } catch (err) {
      params.log.warn?.(
        `${params.logPrefix?.trim() || "gateway"}: ${plugin.id} startup maintenance failed; continuing: ${String(err)}`,
      );
    }
  }
}
