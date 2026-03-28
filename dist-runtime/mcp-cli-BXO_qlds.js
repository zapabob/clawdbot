import "./io-BeL7sW7Y.js";
import "./paths-Chd_ukvM.js";
import "./globals-BKVgh_pY.js";
import "./theme-CWrxY1-_.js";
import "./utils-DGUUVa38.js";
import { t as parseConfigValue } from "./config-value-CRmbuyqk.js";
import "./ansi-D3lUajt1.js";
import "./agent-scope-BIySJgkJ.js";
import "./file-identity-DgWfjfnD.js";
import "./boundary-file-read-DZTg2Wyt.js";
import "./logger-BsvC8P6f.js";
import "./exec-CbOKTdtq.js";
import "./registry-B5KsIQB2.js";
import "./boolean-CsNbQKvJ.js";
import "./env-C-KVzFmc.js";
import "./shell-env-BOjFl6MZ.js";
import "./config-state-CGV1IKLE.js";
import "./version-yfoo3YbF.js";
import "./min-host-version-DM6er2ZX.js";
import "./manifest-registry-CMy5XLiN.js";
import "./runtime-guard-WQAOpX6v.js";
import "./safe-text-CpFY0TZg.js";
import "./model-selection-CNzhkJya.js";
import "./env-substitution-X9lTyhgh.js";
import "./network-mode-JwypQ_rG.js";
import "./ip-CWtG939A.js";
import {
  i as unsetConfiguredMcpServer,
  r as setConfiguredMcpServer,
  t as listConfiguredMcpServers,
} from "./mcp-config-Dbre4f6_.js";
import { l as defaultRuntime } from "./subsystem-BZRyMoTO.js";
//#region src/cli/mcp-cli.ts
function fail(message) {
  defaultRuntime.error(message);
  defaultRuntime.exit(1);
  throw new Error(message);
}
function printJson(value) {
  defaultRuntime.writeJson(value);
}
function registerMcpCli(program) {
  const mcp = program.command("mcp").description("Manage OpenClaw MCP server config");
  mcp
    .command("list")
    .description("List configured MCP servers")
    .option("--json", "Print JSON")
    .action(async (opts) => {
      const loaded = await listConfiguredMcpServers();
      if (!loaded.ok) fail(loaded.error);
      if (opts.json) {
        printJson(loaded.mcpServers);
        return;
      }
      const names = Object.keys(loaded.mcpServers).toSorted();
      if (names.length === 0) {
        defaultRuntime.log(`No MCP servers configured in ${loaded.path}.`);
        return;
      }
      defaultRuntime.log(`MCP servers (${loaded.path}):`);
      for (const name of names) defaultRuntime.log(`- ${name}`);
    });
  mcp
    .command("show")
    .description("Show one configured MCP server or the full MCP config")
    .argument("[name]", "MCP server name")
    .option("--json", "Print JSON")
    .action(async (name, opts) => {
      const loaded = await listConfiguredMcpServers();
      if (!loaded.ok) fail(loaded.error);
      const value = name ? loaded.mcpServers[name] : loaded.mcpServers;
      if (name && !value) fail(`No MCP server named "${name}" in ${loaded.path}.`);
      if (opts.json) {
        printJson(value ?? {});
        return;
      }
      if (name) defaultRuntime.log(`MCP server "${name}" (${loaded.path}):`);
      else defaultRuntime.log(`MCP servers (${loaded.path}):`);
      printJson(value ?? {});
    });
  mcp
    .command("set")
    .description("Set one configured MCP server from a JSON object")
    .argument("<name>", "MCP server name")
    .argument("<value>", 'JSON object, for example {"command":"uvx","args":["context7-mcp"]}')
    .action(async (name, rawValue) => {
      const parsed = parseConfigValue(rawValue);
      if (parsed.error) fail(parsed.error);
      const result = await setConfiguredMcpServer({
        name,
        server: parsed.value,
      });
      if (!result.ok) fail(result.error);
      defaultRuntime.log(`Saved MCP server "${name}" to ${result.path}.`);
    });
  mcp
    .command("unset")
    .description("Remove one configured MCP server")
    .argument("<name>", "MCP server name")
    .action(async (name) => {
      const result = await unsetConfiguredMcpServer({ name });
      if (!result.ok) fail(result.error);
      if (!result.removed) fail(`No MCP server named "${name}" in ${result.path}.`);
      defaultRuntime.log(`Removed MCP server "${name}" from ${result.path}.`);
    });
}
//#endregion
export { registerMcpCli };
