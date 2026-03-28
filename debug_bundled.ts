import { GENERATED_BUNDLED_CHANNEL_ENTRIES } from "./src/generated/bundled-channel-entries.generated.js";
for (const entry of GENERATED_BUNDLED_CHANNEL_ENTRIES) {
  if (!entry.entry?.channelPlugin) {
    console.error("Missing channelPlugin in:", entry.id);
  }
}
console.log("Check complete.");
