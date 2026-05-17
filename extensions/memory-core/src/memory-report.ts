import fs from "node:fs/promises";
import path from "node:path";
import { listMemoryFiles } from "openclaw/plugin-sdk/memory-core-host-runtime-files";
import { DEFAULT_MEMORY_FILE_MAX_CHARS } from "./memory-budget.js";

const DEFAULT_STALE_DAILY_MEMORY_DAYS = 180;
const MAX_RECOMMENDATIONS_PER_KIND = 20;
const USER_PROFILE_FILENAME = "USER.md";
const ROOT_MEMORY_FILENAME = "MEMORY.md";
const DAILY_MEMORY_FILE_RE = /^(\d{4}-\d{2}-\d{2})(?:-[^/]+)?\.md$/i;

export type MemoryReportFileRole =
  | "root-memory"
  | "user-profile"
  | "daily-memory"
  | "dream-diary"
  | "extra-memory";

export type MemoryReportRecommendationKind =
  | "create_root_memory"
  | "compact_root_memory"
  | "review_source_sparse_root_memory"
  | "review_duplicate_memory_entry"
  | "review_possible_memory_conflict"
  | "review_old_daily_memory";

export type MemoryReportRecommendation = {
  kind: MemoryReportRecommendationKind;
  severity: "info" | "warn";
  reason: string;
  path?: string;
  line?: number;
  paths?: string[];
  sample?: string;
};

export type MemoryReportFileSummary = {
  path: string;
  role: MemoryReportFileRole;
  bytes: number;
  chars: number;
  lines: number;
  day?: string;
};

export type MemoryDryRunReport = {
  workspaceDir: string;
  dryRun: true;
  generatedAt: string;
  summary: {
    files: number;
    rootMemoryFiles: number;
    userProfileFiles: number;
    dailyMemoryFiles: number;
    extraMemoryFiles: number;
    totalBytes: number;
    totalChars: number;
    recommendations: number;
  };
  files: MemoryReportFileSummary[];
  recommendations: MemoryReportRecommendation[];
};

type LoadedMemoryFile = MemoryReportFileSummary & {
  absPath: string;
  content: string;
};

type BuildMemoryDryRunReportParams = {
  workspaceDir: string;
  extraPaths?: string[];
  nowMs?: number;
  staleDailyMemoryDays?: number;
  maxRootMemoryChars?: number;
};

function normalizeWorkspacePath(workspaceDir: string, absPath: string): string {
  const relative = path.relative(workspaceDir, absPath).replace(/\\/g, "/");
  return relative.startsWith("..") || path.isAbsolute(relative)
    ? absPath.replace(/\\/g, "/")
    : relative;
}

function classifyMemoryFile(workspaceDir: string, absPath: string): MemoryReportFileRole {
  const relative = normalizeWorkspacePath(workspaceDir, absPath);
  const basename = path.basename(absPath);
  if (relative === ROOT_MEMORY_FILENAME) {
    return "root-memory";
  }
  if (relative === USER_PROFILE_FILENAME) {
    return "user-profile";
  }
  if (relative.toLowerCase() === "dreams.md") {
    return "dream-diary";
  }
  if (relative.startsWith("memory/") && DAILY_MEMORY_FILE_RE.test(basename)) {
    return "daily-memory";
  }
  return "extra-memory";
}

function countLines(content: string): number {
  if (!content) {
    return 0;
  }
  return content.split(/\r?\n/).length;
}

async function loadMemoryReportFile(
  workspaceDir: string,
  absPath: string,
): Promise<LoadedMemoryFile | null> {
  let stat;
  try {
    stat = await fs.stat(absPath);
  } catch {
    return null;
  }
  if (!stat.isFile()) {
    return null;
  }
  const content = await fs.readFile(absPath, "utf-8");
  const relativePath = normalizeWorkspacePath(workspaceDir, absPath);
  const role = classifyMemoryFile(workspaceDir, absPath);
  return {
    absPath,
    path: relativePath,
    role,
    bytes: stat.size,
    chars: content.length,
    lines: countLines(content),
    ...(role === "daily-memory"
      ? { day: path.basename(absPath).match(DAILY_MEMORY_FILE_RE)?.[1] }
      : {}),
    content,
  };
}

async function loadMemoryReportFiles(params: {
  workspaceDir: string;
  extraPaths?: string[];
}): Promise<LoadedMemoryFile[]> {
  const paths = new Set(await listMemoryFiles(params.workspaceDir, params.extraPaths));
  paths.add(path.join(params.workspaceDir, USER_PROFILE_FILENAME));
  const files: LoadedMemoryFile[] = [];
  for (const absPath of paths) {
    const loaded = await loadMemoryReportFile(params.workspaceDir, absPath);
    if (loaded) {
      files.push(loaded);
    }
  }
  return files.toSorted((a, b) => a.path.localeCompare(b.path));
}

function normalizeMemoryEntry(line: string): string | null {
  const trimmed = line
    .trim()
    .replace(/^[-*]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .replace(/\s+/g, " ");
  if (trimmed.length < 24) {
    return null;
  }
  if (trimmed.startsWith("#") || trimmed.startsWith("```") || trimmed.startsWith("|")) {
    return null;
  }
  return trimmed.toLowerCase();
}

function extractKeyValue(line: string): { key: string; value: string } | null {
  const trimmed = line.trim().replace(/^[-*]\s+/, "");
  const match = /^([^:#\][|`]{3,80}):\s*(\S.{0,300})$/.exec(trimmed);
  if (!match) {
    return null;
  }
  const key = (match[1] ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  const value = (match[2] ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!key || !value) {
    return null;
  }
  return { key, value };
}

function hasSourceMarker(line: string): boolean {
  return /\b(source|evidence|ref|from|via)\b|https?:\/\/|#L\d+|\[[^\]]+\]\([^)]+\)/i.test(line);
}

function collectLineFacts(files: LoadedMemoryFile[]): Array<{
  file: LoadedMemoryFile;
  line: string;
  lineNo: number;
}> {
  const facts: Array<{ file: LoadedMemoryFile; line: string; lineNo: number }> = [];
  for (const file of files) {
    const lines = file.content.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? "";
      const normalized = normalizeMemoryEntry(line);
      if (!normalized) {
        continue;
      }
      facts.push({ file, line, lineNo: index + 1 });
    }
  }
  return facts;
}

function buildDuplicateRecommendations(files: LoadedMemoryFile[]): MemoryReportRecommendation[] {
  const byEntry = new Map<string, Array<{ path: string; line: number; text: string }>>();
  for (const fact of collectLineFacts(files)) {
    const normalized = normalizeMemoryEntry(fact.line);
    if (!normalized) {
      continue;
    }
    const entries = byEntry.get(normalized) ?? [];
    entries.push({ path: fact.file.path, line: fact.lineNo, text: fact.line.trim() });
    byEntry.set(normalized, entries);
  }
  return Array.from(byEntry.values())
    .filter((entries) => entries.length > 1)
    .slice(0, MAX_RECOMMENDATIONS_PER_KIND)
    .map((entries) => ({
      kind: "review_duplicate_memory_entry",
      severity: "info",
      reason: "same normalized memory entry appears more than once",
      paths: entries.map((entry) => `${entry.path}:${entry.line}`),
      sample: entries[0]?.text,
    }));
}

function buildConflictRecommendations(files: LoadedMemoryFile[]): MemoryReportRecommendation[] {
  const byKey = new Map<string, Array<{ path: string; line: number; value: string }>>();
  for (const file of files) {
    const lines = file.content.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? "";
      if (line.trim().startsWith("#") || line.trim().startsWith("```")) {
        continue;
      }
      const parsed = extractKeyValue(line);
      if (!parsed) {
        continue;
      }
      const entries = byKey.get(parsed.key) ?? [];
      entries.push({ path: file.path, line: index + 1, value: parsed.value });
      byKey.set(parsed.key, entries);
    }
  }
  return Array.from(byKey.entries())
    .filter(([, entries]) => new Set(entries.map((entry) => entry.value)).size > 1)
    .slice(0, MAX_RECOMMENDATIONS_PER_KIND)
    .map(([key, entries]) => ({
      kind: "review_possible_memory_conflict",
      severity: "warn",
      reason: `multiple values found for memory key "${key}"`,
      paths: entries.map((entry) => `${entry.path}:${entry.line}`),
      sample: entries.map((entry) => entry.value).join(" | "),
    }));
}

function buildRootMemoryRecommendations(params: {
  files: LoadedMemoryFile[];
  maxRootMemoryChars: number;
}): MemoryReportRecommendation[] {
  const recommendations: MemoryReportRecommendation[] = [];
  const root = params.files.find((file) => file.role === "root-memory");
  if (!root) {
    recommendations.push({
      kind: "create_root_memory",
      severity: "info",
      reason: "workspace has no MEMORY.md long-term summary",
      path: ROOT_MEMORY_FILENAME,
    });
    return recommendations;
  }
  if (root.chars >= params.maxRootMemoryChars * 0.8) {
    recommendations.push({
      kind: "compact_root_memory",
      severity: "warn",
      reason: `MEMORY.md is near the ${params.maxRootMemoryChars} character budget`,
      path: root.path,
    });
  }

  const claimLines = collectLineFacts([root]);
  if (claimLines.length >= 5) {
    const sourced = claimLines.filter((entry) => hasSourceMarker(entry.line)).length;
    if (sourced / claimLines.length < 0.2) {
      recommendations.push({
        kind: "review_source_sparse_root_memory",
        severity: "info",
        reason: "few durable memory lines include source or evidence markers",
        path: root.path,
      });
    }
  }
  return recommendations;
}

function buildOldDailyRecommendations(params: {
  files: LoadedMemoryFile[];
  nowMs: number;
  staleDailyMemoryDays: number;
}): MemoryReportRecommendation[] {
  const cutoffMs = params.nowMs - params.staleDailyMemoryDays * 24 * 60 * 60 * 1000;
  return params.files
    .filter((file) => file.role === "daily-memory" && file.day)
    .filter((file) => Date.parse(`${file.day}T00:00:00.000Z`) < cutoffMs)
    .toSorted((a, b) => (a.day ?? "").localeCompare(b.day ?? ""))
    .slice(0, MAX_RECOMMENDATIONS_PER_KIND)
    .map((file) => ({
      kind: "review_old_daily_memory",
      severity: "info",
      reason: `daily memory note is older than ${params.staleDailyMemoryDays} days`,
      path: file.path,
    }));
}

export async function buildMemoryDryRunReport(
  params: BuildMemoryDryRunReportParams,
): Promise<MemoryDryRunReport> {
  const nowMs = params.nowMs ?? Date.now();
  const staleDailyMemoryDays = Math.max(
    1,
    Math.floor(params.staleDailyMemoryDays ?? DEFAULT_STALE_DAILY_MEMORY_DAYS),
  );
  const maxRootMemoryChars = Math.max(
    1,
    Math.floor(params.maxRootMemoryChars ?? DEFAULT_MEMORY_FILE_MAX_CHARS),
  );
  const files = await loadMemoryReportFiles({
    workspaceDir: params.workspaceDir,
    extraPaths: params.extraPaths,
  });
  const recommendations = [
    ...buildRootMemoryRecommendations({ files, maxRootMemoryChars }),
    ...buildDuplicateRecommendations(files),
    ...buildConflictRecommendations(files),
    ...buildOldDailyRecommendations({ files, nowMs, staleDailyMemoryDays }),
  ];
  const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  const totalChars = files.reduce((sum, file) => sum + file.chars, 0);
  return {
    workspaceDir: params.workspaceDir,
    dryRun: true,
    generatedAt: new Date(nowMs).toISOString(),
    summary: {
      files: files.length,
      rootMemoryFiles: files.filter((file) => file.role === "root-memory").length,
      userProfileFiles: files.filter((file) => file.role === "user-profile").length,
      dailyMemoryFiles: files.filter((file) => file.role === "daily-memory").length,
      extraMemoryFiles: files.filter((file) => file.role === "extra-memory").length,
      totalBytes,
      totalChars,
      recommendations: recommendations.length,
    },
    files: files.map(({ absPath: _absPath, content: _content, ...file }) => file),
    recommendations,
  };
}
