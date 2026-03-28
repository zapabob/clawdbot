import "./redact-CPjO5IzK.js";
import "./errors-CHvVoeNX.js";
import "./io-BeL7sW7Y.js";
import "./paths-Chd_ukvM.js";
import "./globals-BKVgh_pY.js";
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
import "./message-channel-BTVKzHsu.js";
import "./boolean-CsNbQKvJ.js";
import "./env-C-KVzFmc.js";
import "./shell-env-BOjFl6MZ.js";
import "./config-state-CGV1IKLE.js";
import "./version-yfoo3YbF.js";
import "./min-host-version-DM6er2ZX.js";
import "./manifest-registry-CMy5XLiN.js";
import "./runtime-guard-WQAOpX6v.js";
import "./prompt-style-DAOsI00Z.js";
import "./safe-text-CpFY0TZg.js";
import "./model-selection-CNzhkJya.js";
import "./env-substitution-X9lTyhgh.js";
import "./network-mode-JwypQ_rG.js";
import "./ip-CWtG939A.js";
import "./config-Cfud9qZm.js";
import "./runtime-Bd4XqlOP.js";
import "./profiles-DothReVm.js";
import "./auth-profiles-BWz6ST0A.js";
import "./json-file-zQUdGjzr.js";
import "./audit-fs-BVqUNCSg.js";
import "./resolve-BNoFF8j-.js";
import "./store-Bo1TX1Sc.js";
import "./plugins-AUGbKgu9.js";
import "./sessions-CD_-8zJN.js";
import "./paths-0NHK4yJk.js";
import "./session-write-lock-D4oaWfci.js";
import "./tailscale-D5EfGD33.js";
import "./tailnet-BgVZoAmn.js";
import "./net-B1gQyBKw.js";
import "./auth-DQHfNzzJ.js";
import "./credentials-ISiLam_U.js";
import "./ports-Xu1Y4c5L.js";
import "./ports-lsof-B2ue3p1o.js";
import "./method-scopes-Le0rX1x3.js";
import "./call-C8P8TkMb.js";
import "./restart-stale-pids-BP2oA1F2.js";
import "./note-DRnYkG2j.js";
import "./runtime-paths-bnAkfJBM.js";
import "./daemon-install-plan.shared-D4PCKVly.js";
import { r as isGatewayDaemonRuntime } from "./daemon-runtime-DK_wYipR.js";
import {
  n as buildGatewayInstallPlan,
  r as gatewayInstallErrorHint,
  t as resolveGatewayInstallToken,
} from "./gateway-install-token-_5s7uUwb.js";
import "./control-ui-shared-B8bHLW2B.js";
import "./onboard-helpers-gr0Ez1xh.js";
import "./runtime-parse-DjytnpAr.js";
import "./launchd-Cn3XWWJL.js";
import { n as resolveGatewayService } from "./service-Md1RXiZv.js";
import { i as isSystemdUserServiceAvailable } from "./systemd-DdlU2Iy6.js";
import { n as ensureSystemdUserLingerNonInteractive } from "./systemd-linger-4XkeWSyW.js";
//#region src/commands/onboard-non-interactive/local/daemon-install.ts
async function installGatewayDaemonNonInteractive(params) {
  const { opts, runtime, port } = params;
  if (!opts.installDaemon) return { installed: false };
  const daemonRuntimeRaw = opts.daemonRuntime ?? "node";
  const systemdAvailable =
    process.platform === "linux" ? await isSystemdUserServiceAvailable() : true;
  if (process.platform === "linux" && !systemdAvailable) {
    runtime.log(
      "Systemd user services are unavailable; skipping service install. Use a direct shell run (`openclaw gateway run`) or rerun without --install-daemon on this session.",
    );
    return {
      installed: false,
      skippedReason: "systemd-user-unavailable",
    };
  }
  if (!isGatewayDaemonRuntime(daemonRuntimeRaw)) {
    runtime.error("Invalid --daemon-runtime (use node or bun)");
    runtime.exit(1);
    return { installed: false };
  }
  const service = resolveGatewayService();
  const tokenResolution = await resolveGatewayInstallToken({
    config: params.nextConfig,
    env: process.env,
  });
  for (const warning of tokenResolution.warnings) runtime.log(warning);
  if (tokenResolution.unavailableReason) {
    runtime.error(
      [
        "Gateway install blocked:",
        tokenResolution.unavailableReason,
        "Fix gateway auth config/token input and rerun setup.",
      ].join(" "),
    );
    runtime.exit(1);
    return { installed: false };
  }
  const { programArguments, workingDirectory, environment } = await buildGatewayInstallPlan({
    env: process.env,
    port,
    runtime: daemonRuntimeRaw,
    warn: (message) => runtime.log(message),
    config: params.nextConfig,
  });
  try {
    await service.install({
      env: process.env,
      stdout: process.stdout,
      programArguments,
      workingDirectory,
      environment,
    });
  } catch (err) {
    runtime.error(`Gateway service install failed: ${String(err)}`);
    runtime.log(gatewayInstallErrorHint());
    return { installed: false };
  }
  await ensureSystemdUserLingerNonInteractive({ runtime });
  return { installed: true };
}
//#endregion
export { installGatewayDaemonNonInteractive };
