import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const upstreamLayoutPath = path.join(repoRoot, "docs", ".generated", "upstream-root-layout.json");
const immutableOverlayPath = path.join(
  repoRoot,
  "docs",
  ".generated",
  "immutable-overlay-files.json",
);

const sanctionedOverlayRoots = new Set([
  ".openclaw-desktop",
  "_artifacts",
  "_docs",
  "_snapshots",
  "identity",
  "memory",
  "logs",
  "state",
  "tests",
  "tmp",
]);

const sanctionedOverlayFiles = new Set([
  ".gitmodules",
  ".cursor",
  ".cursorindexingignore",
  ".env.atlas.example",
  "docker-compose.override.yml",
  "HEARTBEAT.md",
  "IDENTITY.md",
  "MEMORY.md",
  "SOUL.md",
  "TOOLS.md",
  "USER.md",
  "uv.lock",
]);

const sanctionedOverlayPatterns = [
  /^vitest\..+\.(?:ts|mjs)$/,
];

function readJsonFile(filePath, label) {
  return fs
    .readFile(filePath, "utf8")
    .then((raw) => JSON.parse(raw))
    .catch((error) => {
      throw new Error(`Failed to read ${label} at ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    });
}

function getTrackedFiles() {
  const raw = execFileSync("git", ["ls-files", "-z"], {
    cwd: repoRoot,
    encoding: "buffer",
    // Large capture moves can temporarily push the tracked file list well past
    // the default 1 MiB buffer limit on Windows.
    maxBuffer: 64 * 1024 * 1024,
  });
  return raw
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
}

function toRootItem(relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  const slashIndex = normalized.indexOf("/");
  return slashIndex === -1 ? normalized : normalized.slice(0, slashIndex);
}

function computeSha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function verifyImmutableOverlay(immutableOverlay) {
  const errors = [];
  const files = immutableOverlay?.files;
  if (!files || typeof files !== "object" || Array.isArray(files)) {
    throw new Error(`Immutable overlay manifest is invalid: ${immutableOverlayPath}`);
  }
  for (const [relativePath, metadata] of Object.entries(files)) {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      errors.push(`${relativePath}: metadata is invalid.`);
      continue;
    }
    const expectedHash = metadata.sha256;
    const expectedBytes = metadata.bytes;
    if (typeof expectedHash !== "string" || expectedHash.length === 0) {
      errors.push(`${relativePath}: sha256 is missing.`);
      continue;
    }
    if (!Number.isInteger(expectedBytes) || expectedBytes < 0) {
      errors.push(`${relativePath}: bytes is invalid.`);
      continue;
    }
    const absolutePath = path.join(repoRoot, relativePath);
    let buffer;
    try {
      buffer = await fs.readFile(absolutePath);
    } catch (error) {
      errors.push(
        `${relativePath}: missing immutable file (${error instanceof Error ? error.message : String(error)}).`,
      );
      continue;
    }
    const actualHash = computeSha256(buffer);
    if (buffer.byteLength !== expectedBytes || actualHash !== expectedHash) {
      errors.push(
        `${relativePath}: immutable overlay drift detected (expected sha256 ${expectedHash}, bytes ${expectedBytes}; got sha256 ${actualHash}, bytes ${buffer.byteLength}).`,
      );
    }
  }
  return errors;
}

async function main() {
  const [upstreamLayout, immutableOverlay] = await Promise.all([
    readJsonFile(upstreamLayoutPath, "upstream root layout baseline"),
    readJsonFile(immutableOverlayPath, "immutable overlay baseline"),
  ]);
  const officialRoots = new Set(
    Array.isArray(upstreamLayout?.roots)
      ? upstreamLayout.roots.filter((entry) => typeof entry === "string" && entry.length > 0)
      : [],
  );
  if (officialRoots.size === 0) {
    throw new Error(`Upstream root layout baseline is empty: ${upstreamLayoutPath}`);
  }

  const trackedRoots = [...new Set(getTrackedFiles().map(toRootItem))].sort((left, right) =>
    left.localeCompare(right),
  );
  const unexpectedRoots = trackedRoots.filter(
    (root) =>
      !officialRoots.has(root) &&
      !sanctionedOverlayRoots.has(root) &&
      !sanctionedOverlayFiles.has(root) &&
      !sanctionedOverlayPatterns.some((pattern) => pattern.test(root)),
  );

  const errors = [];
  if (unexpectedRoots.length > 0) {
    errors.push(
      `Unexpected tracked root items:\n${unexpectedRoots.map((root) => `  - ${root}`).join("\n")}`,
    );
  }

  const immutableErrors = await verifyImmutableOverlay(immutableOverlay);
  errors.push(...immutableErrors);

  if (errors.length > 0) {
    console.error("Root layout check failed.");
    for (const error of errors) {
      console.error("");
      console.error(error);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Root layout check passed.");
  console.log(`Tracked root items: ${trackedRoots.length}`);
  console.log(`Official baseline roots: ${officialRoots.size}`);
  console.log(
    `Sanctioned overlay roots/files: ${sanctionedOverlayRoots.size + sanctionedOverlayFiles.size}`,
  );
}

await main();
