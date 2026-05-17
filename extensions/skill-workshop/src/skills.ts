import fs from "node:fs/promises";
import path from "node:path";
import {
  pathExists,
  replaceFileAtomic,
  resolvePathWithinRoot,
} from "openclaw/plugin-sdk/security-runtime";
import { bumpSkillsSnapshotVersion } from "../api.js";
import { assertSkillContentSafe, scanSkillContent } from "./scanner.js";
import type { SkillProposal, SkillScanFinding } from "./types.js";

const VALID_SKILL_NAME = /^[a-z0-9][a-z0-9_-]{1,79}$/;
const VALID_SECTION = /^[A-Za-z0-9][A-Za-z0-9 _./:-]{0,80}$/;
const SUPPORT_DIRS = new Set(["references", "templates", "scripts", "assets"]);

export function normalizeSkillName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^[^a-z0-9]+/, "")
    .replace(/[^a-z0-9]+$/, "")
    .slice(0, 80);
}

function assertValidSkillName(name: string): string {
  const normalized = normalizeSkillName(name);
  if (!VALID_SKILL_NAME.test(normalized)) {
    throw new Error(`invalid skill name: ${name}`);
  }
  return normalized;
}

function assertValidSection(section: string): string {
  const trimmed = section.trim();
  if (!VALID_SECTION.test(trimmed)) {
    throw new Error(`invalid section: ${section}`);
  }
  return trimmed;
}

function skillDir(workspaceDir: string, skillName: string): string {
  const safeName = assertValidSkillName(skillName);
  const root = path.resolve(workspaceDir, "skills");
  const dir = resolvePathWithinRoot({
    rootDir: root,
    requestedPath: safeName,
    scopeLabel: "workspace skills directory",
  });
  if (!dir.ok) {
    throw new Error("skill path escapes workspace skills directory");
  }
  return dir.path;
}

function skillPath(workspaceDir: string, skillName: string): string {
  return path.join(skillDir(workspaceDir, skillName), "SKILL.md");
}

function supportFilePath(workspaceDir: string, skillName: string, relativePath: string): string {
  const name = assertValidSkillName(skillName);
  const parts = relativePath.split(/[\\/]+/).filter(Boolean);
  if (parts.length < 2 || !SUPPORT_DIRS.has(parts[0])) {
    throw new Error(`support file path must start with ${Array.from(SUPPORT_DIRS).join(", ")}`);
  }
  if (parts.some((part) => part === "." || part === "..")) {
    throw new Error("support file path escapes skill directory");
  }
  const target = resolvePathWithinRoot({
    rootDir: skillDir(workspaceDir, name),
    requestedPath: path.join(...parts),
    scopeLabel: "skill directory",
  });
  if (!target.ok) {
    throw new Error("support file path escapes skill directory");
  }
  return target.path;
}

async function atomicWrite(filePath: string, content: string): Promise<void> {
  await replaceFileAtomic({
    filePath,
    content,
    tempPrefix: ".skill-workshop",
  });
}

function formatSkillMarkdown(params: { name: string; description: string; body: string }): string {
  const description = params.description.replace(/\s+/g, " ").trim();
  if (!description) {
    throw new Error("description required");
  }
  const body = params.body.trim();
  return `---\nname: ${params.name}\ndescription: ${description}\n---\n\n${body}\n`;
}

function ensureBodyUnderLimit(content: string, maxSkillBytes: number): void {
  if (Buffer.byteLength(content, "utf8") > maxSkillBytes) {
    throw new Error(`skill exceeds ${maxSkillBytes} bytes`);
  }
}

function appendSection(markdown: string, section: string, body: string): string {
  const heading = `## ${assertValidSection(section)}`;
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    throw new Error("body required");
  }
  if (markdown.includes(trimmedBody)) {
    return markdown.endsWith("\n") ? markdown : `${markdown}\n`;
  }
  if (!markdown.includes(heading)) {
    return `${markdown.trimEnd()}\n\n${heading}\n\n${trimmedBody}\n`;
  }
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return markdown.replace(new RegExp(`(${escaped}\\n)`), `$1\n${trimmedBody}\n`);
}

export async function prepareProposalWrite(params: {
  proposal: SkillProposal;
  maxSkillBytes: number;
}): Promise<{
  skillPath: string;
  content: string;
  created: boolean;
  findings: SkillScanFinding[];
  targetKind: "skill" | "support";
}> {
  const name = assertValidSkillName(params.proposal.skillName);
  const change = params.proposal.change;
  if (change.kind === "write_file") {
    const target = supportFilePath(params.proposal.workspaceDir, name, change.relativePath);
    const next = `${change.body.trimEnd()}\n`;
    ensureBodyUnderLimit(next, params.maxSkillBytes);
    const findings = scanSkillContent(next);
    return {
      skillPath: target,
      content: next,
      created: !(await pathExists(target)),
      findings,
      targetKind: "support",
    };
  }
  const target = skillPath(params.proposal.workspaceDir, name);
  const exists = await pathExists(target);
  let next: string;
  if (change.kind === "create") {
    next = exists
      ? appendSection(await fs.readFile(target, "utf8"), "Workflow", change.body)
      : formatSkillMarkdown({ name, description: change.description, body: change.body });
  } else if (change.kind === "append") {
    const current = exists
      ? await fs.readFile(target, "utf8")
      : formatSkillMarkdown({
          name,
          description: change.description ?? params.proposal.title,
          body: "# Workflow\n",
        });
    next = appendSection(current, change.section, change.body);
  } else {
    if (!exists) {
      throw new Error(`skill does not exist: ${name}`);
    }
    const current = await fs.readFile(target, "utf8");
    if (!current.includes(change.oldText)) {
      throw new Error("oldText not found");
    }
    next = current.replace(change.oldText, change.newText);
  }
  ensureBodyUnderLimit(next, params.maxSkillBytes);
  const findings = scanSkillContent(next);
  return { skillPath: target, content: next, created: !exists, findings, targetKind: "skill" };
}

export async function applyProposalToWorkspace(params: {
  proposal: SkillProposal;
  maxSkillBytes: number;
}): Promise<{ skillPath: string; created: boolean; findings: SkillScanFinding[] }> {
  const prepared = await prepareProposalWrite(params);
  assertSkillContentSafe(prepared.content);
  await atomicWrite(prepared.skillPath, prepared.content);
  bumpSkillsSnapshotVersion({
    workspaceDir: params.proposal.workspaceDir,
    reason: "manual",
    changedPath: prepared.skillPath,
  });
  return { skillPath: prepared.skillPath, created: prepared.created, findings: prepared.findings };
}

export async function writeSupportFile(params: {
  workspaceDir: string;
  skillName: string;
  relativePath: string;
  content: string;
  maxBytes: number;
}): Promise<string> {
  if (Buffer.byteLength(params.content, "utf8") > params.maxBytes) {
    throw new Error(`support file exceeds ${params.maxBytes} bytes`);
  }
  assertSkillContentSafe(params.content);
  const target = supportFilePath(params.workspaceDir, params.skillName, params.relativePath);
  await atomicWrite(target, `${params.content.trimEnd()}\n`);
  return target;
}
