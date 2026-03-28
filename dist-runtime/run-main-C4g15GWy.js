import "./redact-CPjO5IzK.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process$1 from "node:process";
import "./theme-CWrxY1-_.js";
import { fileURLToPath } from "node:url";
import "./ansi-D3lUajt1.js";
import dotenv from "dotenv";
import "./boolean-CsNbQKvJ.js";
import { t as emitCliBanner } from "./banner-D8_G9LpO.js";
import { r as normalizeEnv, t as isTruthyEnvValue } from "./env-C-KVzFmc.js";
import { i as formatUncaughtError } from "./errors-CHvVoeNX.js";
import "./logging-DzBmeaU7.js";
import {
  A as getPositiveIntFlagValue,
  D as getCommandPathWithRootOptions,
  I as isRootHelpInvocation,
  M as getVerboseFlag,
  N as hasFlag,
  O as getCommandPositionalsWithRootOptions,
  P as hasHelpOrVersion,
  j as getPrimaryCommand,
  k as getFlagValue,
  y as loggingState,
  z as isValueToken,
} from "./globals-BKVgh_pY.js";
import { t as isMainModule } from "./is-main-EuRWM-HL.js";
import { t as ensureOpenClawCliOnPath } from "./path-env-CQw4HWO0.js";
import { S as resolveRequiredHomeDir, _ as resolveStateDir } from "./paths-Chd_ukvM.js";
import { t as isValidProfileName } from "./profile-utils-DXZbSSbu.js";
import { t as assertSupportedRuntime } from "./runtime-guard-WQAOpX6v.js";
import { l as defaultRuntime, r as enableConsoleCapture } from "./subsystem-BZRyMoTO.js";
import { t as VERSION } from "./version-yfoo3YbF.js";
//#region src/cli/dotenv.ts
function loadCliDotEnv(opts) {
  const quiet = opts?.quiet ?? true;
  dotenv.config({ quiet });
  const globalEnvPath = path.join(resolveStateDir(process.env), ".env");
  if (!fs.existsSync(globalEnvPath)) return;
  dotenv.config({
    quiet,
    path: globalEnvPath,
    override: false,
  });
}
//#endregion
//#region src/cli/profile.ts
function takeValue(raw, next) {
  if (raw.includes("=")) {
    const [, value] = raw.split("=", 2);
    return {
      value: (value ?? "").trim() || null,
      consumedNext: false,
    };
  }
  return {
    value: (next ?? "").trim() || null,
    consumedNext: Boolean(next),
  };
}
function parseCliProfileArgs(argv) {
  if (argv.length < 2)
    return {
      ok: true,
      profile: null,
      argv,
    };
  const out = argv.slice(0, 2);
  let profile = null;
  let sawDev = false;
  let sawCommand = false;
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === void 0) continue;
    if (sawCommand) {
      out.push(arg);
      continue;
    }
    if (arg === "--dev") {
      if (profile && profile !== "dev")
        return {
          ok: false,
          error: "Cannot combine --dev with --profile",
        };
      sawDev = true;
      profile = "dev";
      continue;
    }
    if (arg === "--profile" || arg.startsWith("--profile=")) {
      if (sawDev)
        return {
          ok: false,
          error: "Cannot combine --dev with --profile",
        };
      const next = args[i + 1];
      const { value, consumedNext } = takeValue(arg, next);
      if (consumedNext) i += 1;
      if (!value)
        return {
          ok: false,
          error: "--profile requires a value",
        };
      if (!isValidProfileName(value))
        return {
          ok: false,
          error: 'Invalid --profile (use letters, numbers, "_", "-" only)',
        };
      profile = value;
      continue;
    }
    if (!arg.startsWith("-")) {
      sawCommand = true;
      out.push(arg);
      continue;
    }
    out.push(arg);
  }
  return {
    ok: true,
    profile,
    argv: out,
  };
}
function resolveProfileStateDir(profile, env, homedir) {
  const suffix = profile.toLowerCase() === "default" ? "" : `-${profile}`;
  return path.join(resolveRequiredHomeDir(env, homedir), `.openclaw${suffix}`);
}
function applyCliProfileEnv(params) {
  const env = params.env ?? process.env;
  const homedir = params.homedir ?? os.homedir;
  const profile = params.profile.trim();
  if (!profile) return;
  env.OPENCLAW_PROFILE = profile;
  const stateDir = env.OPENCLAW_STATE_DIR?.trim() || resolveProfileStateDir(profile, env, homedir);
  if (!env.OPENCLAW_STATE_DIR?.trim()) env.OPENCLAW_STATE_DIR = stateDir;
  if (!env.OPENCLAW_CONFIG_PATH?.trim())
    env.OPENCLAW_CONFIG_PATH = path.join(stateDir, "openclaw.json");
  if (profile === "dev" && !env.OPENCLAW_GATEWAY_PORT?.trim()) env.OPENCLAW_GATEWAY_PORT = "19001";
}
//#endregion
//#region src/cli/program/routes.ts
const routeHealth = {
  match: (path) => path[0] === "health",
  loadPlugins: (argv) => !hasFlag(argv, "--json"),
  run: async (argv) => {
    const json = hasFlag(argv, "--json");
    const verbose = getVerboseFlag(argv, { includeDebug: true });
    const timeoutMs = getPositiveIntFlagValue(argv, "--timeout");
    if (timeoutMs === null) return false;
    const { healthCommand } = await import("./health-W-4qkQgb.js");
    await healthCommand(
      {
        json,
        timeoutMs,
        verbose,
      },
      defaultRuntime,
    );
    return true;
  },
};
const routeStatus = {
  match: (path) => path[0] === "status",
  loadPlugins: (argv) => !hasFlag(argv, "--json"),
  run: async (argv) => {
    const json = hasFlag(argv, "--json");
    const deep = hasFlag(argv, "--deep");
    const all = hasFlag(argv, "--all");
    const usage = hasFlag(argv, "--usage");
    const verbose = getVerboseFlag(argv, { includeDebug: true });
    const timeoutMs = getPositiveIntFlagValue(argv, "--timeout");
    if (timeoutMs === null) return false;
    if (json) {
      const { statusJsonCommand } = await import("./status-json-M6WyGjhm.js");
      await statusJsonCommand(
        {
          deep,
          all,
          usage,
          timeoutMs,
        },
        defaultRuntime,
      );
      return true;
    }
    const { statusCommand } = await import("./status-Duabd7hF.js");
    await statusCommand(
      {
        json,
        deep,
        all,
        usage,
        timeoutMs,
        verbose,
      },
      defaultRuntime,
    );
    return true;
  },
};
const routeGatewayStatus = {
  match: (path) => path[0] === "gateway" && path[1] === "status",
  run: async (argv) => {
    const url = getFlagValue(argv, "--url");
    if (url === null) return false;
    const token = getFlagValue(argv, "--token");
    if (token === null) return false;
    const password = getFlagValue(argv, "--password");
    if (password === null) return false;
    const timeout = getFlagValue(argv, "--timeout");
    if (timeout === null) return false;
    const ssh = getFlagValue(argv, "--ssh");
    if (ssh === null) return false;
    if (ssh !== void 0) return false;
    const sshIdentity = getFlagValue(argv, "--ssh-identity");
    if (sshIdentity === null) return false;
    if (sshIdentity !== void 0) return false;
    if (hasFlag(argv, "--ssh-auto")) return false;
    const deep = hasFlag(argv, "--deep");
    const json = hasFlag(argv, "--json");
    const requireRpc = hasFlag(argv, "--require-rpc");
    const probe = !hasFlag(argv, "--no-probe");
    const { runDaemonStatus } = await import("./status-DbG_65TZ.js");
    await runDaemonStatus({
      rpc: {
        url: url ?? void 0,
        token: token ?? void 0,
        password: password ?? void 0,
        timeout: timeout ?? void 0,
      },
      probe,
      requireRpc,
      deep,
      json,
    });
    return true;
  },
};
const routeSessions = {
  match: (path) => path[0] === "sessions" && !path[1],
  run: async (argv) => {
    const json = hasFlag(argv, "--json");
    const allAgents = hasFlag(argv, "--all-agents");
    const agent = getFlagValue(argv, "--agent");
    if (agent === null) return false;
    const store = getFlagValue(argv, "--store");
    if (store === null) return false;
    const active = getFlagValue(argv, "--active");
    if (active === null) return false;
    const { sessionsCommand } = await import("./sessions-BUiLbRU7.js");
    await sessionsCommand(
      {
        json,
        store,
        agent,
        allAgents,
        active,
      },
      defaultRuntime,
    );
    return true;
  },
};
const routeAgentsList = {
  match: (path) => path[0] === "agents" && path[1] === "list",
  run: async (argv) => {
    const json = hasFlag(argv, "--json");
    const bindings = hasFlag(argv, "--bindings");
    const { agentsListCommand } = await import("./agents-QnNLMdkv.js");
    await agentsListCommand(
      {
        json,
        bindings,
      },
      defaultRuntime,
    );
    return true;
  },
};
const routeMemoryStatus = {
  match: (path) => path[0] === "memory" && path[1] === "status",
  run: async (argv) => {
    const agent = getFlagValue(argv, "--agent");
    if (agent === null) return false;
    const json = hasFlag(argv, "--json");
    const deep = hasFlag(argv, "--deep");
    const index = hasFlag(argv, "--index");
    const verbose = hasFlag(argv, "--verbose");
    const { runMemoryStatus } = await import("./memory-cli-lG8sqkqM.js");
    await runMemoryStatus({
      agent,
      json,
      deep,
      index,
      verbose,
    });
    return true;
  },
};
function getFlagValues(argv, name) {
  const values = [];
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg || arg === "--") break;
    if (arg === name) {
      const next = args[i + 1];
      if (!isValueToken(next)) return null;
      values.push(next);
      i += 1;
      continue;
    }
    if (arg.startsWith(`${name}=`)) {
      const value = arg.slice(name.length + 1).trim();
      if (!value) return null;
      values.push(value);
    }
  }
  return values;
}
const routes = [
  routeHealth,
  routeStatus,
  routeGatewayStatus,
  routeSessions,
  routeAgentsList,
  routeMemoryStatus,
  {
    match: (path) => path[0] === "config" && path[1] === "get",
    run: async (argv) => {
      const positionals = getCommandPositionalsWithRootOptions(argv, {
        commandPath: ["config", "get"],
        booleanFlags: ["--json"],
      });
      if (!positionals || positionals.length !== 1) return false;
      const pathArg = positionals[0];
      if (!pathArg) return false;
      const json = hasFlag(argv, "--json");
      const { runConfigGet } = await import("./config-cli--rrsL6yq.js");
      await runConfigGet({
        path: pathArg,
        json,
      });
      return true;
    },
  },
  {
    match: (path) => path[0] === "config" && path[1] === "unset",
    run: async (argv) => {
      const positionals = getCommandPositionalsWithRootOptions(argv, {
        commandPath: ["config", "unset"],
      });
      if (!positionals || positionals.length !== 1) return false;
      const pathArg = positionals[0];
      if (!pathArg) return false;
      const { runConfigUnset } = await import("./config-cli--rrsL6yq.js");
      await runConfigUnset({ path: pathArg });
      return true;
    },
  },
  {
    match: (path) => path[0] === "models" && path[1] === "list",
    run: async (argv) => {
      const provider = getFlagValue(argv, "--provider");
      if (provider === null) return false;
      const all = hasFlag(argv, "--all");
      const local = hasFlag(argv, "--local");
      const json = hasFlag(argv, "--json");
      const plain = hasFlag(argv, "--plain");
      const { modelsListCommand } = await import("./models-DGieBzzz.js");
      await modelsListCommand(
        {
          all,
          local,
          provider,
          json,
          plain,
        },
        defaultRuntime,
      );
      return true;
    },
  },
  {
    match: (path) => path[0] === "models" && path[1] === "status",
    run: async (argv) => {
      const probeProvider = getFlagValue(argv, "--probe-provider");
      if (probeProvider === null) return false;
      const probeTimeout = getFlagValue(argv, "--probe-timeout");
      if (probeTimeout === null) return false;
      const probeConcurrency = getFlagValue(argv, "--probe-concurrency");
      if (probeConcurrency === null) return false;
      const probeMaxTokens = getFlagValue(argv, "--probe-max-tokens");
      if (probeMaxTokens === null) return false;
      const agent = getFlagValue(argv, "--agent");
      if (agent === null) return false;
      const probeProfileValues = getFlagValues(argv, "--probe-profile");
      if (probeProfileValues === null) return false;
      const probeProfile =
        probeProfileValues.length === 0
          ? void 0
          : probeProfileValues.length === 1
            ? probeProfileValues[0]
            : probeProfileValues;
      const json = hasFlag(argv, "--json");
      const plain = hasFlag(argv, "--plain");
      const check = hasFlag(argv, "--check");
      const probe = hasFlag(argv, "--probe");
      const { modelsStatusCommand } = await import("./models-DGieBzzz.js");
      await modelsStatusCommand(
        {
          json,
          plain,
          check,
          probe,
          probeProvider,
          probeProfile,
          probeTimeout,
          probeConcurrency,
          probeMaxTokens,
          agent,
        },
        defaultRuntime,
      );
      return true;
    },
  },
];
function findRoutedCommand(path) {
  for (const route of routes) if (route.match(path)) return route;
  return null;
}
//#endregion
//#region src/cli/route.ts
async function prepareRoutedCommand(params) {
  const suppressDoctorStdout = hasFlag(params.argv, "--json");
  emitCliBanner(VERSION, { argv: params.argv });
  const { ensureConfigReady } = await import("./config-guard-BIVQNyG_.js");
  await ensureConfigReady({
    runtime: defaultRuntime,
    commandPath: params.commandPath,
    ...(suppressDoctorStdout ? { suppressDoctorStdout: true } : {}),
  });
  if (
    typeof params.loadPlugins === "function" ? params.loadPlugins(params.argv) : params.loadPlugins
  ) {
    const { ensurePluginRegistryLoaded } = await import("./plugin-registry-_3_5rEUK.js");
    const prev = loggingState.forceConsoleToStderr;
    if (suppressDoctorStdout) loggingState.forceConsoleToStderr = true;
    try {
      ensurePluginRegistryLoaded({
        scope:
          params.commandPath[0] === "status" || params.commandPath[0] === "health"
            ? "channels"
            : "all",
      });
    } finally {
      loggingState.forceConsoleToStderr = prev;
    }
  }
}
async function tryRouteCli(argv) {
  if (isTruthyEnvValue(process.env.OPENCLAW_DISABLE_ROUTE_FIRST)) return false;
  if (hasHelpOrVersion(argv)) return false;
  const path = getCommandPathWithRootOptions(argv, 2);
  if (!path[0]) return false;
  const route = findRoutedCommand(path);
  if (!route) return false;
  await prepareRoutedCommand({
    argv,
    commandPath: path,
    loadPlugins: route.loadPlugins,
  });
  return route.run(argv);
}
//#endregion
//#region src/cli/windows-argv.ts
function normalizeWindowsArgv(argv) {
  if (process.platform !== "win32") return argv;
  if (argv.length < 2) return argv;
  const stripControlChars = (value) => {
    let out = "";
    for (let i = 0; i < value.length; i += 1) {
      const code = value.charCodeAt(i);
      if (code >= 32 && code !== 127) out += value[i];
    }
    return out;
  };
  const normalizeArg = (value) =>
    stripControlChars(value)
      .replace(/^['"]+|['"]+$/g, "")
      .trim();
  const normalizeCandidate = (value) => normalizeArg(value).replace(/^\\\\\\?\\/, "");
  const execPath = normalizeCandidate(process.execPath);
  const execPathLower = execPath.toLowerCase();
  const execBase = path.basename(execPath).toLowerCase();
  const isExecPath = (value) => {
    if (!value) return false;
    const normalized = normalizeCandidate(value);
    if (!normalized) return false;
    const lower = normalized.toLowerCase();
    return (
      lower === execPathLower ||
      path.basename(lower) === execBase ||
      lower.endsWith("\\node.exe") ||
      lower.endsWith("/node.exe") ||
      lower.includes("node.exe") ||
      (path.basename(lower) === "node.exe" && fs.existsSync(normalized))
    );
  };
  const next = [...argv];
  for (let i = 1; i <= 3 && i < next.length; ) {
    if (isExecPath(next[i])) {
      next.splice(i, 1);
      continue;
    }
    i += 1;
  }
  const filtered = next.filter((arg, index) => index === 0 || !isExecPath(arg));
  if (filtered.length < 3) return filtered;
  const cleaned = [...filtered];
  for (let i = 2; i < cleaned.length; ) {
    const arg = cleaned[i];
    if (!arg || arg.startsWith("-")) {
      i += 1;
      continue;
    }
    if (isExecPath(arg)) {
      cleaned.splice(i, 1);
      continue;
    }
    break;
  }
  return cleaned;
}
//#endregion
//#region src/cli/run-main.ts
async function closeCliMemoryManagers() {
  try {
    const { closeAllMemorySearchManagers } = await import("./search-manager-CjArJKcs.js");
    await closeAllMemorySearchManagers();
  } catch {}
}
function rewriteUpdateFlagArgv(argv) {
  const index = argv.indexOf("--update");
  if (index === -1) return argv;
  const next = [...argv];
  next.splice(index, 1, "update");
  return next;
}
function shouldRegisterPrimarySubcommand(argv) {
  return !hasHelpOrVersion(argv);
}
function shouldSkipPluginCommandRegistration(params) {
  if (params.hasBuiltinPrimary) return true;
  if (!params.primary) return hasHelpOrVersion(params.argv);
  return false;
}
function shouldEnsureCliPath(argv) {
  if (hasHelpOrVersion(argv)) return false;
  const [primary, secondary] = getCommandPathWithRootOptions(argv, 2);
  if (!primary) return true;
  if (primary === "status" || primary === "health" || primary === "sessions") return false;
  if (primary === "config" && (secondary === "get" || secondary === "unset")) return false;
  if (primary === "models" && (secondary === "list" || secondary === "status")) return false;
  return true;
}
function shouldUseRootHelpFastPath(argv) {
  return isRootHelpInvocation(argv);
}
async function runCli(argv = process$1.argv) {
  let normalizedArgv = normalizeWindowsArgv(argv);
  const parsedProfile = parseCliProfileArgs(normalizedArgv);
  if (!parsedProfile.ok) throw new Error(parsedProfile.error);
  if (parsedProfile.profile) applyCliProfileEnv({ profile: parsedProfile.profile });
  normalizedArgv = parsedProfile.argv;
  loadCliDotEnv({ quiet: true });
  normalizeEnv();
  if (shouldEnsureCliPath(normalizedArgv)) ensureOpenClawCliOnPath();
  assertSupportedRuntime();
  try {
    if (shouldUseRootHelpFastPath(normalizedArgv)) {
      const { outputRootHelp } = await import("./root-help-Ca9WISOi.js");
      outputRootHelp();
      return;
    }
    if (await tryRouteCli(normalizedArgv)) return;
    enableConsoleCapture();
    const { buildProgram } = await import("./program-DrUO6iha.js");
    const program = buildProgram();
    const { installUnhandledRejectionHandler } = await import("./unhandled-rejections-DZnkaSao.js");
    installUnhandledRejectionHandler();
    process$1.on("uncaughtException", (error) => {
      console.error("[openclaw] Uncaught exception:", formatUncaughtError(error));
      process$1.exit(1);
    });
    const parseArgv = rewriteUpdateFlagArgv(normalizedArgv);
    const primary = getPrimaryCommand(parseArgv);
    if (primary) {
      const { getProgramContext } = await import("./program-context-IqryDjrY.js");
      const ctx = getProgramContext(program);
      if (ctx) {
        const { registerCoreCliByName } = await import("./command-registry-DAyGqpba.js");
        await registerCoreCliByName(program, ctx, primary, parseArgv);
      }
      const { registerSubCliByName } = await import("./register.subclis-BGIawxZc.js");
      await registerSubCliByName(program, primary);
    }
    if (
      !shouldSkipPluginCommandRegistration({
        argv: parseArgv,
        primary,
        hasBuiltinPrimary:
          primary !== null && program.commands.some((command) => command.name() === primary),
      })
    ) {
      const { registerPluginCliCommands } = await import("./cli-BZBaiHz7.js");
      const { loadValidatedConfigForPluginRegistration } =
        await import("./register.subclis-BGIawxZc.js");
      const config = await loadValidatedConfigForPluginRegistration();
      if (config) registerPluginCliCommands(program, config);
    }
    await program.parseAsync(parseArgv);
  } finally {
    await closeCliMemoryManagers();
  }
}
function isCliMainModule() {
  return isMainModule({ currentFile: fileURLToPath(import.meta.url) });
}
//#endregion
export {
  isCliMainModule,
  rewriteUpdateFlagArgv,
  runCli,
  shouldEnsureCliPath,
  shouldRegisterPrimarySubcommand,
  shouldSkipPluginCommandRegistration,
  shouldUseRootHelpFastPath,
};
