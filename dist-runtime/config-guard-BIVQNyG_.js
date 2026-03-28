import { L as shouldMigrateStateFromPath } from "./globals-BKVgh_pY.js";
import "./paths-Chd_ukvM.js";
import { d as readConfigFileSnapshot } from "./io-BeL7sW7Y.js";
import "./theme-CWrxY1-_.js";
import "./utils-DGUUVa38.js";
import "./subsystem-BZRyMoTO.js";
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
import "./config-Cfud9qZm.js";
//#region src/cli/program/config-guard.ts
const ALLOWED_INVALID_COMMANDS = new Set(["doctor", "logs", "health", "help", "status"]);
const ALLOWED_INVALID_GATEWAY_SUBCOMMANDS = new Set([
  "status",
  "probe",
  "health",
  "discover",
  "call",
  "install",
  "uninstall",
  "start",
  "stop",
  "restart",
]);
let didRunDoctorConfigFlow = false;
let configSnapshotPromise = null;
function resetConfigGuardStateForTests() {
  didRunDoctorConfigFlow = false;
  configSnapshotPromise = null;
}
async function getConfigSnapshot() {
  if (process.env.VITEST === "true") return readConfigFileSnapshot();
  configSnapshotPromise ??= readConfigFileSnapshot();
  return configSnapshotPromise;
}
async function ensureConfigReady(params) {
  const commandPath = params.commandPath ?? [];
  let preflightSnapshot = null;
  if (!didRunDoctorConfigFlow && shouldMigrateStateFromPath(commandPath)) {
    didRunDoctorConfigFlow = true;
    const runDoctorConfigPreflight = async () =>
      (await import("./doctor-config-preflight-OHif0BLs.js")).runDoctorConfigPreflight({
        migrateState: false,
        migrateLegacyConfig: false,
        invalidConfigNote: false,
      });
    if (!params.suppressDoctorStdout)
      preflightSnapshot = (await runDoctorConfigPreflight()).snapshot;
    else {
      const originalStdoutWrite = process.stdout.write.bind(process.stdout);
      const originalSuppressNotes = process.env.OPENCLAW_SUPPRESS_NOTES;
      process.stdout.write = () => true;
      process.env.OPENCLAW_SUPPRESS_NOTES = "1";
      try {
        preflightSnapshot = (await runDoctorConfigPreflight()).snapshot;
      } finally {
        process.stdout.write = originalStdoutWrite;
        if (originalSuppressNotes === void 0) delete process.env.OPENCLAW_SUPPRESS_NOTES;
        else process.env.OPENCLAW_SUPPRESS_NOTES = originalSuppressNotes;
      }
    }
  }
  const snapshot = preflightSnapshot ?? (await getConfigSnapshot());
  const commandName = commandPath[0];
  const subcommandName = commandPath[1];
  const allowInvalid = commandName
    ? params.allowInvalid === true ||
      ALLOWED_INVALID_COMMANDS.has(commandName) ||
      (commandName === "gateway" &&
        subcommandName &&
        ALLOWED_INVALID_GATEWAY_SUBCOMMANDS.has(subcommandName))
    : false;
  const { formatConfigIssueLines } = await import("./issue-format-BP0T2FOa.js");
  const issues =
    snapshot.exists && !snapshot.valid
      ? formatConfigIssueLines(snapshot.issues, "-", { normalizeRoot: true })
      : [];
  const legacyIssues =
    snapshot.legacyIssues.length > 0 ? formatConfigIssueLines(snapshot.legacyIssues, "-") : [];
  if (!(snapshot.exists && !snapshot.valid)) return;
  const [{ colorize, isRich, theme }, { shortenHomePath }, { formatCliCommand }] =
    await Promise.all([
      import("./theme-BAi-ug0-.js"),
      import("./utils-BKZeF6rB.js"),
      import("./command-format-DuY5ohQv.js"),
    ]);
  const rich = isRich();
  const muted = (value) => colorize(rich, theme.muted, value);
  const error = (value) => colorize(rich, theme.error, value);
  const heading = (value) => colorize(rich, theme.heading, value);
  const commandText = (value) => colorize(rich, theme.command, value);
  params.runtime.error(heading("Config invalid"));
  params.runtime.error(`${muted("File:")} ${muted(shortenHomePath(snapshot.path))}`);
  if (issues.length > 0) {
    params.runtime.error(muted("Problem:"));
    params.runtime.error(issues.map((issue) => `  ${error(issue)}`).join("\n"));
  }
  if (legacyIssues.length > 0) {
    params.runtime.error(muted("Legacy config keys detected:"));
    params.runtime.error(legacyIssues.map((issue) => `  ${error(issue)}`).join("\n"));
  }
  params.runtime.error("");
  params.runtime.error(
    `${muted("Run:")} ${commandText(formatCliCommand("openclaw doctor --fix"))}`,
  );
  if (!allowInvalid) params.runtime.exit(1);
}
const __test__ = { resetConfigGuardStateForTests };
//#endregion
export { __test__, ensureConfigReady };
