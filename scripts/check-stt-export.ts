import { LocalWhisperSTT } from "../extensions/local-voice/src/stt.js";

async function main() {
  console.log("Checking LocalWhisperSTT availability...");
  if (typeof LocalWhisperSTT === "function") {
    console.log("LocalWhisperSTT is exported correctly.");
    const instance = new LocalWhisperSTT({}, { onTranscript: () => {} });
    console.log("Instance created. State:", instance.getState());
  } else {
    console.error("LocalWhisperSTT is NOT a function/class.");
    process.exit(1);
  }
}

main().catch(console.error);
