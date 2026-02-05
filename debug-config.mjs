import { loadConfig, readConfigFileSnapshot } from "./dist/config/config.js";

const cfg = loadConfig();
console.log("loadConfig result:");
console.log(JSON.stringify(cfg, null, 2));

const snapshot = await readConfigFileSnapshot();
console.log("\nsnapshot exists:", snapshot?.exists);
console.log("snapshot parsed:", JSON.stringify(snapshot?.parsed, null, 2));
