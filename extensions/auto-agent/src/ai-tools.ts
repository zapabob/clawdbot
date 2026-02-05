import { exec, ExecOptions } from "child_process";
import { promisify } from "util";
import type { CodeIssue, ImprovementSuggestion } from "./types.js";
import type { AIToolType } from "./types.js";

const execAsync = promisify(exec);

export class AIToolClient {
  private tool: AIToolType;
  private timeoutMs: number;

  constructor(tool: AIToolType, timeoutMs = 60000) {
    this.tool = tool;
    this.timeoutMs = timeoutMs;
  }

  async checkConnection(): Promise<boolean> {
    try {
      switch (this.tool) {
        case "codex":
          await execAsync("codex --version", { timeout: 5000 });
          return true;
        case "gemini":
          await execAsync("gemini --version", { timeout: 5000 });
          return true;
        case "opencode":
          await execAsync("opencode --version", { timeout: 5000 });
          return true;
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  async analyzeCode(filePath: string, code: string): Promise<CodeIssue[]> {
    const prompt = this.buildAnalysisPrompt(filePath, code);
    try {
      const result = await this.executePrompt(prompt);
      return this.parseIssues(result);
    } catch (error) {
      console.error(`[AutoAgent] Failed to analyze code with ${this.tool}:`, error);
      return [];
    }
  }

  async suggestImprovements(filePath: string, code: string): Promise<ImprovementSuggestion[]> {
    const prompt = this.buildImprovementPrompt(filePath, code);
    try {
      const result = await this.executePrompt(prompt);
      return this.parseImprovements(result);
    } catch (error) {
      console.error(`[AutoAgent] Failed to get improvements from ${this.tool}:`, error);
      return [];
    }
  }

  async generateFix(issue: CodeIssue, filePath: string, code: string): Promise<string> {
    const prompt = this.buildFixPrompt(issue, filePath, code);
    try {
      const result = await this.executePrompt(prompt);
      return this.extractCode(result);
    } catch (error) {
      console.error(`[AutoAgent] Failed to generate fix with ${this.tool}:`, error);
      return "";
    }
  }

  async generateTests(filePath: string, code: string): Promise<string> {
    const prompt = this.buildTestPrompt(filePath, code);
    try {
      const result = await this.executePrompt(prompt);
      return this.extractCode(result);
    } catch (error) {
      console.error(`[AutoAgent] Failed to generate tests with ${this.tool}:`, error);
      return "";
    }
  }

  async explainCode(code: string): Promise<string> {
    const prompt = `Explain this code concisely:\n\n${code}`;
    try {
      return await this.executePrompt(prompt);
    } catch (error) {
      console.error(`[AutoAgent] Failed to explain code with ${this.tool}:`, error);
      return "Unable to explain code";
    }
  }

  private async executePrompt(prompt: string): Promise<string> {
    const options: ExecOptions = {
      timeout: this.timeoutMs,
      encoding: "utf-8",
    };

    let command: string;
    switch (this.tool) {
      case "codex":
        command = `echo "${prompt.replace(/"/g, '\\"')}" | codex`;
        break;
      case "gemini":
        command = `echo "${prompt.replace(/"/g, '\\"')}" | gemini`;
        break;
      case "opencode":
        command = `echo "${prompt.replace(/"/g, '\\"')}" | opencode`;
        break;
      default:
        throw new Error(`Unknown AI tool: ${this.tool}`);
    }

    const { stdout } = await execAsync(command, options);
    return String(stdout).trim();
  }

  private buildAnalysisPrompt(filePath: string, code: string): string {
    return `Analyze this code file ${filePath} and identify any issues. Return JSON array of issues with: file, line, type (error/warning/improvement), message, severity (1-10):\n\n${code}`;
  }

  private buildImprovementPrompt(filePath: string, code: string): string {
    return `Suggest improvements for this code file ${filePath}. Return JSON array with: file, type (performance/readability/security/maintainability), description, suggestedCode (optional):\n\n${code}`;
  }

  private buildFixPrompt(issue: CodeIssue, filePath: string, code: string): string {
    return `Fix this issue in ${filePath}:\nIssue: ${issue.message} (line ${issue.line || "N/A"})\nProvide the fixed code only:\n${code}`;
  }

  private buildTestPrompt(filePath: string, code: string): string {
    return `Generate unit tests for this code file ${filePath}. Return the test code only:\n\n${code}`;
  }

  private parseIssues(output: string): CodeIssue[] {
    try {
      return JSON.parse(output);
    } catch {
      return [];
    }
  }

  private parseImprovements(output: string): ImprovementSuggestion[] {
    try {
      return JSON.parse(output);
    } catch {
      return [];
    }
  }

  private extractCode(output: string): string {
    const codeBlockMatch = output.match(/```[\w]*\n([\s\S]*?)```/);
    return codeBlockMatch ? codeBlockMatch[1].trim() : output.trim();
  }
}
