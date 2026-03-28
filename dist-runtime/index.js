#!/usr/bin/env node
import "./redact-CPjO5IzK.js";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { i as formatUncaughtError } from "./errors-CHvVoeNX.js";
import { t as isMainModule } from "./is-main-EuRWM-HL.js";
import { t as installUnhandledRejectionHandler } from "./unhandled-rejections-BUxLQs1F.js";
//#region src/index.ts
let assertWebChannel;
let applyTemplate;
let createDefaultDeps;
let deriveSessionKey;
let describePortOwner;
let ensureBinary;
let ensurePortAvailable;
let getReplyFromConfig;
let handlePortError;
let loadConfig;
let loadSessionStore;
let monitorWebChannel;
let normalizeE164;
let PortInUseError;
let promptYesNo;
let resolveSessionKey;
let resolveStorePath;
let runCommandWithTimeout;
let runExec;
let saveSessionStore;
let toWhatsappJid;
let waitForever;
async function loadLegacyCliDeps() {
  const [{ installGaxiosFetchCompat }, { runCli }] = await Promise.all([
    import("./gaxios-fetch-compat-9o7ao7h0.js"),
    import("./run-main-C4g15GWy.js"),
  ]);
  return {
    installGaxiosFetchCompat,
    runCli,
  };
}
async function runLegacyCliEntry(argv = process.argv, deps) {
  const { installGaxiosFetchCompat, runCli } = deps ?? (await loadLegacyCliDeps());
  await installGaxiosFetchCompat();
  await runCli(argv);
}
const isMain = isMainModule({ currentFile: fileURLToPath(import.meta.url) });
if (!isMain)
  ({
    assertWebChannel,
    applyTemplate,
    createDefaultDeps,
    deriveSessionKey,
    describePortOwner,
    ensureBinary,
    ensurePortAvailable,
    getReplyFromConfig,
    handlePortError,
    loadConfig,
    loadSessionStore,
    monitorWebChannel,
    normalizeE164,
    PortInUseError,
    promptYesNo,
    resolveSessionKey,
    resolveStorePath,
    runCommandWithTimeout,
    runExec,
    saveSessionStore,
    toWhatsappJid,
    waitForever,
  } = await import("./library-DdXaq8o-.js"));
if (isMain) {
  installUnhandledRejectionHandler();
  process.on("uncaughtException", (error) => {
    console.error("[openclaw] Uncaught exception:", formatUncaughtError(error));
    process.exit(1);
  });
  runLegacyCliEntry(process.argv).catch((err) => {
    console.error("[openclaw] CLI failed:", formatUncaughtError(err));
    process.exit(1);
  });
}
//#endregion
export {
  PortInUseError,
  applyTemplate,
  assertWebChannel,
  createDefaultDeps,
  deriveSessionKey,
  describePortOwner,
  ensureBinary,
  ensurePortAvailable,
  getReplyFromConfig,
  handlePortError,
  loadConfig,
  loadSessionStore,
  monitorWebChannel,
  normalizeE164,
  promptYesNo,
  resolveSessionKey,
  resolveStorePath,
  runCommandWithTimeout,
  runExec,
  runLegacyCliEntry,
  saveSessionStore,
  toWhatsappJid,
  waitForever,
};
