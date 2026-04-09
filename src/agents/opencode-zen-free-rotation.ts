/**
 * Rotates OpenCode Zen free-tier models within the fallback candidate list so
 * load spreads across the documented free models (see OpenCode Zen pricing).
 *
 * Opt-out: OPENCLAW_ROTATE_OPENCODE_ZEN_FREE=0|false|off|no
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createSubsystemLogger } from "../logging/subsystem.js";
import type { ModelCandidate } from "./model-fallback.types.js";

const log = createSubsystemLogger("opencode-zen-free-rotation");

/** Keep in sync with OpenCode Zen "Free" tier model ids and extensions/auto-agent FALLBACK_MODELS. */
export const OPENCODE_ZEN_FREE_MODEL_IDS = new Set([
  "big-pickle",
  "gpt-5-nano",
  "minimax-m2.5-free",
  "mimo-v2-omni-free",
  "mimo-v2-pro-free",
  "nemotron-3-super-free",
  "qwen3.6-plus-free",
]);

export function isOpencodeZenProvider(provider: string): boolean {
  const p = String(provider ?? "")
    .trim()
    .toLowerCase();
  return p === "opencode" || p === "opencode-go";
}

export function isOpencodeZenFreeModel(model: string): boolean {
  return OPENCODE_ZEN_FREE_MODEL_IDS.has(String(model ?? "").trim());
}

export function isOpencodeZenFreeCandidate(candidate: ModelCandidate): boolean {
  return isOpencodeZenProvider(candidate.provider) && isOpencodeZenFreeModel(candidate.model);
}

function parseRotationEnabledFromEnv(): boolean {
  const raw = process.env.OPENCLAW_ROTATE_OPENCODE_ZEN_FREE;
  if (raw === undefined || raw === "") {
    return true;
  }
  const v = raw.trim().toLowerCase();
  return !(v === "0" || v === "false" || v === "off" || v === "no");
}

/** Increments each rotation when agentDir is unavailable (no persistence). */
let ephemeralRotationSeq = 0;

type RotationStateFile = {
  index?: number;
};

function stateFilePath(agentDir: string): string {
  return path.join(agentDir.trim(), "opencode-zen-free-rotation.json");
}

async function readRotationIndex(statePath: string): Promise<number> {
  try {
    const raw = await fs.readFile(statePath, "utf8");
    const parsed = JSON.parse(raw) as RotationStateFile;
    const idx = parsed.index;
    if (typeof idx !== "number" || !Number.isFinite(idx)) {
      return 0;
    }
    return Math.max(0, Math.floor(idx));
  } catch {
    return 0;
  }
}

async function writeRotationIndex(statePath: string, nextIndex: number): Promise<void> {
  const dir = path.dirname(statePath);
  await fs.mkdir(dir, { recursive: true });
  const payload: RotationStateFile = { index: nextIndex };
  await fs.writeFile(statePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

/**
 * Left-rotates only the OpenCode Zen free candidates in `candidates`, preserving
 * order of all other entries. Persists the next offset under agentDir when set.
 */
export async function applyOpencodeZenFreeRotation(
  candidates: ModelCandidate[],
  agentDir?: string,
): Promise<ModelCandidate[]> {
  if (!parseRotationEnabledFromEnv()) {
    return candidates;
  }

  const indices: number[] = [];
  for (let i = 0; i < candidates.length; i += 1) {
    if (isOpencodeZenFreeCandidate(candidates[i])) {
      indices.push(i);
    }
  }
  if (indices.length < 2) {
    return candidates;
  }

  const out = candidates.map((c) => ({ ...c }));
  const n = indices.length;

  let offset: number;
  const trimmedAgentDir = agentDir?.trim();
  const statePath = trimmedAgentDir ? stateFilePath(trimmedAgentDir) : null;

  if (statePath) {
    offset = await readRotationIndex(statePath);
  } else {
    offset = ephemeralRotationSeq % n;
    ephemeralRotationSeq += 1;
  }

  const normalized = offset % n;
  const zenSlice = indices.map((i) => out[i]);
  const rotated = [...zenSlice.slice(normalized), ...zenSlice.slice(0, normalized)];
  for (let j = 0; j < n; j += 1) {
    out[indices[j]] = rotated[j];
  }

  const nextIndex = (offset + 1) % n;
  if (statePath) {
    try {
      await writeRotationIndex(statePath, nextIndex);
    } catch (err) {
      log.warn(
        `failed to persist OpenCode Zen rotation index: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return out;
}
