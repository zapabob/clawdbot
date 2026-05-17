import fs from "node:fs/promises";
import path from "node:path";
import type { SkillProposal, SkillWorkshopStatus } from "./types.js";

type CuratorSkillEntry = {
  name: string;
  hasSkillFile: boolean;
  skillBytes: number;
  supportFiles: number;
};

type CuratorRecommendation = {
  kind:
    | "review_pending_proposal"
    | "inspect_quarantined_proposal"
    | "split_large_skill"
    | "repair_missing_skill_file";
  severity: "info" | "warn";
  message: string;
  skillName?: string;
  proposalId?: string;
};

export type SkillWorkshopCuratorReport = {
  dryRun: true;
  generatedAt: number;
  workspaceDir: string;
  summary: {
    skills: number;
    supportFiles: number;
    proposals: Record<SkillWorkshopStatus, number>;
    recommendations: number;
  };
  skills: CuratorSkillEntry[];
  recommendations: CuratorRecommendation[];
};

const SUPPORT_DIRS = new Set(["assets", "references", "scripts", "templates"]);
const DEFAULT_STALE_PENDING_DAYS = 30;

async function readDirents(targetDir: string) {
  try {
    return await fs.readdir(targetDir, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function fileSize(targetPath: string): Promise<number> {
  try {
    const stat = await fs.stat(targetPath);
    return stat.isFile() ? stat.size : 0;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return 0;
    }
    throw error;
  }
}

async function countSupportFiles(skillDir: string): Promise<number> {
  let count = 0;
  for (const dirent of await readDirents(skillDir)) {
    if (!dirent.isDirectory() || !SUPPORT_DIRS.has(dirent.name)) {
      continue;
    }
    count += await countFiles(path.join(skillDir, dirent.name));
  }
  return count;
}

async function countFiles(root: string): Promise<number> {
  let count = 0;
  for (const dirent of await readDirents(root)) {
    const child = path.join(root, dirent.name);
    if (dirent.isDirectory()) {
      count += await countFiles(child);
    } else if (dirent.isFile()) {
      count += 1;
    }
  }
  return count;
}

function emptyProposalCounts(): Record<SkillWorkshopStatus, number> {
  return {
    pending: 0,
    applied: 0,
    rejected: 0,
    quarantined: 0,
  };
}

function countProposals(proposals: SkillProposal[]): Record<SkillWorkshopStatus, number> {
  const counts = emptyProposalCounts();
  for (const proposal of proposals) {
    counts[proposal.status] += 1;
  }
  return counts;
}

function proposalAgeDays(proposal: SkillProposal, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - proposal.createdAt) / 86_400_000));
}

export async function buildSkillWorkshopCuratorReport(params: {
  workspaceDir: string;
  proposals: SkillProposal[];
  maxSkillBytes: number;
  nowMs?: number;
  stalePendingDays?: number;
}): Promise<SkillWorkshopCuratorReport> {
  const nowMs = params.nowMs ?? Date.now();
  const stalePendingDays = params.stalePendingDays ?? DEFAULT_STALE_PENDING_DAYS;
  const skillsDir = path.join(params.workspaceDir, "skills");
  const skills: CuratorSkillEntry[] = [];
  const recommendations: CuratorRecommendation[] = [];

  for (const dirent of await readDirents(skillsDir)) {
    if (!dirent.isDirectory()) {
      continue;
    }
    const skillDir = path.join(skillsDir, dirent.name);
    const skillFile = path.join(skillDir, "SKILL.md");
    const skillBytes = await fileSize(skillFile);
    const hasSkillFile = skillBytes > 0;
    const supportFiles = await countSupportFiles(skillDir);
    const skill = {
      name: dirent.name,
      hasSkillFile,
      skillBytes,
      supportFiles,
    };
    skills.push(skill);

    if (!hasSkillFile) {
      recommendations.push({
        kind: "repair_missing_skill_file",
        severity: "warn",
        skillName: dirent.name,
        message: `Skill ${dirent.name} has no SKILL.md file.`,
      });
    } else if (skillBytes >= Math.floor(params.maxSkillBytes * 0.8)) {
      recommendations.push({
        kind: "split_large_skill",
        severity: "info",
        skillName: dirent.name,
        message: `Skill ${dirent.name} is near the configured size limit; consider moving long material into support files.`,
      });
    }
  }

  for (const proposal of params.proposals) {
    if (proposal.status === "quarantined") {
      recommendations.push({
        kind: "inspect_quarantined_proposal",
        severity: "warn",
        skillName: proposal.skillName,
        proposalId: proposal.id,
        message: `Quarantined proposal for ${proposal.skillName} needs operator review.`,
      });
      continue;
    }
    if (proposal.status !== "pending") {
      continue;
    }
    const ageDays = proposalAgeDays(proposal, nowMs);
    if (ageDays >= stalePendingDays) {
      recommendations.push({
        kind: "review_pending_proposal",
        severity: "info",
        skillName: proposal.skillName,
        proposalId: proposal.id,
        message: `Pending proposal for ${proposal.skillName} has waited ${ageDays} days.`,
      });
    }
  }

  const proposalCounts = countProposals(params.proposals);
  const sortedSkills = skills.toSorted((left, right) => left.name.localeCompare(right.name));

  return {
    dryRun: true,
    generatedAt: nowMs,
    workspaceDir: params.workspaceDir,
    summary: {
      skills: sortedSkills.length,
      supportFiles: sortedSkills.reduce((sum, skill) => sum + skill.supportFiles, 0),
      proposals: proposalCounts,
      recommendations: recommendations.length,
    },
    skills: sortedSkills,
    recommendations,
  };
}
