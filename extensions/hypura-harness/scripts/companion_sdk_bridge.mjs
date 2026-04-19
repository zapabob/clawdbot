import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

async function loadCompanionSdk() {
  try {
    return await import("openclaw/plugin-sdk/live2d-companion");
  } catch {
    return await import(
      pathToFileURL(path.join(repoRoot, "src/plugin-sdk/live2d-companion.js")).href
    );
  }
}

function resolveStateDir(rawStateDir) {
  const stateDir =
    typeof rawStateDir === "string" && rawStateDir.trim() ? rawStateDir : ".openclaw-desktop";
  return path.resolve(repoRoot, stateDir);
}

async function main() {
  const sdk = await loadCompanionSdk();
  const raw = await readStdin();
  const request = raw ? JSON.parse(raw) : {};
  const stateDir = resolveStateDir(request.stateDir);

  if (request.avatarCommand && typeof request.avatarCommand === "object") {
    await sdk.setCompanionAvatarCommand({
      stateDir,
      avatarCommand: request.avatarCommand,
    });
  }

  if (typeof request.text === "string" && request.text.trim()) {
    await sdk.speakWithCompanion({
      stateDir,
      text: request.text.trim(),
    });
  }

  process.stdout.write(
    JSON.stringify({
      ok: true,
      stateDir,
    }),
  );
}

void main().catch((error) => {
  process.stderr.write(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
