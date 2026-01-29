
import { loadConfig } from "../src/config/config.js";
import { resolveAgentWorkspaceDir, resolveDefaultAgentId } from "../src/agents/agent-scope.js";
import { loadMoltbotPlugins } from "../src/plugins/loader.js";
import { buildConfigSchema } from "../src/config/schema.js";
import { listChannelPlugins } from "../src/channels/plugins/index.js";

async function main() {
  console.log("Loading config...");
  const cfg = loadConfig();
  const workspaceDir = resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg));
  
  console.log("Loading plugins...");
  const pluginRegistry = loadMoltbotPlugins({
    config: cfg,
    workspaceDir,
    // Use a dummy logger to avoid noise
    logger: {
      info: (msg) => console.log(`[INFO] ${msg}`),
      warn: (msg) => console.log(`[WARN] ${msg}`),
      error: (msg) => console.error(`[ERROR] ${msg}`),
      debug: (msg) => {},
    },
  });

  console.log("Loaded plugins:", pluginRegistry.plugins.map(p => p.id));
  
  const channelPlugins = listChannelPlugins();
  console.log("Channel plugins:", channelPlugins.map(p => p.id));

  console.log("Building schema...");
  const schemaResponse = buildConfigSchema({
    plugins: pluginRegistry.plugins.map((plugin) => ({
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
      configUiHints: plugin.configUiHints,
      configSchema: plugin.configJsonSchema,
    })),
    channels: channelPlugins.map((entry) => ({
      id: entry.id,
      label: entry.meta.label,
      description: entry.meta.blurb,
      configSchema: entry.configSchema?.schema,
      configUiHints: entry.configSchema?.uiHints,
    })),
  });

  const schema = schemaResponse.schema;
  // @ts-ignore
  const channels = schema.properties?.channels;
  
  // @ts-ignore
  const line = channels?.properties?.line;

  if (line) {
    console.log("SUCCESS: channels.line exists in schema.");
    console.log(JSON.stringify(line, null, 2));
  } else {
    console.error("FAILURE: channels.line MISSING from schema.");
    if (channels) {
        console.log("Existing channels:", Object.keys(channels.properties || {}));
    }
  }
}

main().catch(console.error);
