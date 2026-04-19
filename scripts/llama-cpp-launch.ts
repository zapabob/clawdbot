import { spawn } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadDotEnv } from "../src/infra/dotenv.js";

const DEFAULT_BASE_URL = "http://127.0.0.1:8080/v1";
const DEFAULT_EXECUTABLE = "llama-server";

export const LLAMA_CPP_MODEL_ENV_VAR = "LLAMA_CPP_MODEL";
export const LLAMA_CPP_MODEL_PATH_ENV_VAR = "LLAMA_CPP_MODEL_PATH";
export const LLAMA_CPP_MMPROJ_PATH_ENV_VAR = "LLAMA_CPP_MMPROJ_PATH";
export const LLAMA_CPP_API_KEY_ENV_VAR = "LLAMA_CPP_API_KEY";
export const LLAMA_CPP_BASE_URL_ENV_VAR = "LLAMA_CPP_BASE_URL";
export const LLAMA_CPP_SERVER_EXE_ENV_VAR = "LLAMA_CPP_SERVER_EXE";

function normalizeOptionalEnv(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function deriveDefaultPort(baseUrl: string): number {
  const parsed = new URL(baseUrl);
  if (parsed.port) {
    return Number(parsed.port);
  }
  return parsed.protocol === "https:" ? 443 : 80;
}

export function deriveLlamaCppModelIdFromPath(modelPath: string): string {
  return path.basename(modelPath.trim());
}

export type LlamaCppLaunchSpec = {
  executable: string;
  args: string[];
  modelId: string;
  modelPath: string;
  mmprojPath?: string;
  baseUrl: string;
};

export function resolveLlamaCppLaunchSpec(env: NodeJS.ProcessEnv = process.env): LlamaCppLaunchSpec {
  const modelPath = normalizeOptionalEnv(env[LLAMA_CPP_MODEL_PATH_ENV_VAR]);
  if (!modelPath) {
    throw new Error(
      `Missing ${LLAMA_CPP_MODEL_PATH_ENV_VAR}. Set it to the GGUF path you want llama-server to load.`,
    );
  }

  const baseUrl = normalizeOptionalEnv(env[LLAMA_CPP_BASE_URL_ENV_VAR]) ?? DEFAULT_BASE_URL;
  const parsedBaseUrl = new URL(baseUrl);
  const modelId =
    normalizeOptionalEnv(env[LLAMA_CPP_MODEL_ENV_VAR]) ?? deriveLlamaCppModelIdFromPath(modelPath);
  const mmprojPath = normalizeOptionalEnv(env[LLAMA_CPP_MMPROJ_PATH_ENV_VAR]);
  const apiKey = normalizeOptionalEnv(env[LLAMA_CPP_API_KEY_ENV_VAR]);
  const executable = normalizeOptionalEnv(env[LLAMA_CPP_SERVER_EXE_ENV_VAR]) ?? DEFAULT_EXECUTABLE;

  const args = ["-m", modelPath, "--host", parsedBaseUrl.hostname, "--port", String(deriveDefaultPort(baseUrl))];
  if (mmprojPath) {
    args.push("--mmproj", mmprojPath);
  }
  if (apiKey) {
    args.push("--api-key", apiKey);
  }

  return {
    executable,
    args,
    modelId,
    modelPath,
    ...(mmprojPath ? { mmprojPath } : {}),
    baseUrl,
  };
}

export async function runLlamaCppLaunch(
  env: NodeJS.ProcessEnv = process.env,
  io: Pick<NodeJS.Process, "stdout" | "stderr"> = process,
): Promise<never> {
  const spec = resolveLlamaCppLaunchSpec(env);
  io.stdout.write(`Launching llama.cpp model: ${spec.modelId}\n`);
  io.stdout.write(`Base URL: ${spec.baseUrl}\n`);
  io.stdout.write(`Model path: ${spec.modelPath}\n`);
  if (spec.mmprojPath) {
    io.stdout.write(`mmproj path: ${spec.mmprojPath}\n`);
  }

  const child = spawn(spec.executable, spec.args, {
    stdio: "inherit",
  });

  await new Promise<void>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`llama-server exited from signal ${signal}`));
        return;
      }
      if ((code ?? 0) !== 0) {
        reject(new Error(`llama-server exited with code ${code}`));
        return;
      }
      resolve();
    });
  });

  process.exit(0);
}

const entryHref = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";

if (import.meta.url === entryHref) {
  loadDotEnv({ quiet: true });
  runLlamaCppLaunch().catch((error) => {
    process.stderr.write(`${String(error)}\n`);
    process.exit(1);
  });
}
