import { exec, ExecOptions } from "child_process";
import { promisify } from "util";
import type { GitChange } from "./types.js";

const execAsync = promisify(exec);

export class GitManager {
  private repoPath: string;

  constructor(repoPath = process.cwd()) {
    this.repoPath = repoPath;
  }

  async getStatus(): Promise<GitChange[]> {
    const { stdout } = await execAsync("git status --porcelain", {
      cwd: this.repoPath,
      encoding: "utf-8",
    });

    const lines = stdout.trim().split("\n").filter(Boolean);
    return lines.map((line) => {
      const [status, ...pathParts] = line.trim().split(/\s+/);
      const file = pathParts.join(" ");
      return {
        file,
        status: this.parseStatus(status),
        staged: status.includes(" ") || status[1] !== " ",
      };
    });
  }

  async stageFile(filePath: string): Promise<void> {
    await execAsync(`git add "${filePath}"`, { cwd: this.repoPath });
  }

  async stageAll(): Promise<void> {
    await execAsync("git add -A", { cwd: this.repoPath });
  }

  async unstageFile(filePath: string): Promise<void> {
    await execAsync(`git reset HEAD "${filePath}"`, { cwd: this.repoPath });
  }

  async commit(message: string): Promise<boolean> {
    try {
      await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
        cwd: this.repoPath,
      });
      return true;
    } catch {
      return false;
    }
  }

  async commitWithChanges(changes: GitChange[], maxFiles = 10): Promise<boolean> {
    if (changes.length === 0) return false;

    const message = this.generateCommitMessage(changes.slice(0, maxFiles));
    await this.stageAll();
    return await this.commit(message);
  }

  async push(): Promise<boolean> {
    try {
      await execAsync("git push", { cwd: this.repoPath });
      return true;
    } catch {
      return false;
    }
  }

  async pull(): Promise<boolean> {
    try {
      await execAsync("git pull", { cwd: this.repoPath });
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentBranch(): Promise<string> {
    const { stdout } = await execAsync("git rev-parse --abbrev-ref HEAD", {
      cwd: this.repoPath,
      encoding: "utf-8",
    });
    return stdout.trim();
  }

  async createBranch(branchName: string): Promise<boolean> {
    try {
      await execAsync(`git checkout -b "${branchName}"`, { cwd: this.repoPath });
      return true;
    } catch {
      return false;
    }
  }

  async switchBranch(branchName: string): Promise<boolean> {
    try {
      await execAsync(`git checkout "${branchName}"`, { cwd: this.repoPath });
      return true;
    } catch {
      return false;
    }
  }

  async getDiff(filePath: string): Promise<string> {
    const { stdout } = await execAsync(`git diff "${filePath}"`, {
      cwd: this.repoPath,
      encoding: "utf-8",
    });
    return stdout;
  }

  async getStagedDiff(): Promise<string> {
    const { stdout } = await execAsync("git diff --cached", {
      cwd: this.repoPath,
      encoding: "utf-8",
    });
    return stdout;
  }

  async revertFile(filePath: string): Promise<boolean> {
    try {
      await execAsync(`git checkout HEAD -- "${filePath}"`, { cwd: this.repoPath });
      return true;
    } catch {
      return false;
    }
  }

  async log(limit = 10): Promise<string[]> {
    const { stdout } = await execAsync(`git log --oneline -${limit}`, {
      cwd: this.repoPath,
      encoding: "utf-8",
    });
    return stdout.trim().split("\n").filter(Boolean);
  }

  async getLastCommitMessage(): Promise<string> {
    const { stdout } = await execAsync("git log -1 --pretty=%B", {
      cwd: this.repoPath,
      encoding: "utf-8",
    });
    return stdout.trim();
  }

  private parseStatus(status: string): "modified" | "added" | "deleted" {
    if (status.startsWith("M") || status.endsWith("M")) return "modified";
    if (status.startsWith("A") || status.endsWith("A")) return "added";
    if (status.startsWith("D") || status.endsWith("D")) return "deleted";
    return "modified";
  }

  private generateCommitMessage(changes: GitChange[]): string {
    const files = changes.map((c) => c.file);
    const types = new Set(changes.map((c) => c.status));

    let prefix = "chore";
    if (types.has("added")) prefix = "feat";
    else if (types.has("modified")) prefix = "fix";

    return `${prefix}: automated update - ${files.join(", ")}`;
  }
}
