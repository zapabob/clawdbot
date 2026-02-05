import { exec, execSync } from "child_process";
import { promisify } from "util";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import {
  EvolutionaryEngine,
  type Individual,
  type EvolutionConfig,
} from "../../evolution/evolution-engine.js";

const execAsync = promisify(exec);

export interface Patch {
  filePath: string;
  originalContent: string;
  newContent: string;
  description: string;
  timestamp: Date;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ModificationRequest {
  filePath: string;
  issue: string;
  severity: "critical" | "high" | "medium" | "low";
  suggestedFix?: string;
  requireApproval: boolean;
}

export interface ModificationResult {
  success: boolean;
  patches: Patch[];
  validation: ValidationResult;
  approvalRequired: boolean;
  approvedBy?: string;
  timestamp: Date;
}

const CODE_BASE_DIR = process.cwd();
const PATCH_DIR = ".patches";
const APPROVAL_TIMEOUT = 300000;

const CRITICAL_PATTERNS = [
  /eval\s*\(/,
  /exec\s*\(/,
  /__import__\s*\(/,
  /pickle\.loads/,
  /subprocess.*shell.*true/i,
];

const SENSITIVE_PATTERNS = [
  /password\s*[:=]\s*["'][^"']+["']/i,
  /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
  /secret\s*[:=]\s*["'][^"']+["']/i,
  /token\s*[:=]\s*["'][^"']+["']/i,
];

export class CodeModifier {
  private pendingModifications: Map<string, ModificationRequest>;
  private patchHistory: Patch[];
  private approvalQueue: ModificationRequest[];
  private autoApprovePatterns: RegExp[];

  constructor() {
    this.pendingModifications = new Map();
    this.patchHistory = [];
    this.approvalQueue = [];
    this.autoApprovePatterns = [
      /add_type_hints/,
      /rename_variables/,
      /add_comments/,
      /format_code/,
      /fix_typo/,
    ];

    if (!existsSync(PATCH_DIR)) {
      mkdirSync(PATCH_DIR, { recursive: true });
    }
  }

  async requestModification(request: ModificationRequest): Promise<ModificationResult> {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (!existsSync(request.filePath)) {
      return {
        success: false,
        patches: [],
        validation: {
          valid: false,
          errors: [`File not found: ${request.filePath}`],
          warnings: [],
          suggestions: [],
        },
        approvalRequired: false,
        timestamp: new Date(),
      };
    }

    const originalContent = readFileSync(request.filePath, "utf-8");

    if (request.severity === "critical" || request.severity === "high") {
      const validation = this.validatePatch(
        request.filePath,
        originalContent,
        request.suggestedFix || "",
      );
      if (!validation.valid) {
        return {
          success: false,
          patches: [],
          validation,
          approvalRequired: true,
          timestamp: new Date(),
        };
      }
    }

    const shouldAutoApprove = this.autoApprovePatterns.some((p) => p.test(request.issue));

    if (shouldAutoApprove) {
      const result = await this.applyModification(request);
      return result;
    }

    this.approvalQueue.push(request);
    this.pendingModifications.set(id, request);

    return {
      success: true,
      patches: [],
      validation: {
        valid: true,
        errors: [],
        warnings: [],
        suggestions: ["Pending approval"],
      },
      approvalRequired: true,
      timestamp: new Date(),
    };
  }

  async applyModification(request: ModificationRequest): Promise<ModificationResult> {
    const filePath = request.filePath;

    if (!existsSync(filePath)) {
      return {
        success: false,
        patches: [],
        validation: { valid: false, errors: ["File not found"], warnings: [], suggestions: [] },
        approvalRequired: false,
        timestamp: new Date(),
      };
    }

    const originalContent = readFileSync(filePath, "utf-8");
    let newContent = originalContent;

    if (request.suggestedFix) {
      newContent = this.applyPatch(originalContent, request.suggestedFix);
    }

    const validation = this.validatePatch(filePath, originalContent, newContent);

    if (!validation.valid && request.severity !== "low") {
      return {
        success: false,
        patches: [],
        validation,
        approvalRequired: true,
        timestamp: new Date(),
      };
    }

    const patch: Patch = {
      filePath,
      originalContent,
      newContent,
      description: request.issue,
      timestamp: new Date(),
    };

    try {
      this.backupFile(filePath);
      writeFileSync(filePath, newContent, "utf-8");
      this.patchHistory.push(patch);
      this.savePatch(patch);

      return {
        success: true,
        patches: [patch],
        validation,
        approvalRequired: false,
        approvedBy: "auto",
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        patches: [],
        validation: {
          valid: false,
          errors: [`Failed to write file: ${error}`],
          warnings: [],
          suggestions: [],
        },
        approvalRequired: false,
        timestamp: new Date(),
      };
    }
  }

  private applyPatch(original: string, patch: string): string {
    if (patch.startsWith("@@")) {
      const lines = original.split("\n");
      const patchLines = patch.split("\n");
      let inHunk = false;
      let hunkStart = 0;
      let hunkOldCount = 0;
      let hunkNewCount = 0;
      interface HunkLine {
        type: string;
        content: string;
      }
      const hunkContent: HunkLine[] = [];

      for (let i = 0; i < patchLines.length; i++) {
        const line = patchLines[i];

        if (line.startsWith("@@")) {
          inHunk = true;
          const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
          if (match) {
            hunkStart = parseInt(match[1]) - 1;
            hunkOldCount = parseInt(match[2] || "1");
            hunkNewCount = parseInt(match[4] || "1");
          }
          continue;
        }

        if (inHunk) {
          if (line.startsWith("-") && !line.startsWith("---")) {
            hunkContent.push({ type: "remove", content: line.slice(1) });
          } else if (line.startsWith("+") && !line.startsWith("+++")) {
            hunkContent.push({ type: "add", content: line.slice(1) });
          } else if (line.startsWith(" ")) {
            hunkContent.push({ type: "keep", content: line.slice(1) });
          }
        }
      }

      const resultLines: string[] = [];
      let originalIndex = 0;
      let patchIndex = 0;

      while (originalIndex < lines.length || patchIndex < hunkContent.length) {
        if (patchIndex >= hunkContent.length || originalIndex < hunkStart) {
          resultLines.push(lines[originalIndex]);
          originalIndex++;
        } else {
          const hunk = hunkContent[patchIndex];
          if (hunk.type === "keep") {
            resultLines.push(hunk.content);
            originalIndex++;
            patchIndex++;
          } else if (hunk.type === "remove") {
            if (lines[originalIndex] === hunk.content) {
              originalIndex++;
              patchIndex++;
            } else {
              originalIndex++;
            }
          } else if (hunk.type === "add") {
            resultLines.push(hunk.content);
            patchIndex++;
          }
        }
      }

      return resultLines.join("\n");
    }

    const diffMatch = patch.match(/^([+-]{3} [^\n]+\n)([@@].*?\n)((?:[+-].*\n)+)/);
    if (diffMatch) {
      const oldLines = diffMatch[3]
        .split("\n")
        .filter((l) => l.startsWith("-") && !l.startsWith("---"))
        .map((l) => l.slice(1));
      const newLines = diffMatch[3]
        .split("\n")
        .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
        .map((l) => l.slice(1));

      let result = original;
      for (let i = 0; i < oldLines.length; i++) {
        result = result.replace(oldLines[i], newLines[i] || "");
      }
      return result;
    }

    return patch;
  }

  validatePatch(filePath: string, original: string, modified: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!modified || modified.trim() === "") {
      errors.push("Modified content is empty");
    }

    if (original.length > 10000) {
      warnings.push("Large file modification - consider breaking into smaller patches");
    }

    for (const pattern of CRITICAL_PATTERNS) {
      if (pattern.test(modified) && !pattern.test(original)) {
        errors.push(`Potentially dangerous code pattern detected: ${pattern.source}`);
      }
    }

    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(modified) && !pattern.test(original)) {
        warnings.push(`Potential sensitive data exposure: ${pattern.source}`);
        suggestions.push("Use environment variables for sensitive data");
      }
    }

    const modifiedLines = modified.split("\n");
    const originalLines = original.split("\n");

    if (modifiedLines.length > originalLines.length * 2) {
      warnings.push("Significant code bloat detected");
      suggestions.push("Consider refactoring instead of adding code");
    }

    if (!modified.includes(original.slice(0, 100))) {
      suggestions.push("Consider preserving original code structure where possible");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  private backupFile(filePath: string): void {
    const timestamp = Date.now();
    const backupPath = join(PATCH_DIR, `${timestamp}_${filePath.replace(/[\/\\]/g, "_")}.bak`);
    try {
      writeFileSync(backupPath, readFileSync(filePath), "utf-8");
    } catch (error) {
      console.error("Backup failed:", error);
    }
  }

  private savePatch(patch: Patch): void {
    const patchPath = join(PATCH_DIR, `${Date.now()}_patch.json`);
    try {
      writeFileSync(patchPath, JSON.stringify(patch, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save patch:", error);
    }
  }

  async approveModification(index: number, approver: string = "system"): Promise<boolean> {
    if (index < 0 || index >= this.approvalQueue.length) {
      return false;
    }

    const request = this.approvalQueue[index];
    const result = await this.applyModification(request);

    if (result.success) {
      this.approvalQueue.splice(index, 1);
    }

    return result.success;
  }

  rejectModification(index: number, reason: string): boolean {
    if (index < 0 || index >= this.approvalQueue.length) {
      return false;
    }

    this.approvalQueue.splice(index, 1);
    return true;
  }

  getApprovalQueue(): ModificationRequest[] {
    return [...this.approvalQueue];
  }

  getPatchHistory(): Patch[] {
    return [...this.patchHistory];
  }

  async undoLastPatch(): Promise<boolean> {
    if (this.patchHistory.length === 0) {
      return false;
    }

    const lastPatch = this.patchHistory.pop();
    if (lastPatch) {
      try {
        writeFileSync(lastPatch.filePath, lastPatch.originalContent, "utf-8");
        return true;
      } catch (error) {
        console.error("Undo failed:", error);
        return false;
      }
    }

    return false;
  }

  async revertToPatch(patchId: string): Promise<boolean> {
    const patchPath = join(PATCH_DIR, `${patchId}_patch.json`);

    if (!existsSync(patchPath)) {
      return false;
    }

    try {
      const patch: Patch = JSON.parse(readFileSync(patchPath, "utf-8"));
      writeFileSync(patch.filePath, patch.originalContent, "utf-8");
      return true;
    } catch (error) {
      console.error("Revert failed:", error);
      return false;
    }
  }
}
