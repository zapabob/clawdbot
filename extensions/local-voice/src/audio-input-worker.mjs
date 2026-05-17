import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const TARGET_SAMPLE_RATE = 8_000;
const MU_LAW_BIAS = 0x84;
const MU_LAW_CLIP = 32_635;

function writeMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function writeError(message) {
  writeMessage({ type: "error", message });
}

function selectInputDevices(devices) {
  const inputDevices = devices.filter((device) => device.maxInputChannels > 0);
  const seen = new Set();
  const addUnique = (device) => {
    if (!device || seen.has(device.id)) {
      return [];
    }
    seen.add(device.id);
    return [device];
  };
  const micPattern = /mic|microphone|\u30de\u30a4\u30af/i;
  return [
    ...addUnique(
      inputDevices.find(
        (device) => device.hostAPIName === "Windows WASAPI" && micPattern.test(device.name),
      ),
    ),
    ...inputDevices.flatMap((device) =>
      addUnique(micPattern.test(device.name) ? device : undefined),
    ),
    ...inputDevices.flatMap((device) => addUnique(device)),
  ];
}

function linear16ToMuLaw(sample) {
  const sign = sample < 0 ? 0x80 : 0;
  let magnitude = Math.min(Math.abs(sample), MU_LAW_CLIP) + MU_LAW_BIAS;
  let exponent = 7;

  for (let mask = 0x4000; exponent > 0 && (magnitude & mask) === 0; mask >>= 1) {
    exponent -= 1;
  }

  const mantissa = (magnitude >> (exponent + 3)) & 0x0f;
  return ~(sign | (exponent << 4) | mantissa) & 0xff;
}

function pcm16LeToMuLaw(chunk) {
  const sampleCount = Math.floor(chunk.length / 2);
  const encoded = Buffer.allocUnsafe(sampleCount);
  for (let index = 0; index < sampleCount; index += 1) {
    encoded[index] = linear16ToMuLaw(chunk.readInt16LE(index * 2));
  }
  return encoded;
}

function downsamplePcm16Le(chunk, sourceSampleRate) {
  if (sourceSampleRate === TARGET_SAMPLE_RATE) {
    return chunk;
  }

  const sourceSampleCount = Math.floor(chunk.length / 2);
  if (sourceSampleCount === 0) {
    return Buffer.alloc(0);
  }

  const ratio = sourceSampleRate / TARGET_SAMPLE_RATE;
  const targetSampleCount = Math.max(1, Math.floor(sourceSampleCount / ratio));
  const output = Buffer.allocUnsafe(targetSampleCount * 2);

  for (let targetIndex = 0; targetIndex < targetSampleCount; targetIndex += 1) {
    const sourceIndex = Math.min(sourceSampleCount - 1, Math.floor(targetIndex * ratio));
    output.writeInt16LE(chunk.readInt16LE(sourceIndex * 2), targetIndex * 2);
  }

  return output;
}

function encodeChunk(chunk, sourceSampleRate) {
  const evenChunk = chunk.length % 2 === 0 ? chunk : chunk.subarray(0, chunk.length - 1);
  if (evenChunk.length === 0) {
    return null;
  }
  return pcm16LeToMuLaw(downsamplePcm16Le(evenChunk, sourceSampleRate));
}

function stopStream(stream) {
  if (!stream) {
    return;
  }
  try {
    stream.quit();
  } catch {
    try {
      stream.abort();
    } catch {}
  }
}

function main() {
  let naudiodon;
  try {
    naudiodon = require("naudiodon");
  } catch (error) {
    writeError(
      `Unable to load native audio input runtime in worker: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    process.exitCode = 1;
    return;
  }

  const selectedDevices = selectInputDevices(naudiodon.getDevices());
  if (process.argv.includes("--probe")) {
    writeMessage({
      type: "probe",
      inputDevices: selectedDevices.map((device) => ({
        id: device.id,
        name: device.name,
        hostAPIName: device.hostAPIName,
      })),
    });
    return;
  }

  if (process.argv.includes("--probe-start")) {
    let lastError = null;
    for (const selectedDevice of selectedDevices) {
      let probeStream = null;
      try {
        const sampleRate = Number(selectedDevice.defaultSampleRate) || TARGET_SAMPLE_RATE;
        probeStream = naudiodon.AudioIO({
          inOptions: {
            deviceId: selectedDevice.id,
            channelCount: 1,
            framesPerBuffer: Math.max(160, Math.round(sampleRate * 0.02)),
            sampleFormat: naudiodon.SampleFormat16Bit,
            sampleRate,
          },
        });
        probeStream.start();
        stopStream(probeStream);
        writeMessage({
          type: "ready",
          device: {
            id: selectedDevice.id,
            name: selectedDevice.name,
            hostAPIName: selectedDevice.hostAPIName,
          },
        });
        return;
      } catch (error) {
        lastError = `Failed to start input device "${selectedDevice.name}" (${selectedDevice.hostAPIName}): ${
          error instanceof Error ? error.message : String(error)
        }`;
        stopStream(probeStream);
      }
    }
    writeError(lastError ?? "Unable to start microphone capture");
    process.exitCode = 1;
    return;
  }

  if (selectedDevices.length === 0) {
    writeError("No audio input device is available");
    process.exitCode = 1;
    return;
  }

  let stream = null;
  let lastError = null;
  for (const selectedDevice of selectedDevices) {
    try {
      const sampleRate = Number(selectedDevice.defaultSampleRate) || TARGET_SAMPLE_RATE;
      stream = naudiodon.AudioIO({
        inOptions: {
          deviceId: selectedDevice.id,
          channelCount: 1,
          framesPerBuffer: Math.max(160, Math.round(sampleRate * 0.02)),
          sampleFormat: naudiodon.SampleFormat16Bit,
          sampleRate,
        },
      });
      stream.on("data", (chunk) => {
        const encoded = encodeChunk(chunk, sampleRate);
        if (encoded) {
          writeMessage({ type: "data", chunk: encoded.toString("base64") });
        }
      });
      stream.on("error", (error) => {
        writeError(`Audio input stream emitted an error: ${error.message}`);
        stopStream(stream);
        process.exit(1);
      });
      stream.start();
      writeMessage({
        type: "ready",
        device: {
          id: selectedDevice.id,
          name: selectedDevice.name,
          hostAPIName: selectedDevice.hostAPIName,
        },
      });
      break;
    } catch (error) {
      lastError = `Failed to start input device "${selectedDevice.name}" (${selectedDevice.hostAPIName}): ${
        error instanceof Error ? error.message : String(error)
      }`;
      stopStream(stream);
      stream = null;
    }
  }

  if (!stream) {
    writeError(lastError ?? "Unable to start microphone capture");
    process.exitCode = 1;
    return;
  }

  const cleanup = () => {
    stopStream(stream);
    stream = null;
  };

  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
}

main();
