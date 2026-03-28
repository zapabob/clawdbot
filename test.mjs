import fs from "fs";
import path from "path";

const entries = [
  "bluebubbles",
  "discord",
  "feishu",
  "imessage",
  "irc",
  "line",
  "mattermost",
  "nextcloud-talk",
  "signal",
  "slack",
  "synology-chat",
  "telegram",
  "zalo",
];

const logMessages = [];
function print(msg) {
  logMessages.push(msg);
}
async function check() {
  for (const id of entries) {
    try {
      const module = await import(`./extensions/${id}/index.ts`);
      const defaultExport = module.default;
      if (!defaultExport || !defaultExport.plugin) {
        print(`ERROR: ${id} missing plugin export!`);
      } else if (!defaultExport.plugin.id) {
        print(`ERROR: ${id} missing id in plugin!`);
      } else {
        print(`OK: ${id}`);
      }
    } catch (e) {
      print(`Failed to load ${id}: ${e.message}`);
    }
  }
}
await check();
fs.writeFileSync("test_out.txt", logMessages.join("\n"));
