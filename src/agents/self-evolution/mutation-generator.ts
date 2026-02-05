export interface MutationTemplate {
  name: string;
  description: string;
  parameters: Record<string, number>;
  applicableTo: string[];
  successRate: number;
}

export interface MutationResult {
  template: MutationTemplate;
  success: boolean;
  improvedFitness: boolean;
  fitnessDelta: number;
  duration: number;
}

export interface MutationConfig {
  maxRetries: number;
  timeout: number;
  improvementThreshold: number;
}

export interface MutationAttempt {
  template: MutationTemplate;
  timestamp: Date;
  success: boolean;
  fitnessBefore: number;
  fitnessAfter: number;
}

const DEFAULT_CONFIG: MutationConfig = {
  maxRetries: 3,
  timeout: 10000,
  improvementThreshold: 0.01,
};

export class MutationGenerator {
  private config: MutationConfig;
  private successHistory: MutationAttempt[];
  private templates: Map<string, MutationTemplate>;

  constructor(config: Partial<MutationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.successHistory = [];
    this.templates = new Map();
    this.registerDefaultTemplates();
  }

  private registerDefaultTemplates(): void {
    const defaultTemplates: MutationTemplate[] = [
      {
        name: "parameter_tweak",
        description: "Adjust numeric parameters slightly",
        parameters: { minDelta: -0.1, maxDelta: 0.1 },
        applicableTo: ["numeric_parameter"],
        successRate: 0.7,
      },
      {
        name: "heuristic_add",
        description: "Add new heuristic rule",
        parameters: { maxHeuristics: 5 },
        applicableTo: ["strategy", "policy"],
        successRate: 0.5,
      },
      {
        name: "code_refactor",
        description: "Refactor code for clarity",
        parameters: { preserveSemantics: 1 },
        applicableTo: ["code"],
        successRate: 0.8,
      },
      {
        name: "error_handling",
        description: "Add error handling to code",
        parameters: { catchAll: 1 },
        applicableTo: ["code"],
        successRate: 0.9,
      },
      {
        name: "optimization",
        description: "Optimize for performance",
        parameters: { target: 1 },
        applicableTo: ["code"],
        successRate: 0.6,
      },
      {
        name: "generalization",
        description: "Make code more general",
        parameters: { factor: 0.5 },
        applicableTo: ["code", "strategy"],
        successRate: 0.55,
      },
      {
        name: "specialization",
        description: "Make code more specific",
        parameters: { factor: 0.5 },
        applicableTo: ["code", "strategy"],
        successRate: 0.5,
      },
      {
        name: "noise_injection",
        description: "Add controlled noise to parameters",
        parameters: { noiseLevel: 0.05 },
        applicableTo: ["numeric_parameter"],
        successRate: 0.4,
      },
      {
        name: "crossover_mix",
        description: "Mix strategies from different parents",
        parameters: { mixRatio: 0.5 },
        applicableTo: ["strategy"],
        successRate: 0.65,
      },
      {
        name: "reset_to_default",
        description: "Reset to default values",
        parameters: {},
        applicableTo: ["parameter"],
        successRate: 0.3,
      },
    ];

    for (const template of defaultTemplates) {
      this.templates.set(template.name, template);
    }
  }

  registerTemplate(template: MutationTemplate): void {
    this.templates.set(template.name, template);
  }

  unregisterTemplate(name: string): boolean {
    return this.templates.delete(name);
  }

  getTemplate(name: string): MutationTemplate | undefined {
    return this.templates.get(name);
  }

  getTemplates(): MutationTemplate[] {
    return Array.from(this.templates.values());
  }

  getApplicableTemplates(targetType: string): MutationTemplate[] {
    return Array.from(this.templates.values()).filter((t) => t.applicableTo.includes(targetType));
  }

  generateMutation(
    targetType: string,
    targetData: unknown,
  ): { template: MutationTemplate; mutated: unknown } | null {
    const applicable = this.getApplicableTemplates(targetType);

    if (applicable.length === 0) {
      return null;
    }

    const template = this.selectTemplate(applicable);

    const mutated = this.applyMutation(template, targetData);

    if (mutated === null) {
      return null;
    }

    return { template, mutated };
  }

  private selectTemplate(templates: MutationTemplate[]): MutationTemplate {
    const weights = templates.map((t) => this.calculateWeight(t));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < templates.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return templates[i];
      }
    }

    return templates[templates.length - 1];
  }

  private calculateWeight(template: MutationTemplate): number {
    const recentAttempts = this.successHistory.filter(
      (a) => a.template.name === template.name && Date.now() - a.timestamp.getTime() < 3600000,
    );

    const recentSuccess =
      recentAttempts.length > 0
        ? recentAttempts.filter((a) => a.success).length / recentAttempts.length
        : template.successRate;

    return template.successRate * (1 - recentAttempts.length * 0.1);
  }

  private applyMutation(template: MutationTemplate, data: unknown): unknown {
    switch (template.name) {
      case "parameter_tweak": {
        if (typeof data === "number") {
          const delta =
            (template.parameters.minDelta ?? -0.1) +
            Math.random() *
              ((template.parameters.maxDelta ?? 0.1) - (template.parameters.minDelta ?? -0.1));
          return data + delta;
        }
        if (typeof data === "object" && data !== null) {
          const result = { ...(data as Record<string, unknown>) };
          for (const key of Object.keys(result)) {
            if (typeof result[key] === "number") {
              const delta =
                (template.parameters.minDelta ?? -0.1) +
                Math.random() *
                  ((template.parameters.maxDelta ?? 0.1) - (template.parameters.minDelta ?? -0.1));
              result[key] = (result[key] as number) + delta;
            }
          }
          return result;
        }
        return data;
      }

      case "heuristic_add": {
        if (typeof data === "object" && data !== null) {
          const heuristics = (data as Record<string, unknown>).heuristics as string[] | undefined;
          if (heuristics && heuristics.length < (template.parameters.maxHeuristics ?? 5)) {
            const newHeuristics = [
              "aggressive",
              "conservative",
              "balanced",
              "exploratory",
              "exploitative",
              "adaptive",
              "reactive",
              "predictive",
              "statistical",
              "empirical",
            ];
            const available = newHeuristics.filter((h) => !heuristics.includes(h));
            if (available.length > 0) {
              const result = {
                ...(data as Record<string, unknown>),
                heuristics: [...heuristics, available[0]],
              };
              return result;
            }
          }
        }
        return data;
      }

      case "code_refactor": {
        if (typeof data === "string") {
          let code = data;
          code = code.replace(/\s+/g, " ").trim();
          code = code.replace(/\s*([{}()[\]])\s*/g, "$1");
          code = code.replace(/,\s*/g, ", ");
          return code;
        }
        return data;
      }

      case "error_handling": {
        if (typeof data === "string") {
          const lines = data.split("\n");
          const hasTry = lines.some((l) => l.includes("try:"));
          if (!hasTry) {
            const indentedLines = lines.map((l) => (l.trim() ? "    " + l : l));
            const newCode = ["try:"]
              .concat(indentedLines)
              .concat(["except Exception as e:", "    print(f'Error: {e}')"])
              .join("\n");
            return newCode;
          }
        }
        return data;
      }

      case "optimization": {
        if (typeof data === "string") {
          let code = data;
          code = code.replace(/for\s+(\w+)\s+in\s+range\((\d+)\):/g, (match, varName, count) => {
            return `for ${varName} in range(min(${count}, 1000)):`;
          });
          return code;
        }
        return data;
      }

      case "generalization":
      case "specialization": {
        if (typeof data === "object" && data !== null) {
          const result = { ...(data as Record<string, unknown>) };
          for (const key of Object.keys(result)) {
            if (typeof result[key] === "number") {
              const current = result[key] as number;
              const factor = template.parameters.factor ?? 0.5;
              if (template.name === "generalization") {
                result[key] = current * (1 - factor * 0.1);
              } else {
                result[key] = current * (1 + factor * 0.1);
              }
            }
          }
          return result;
        }
        return data;
      }

      case "noise_injection": {
        if (typeof data === "number") {
          const noiseLevel = template.parameters.noiseLevel ?? 0.05;
          const noise = (Math.random() - 0.5) * 2 * noiseLevel * Math.abs(data);
          return data + noise;
        }
        return data;
      }

      case "reset_to_default": {
        if (typeof data === "object" && data !== null) {
          const result = { ...(data as Record<string, unknown>) };
          for (const key of Object.keys(result)) {
            if (typeof result[key] === "number") {
              result[key] = 0.5;
            }
          }
          return result;
        }
        return data;
      }

      default:
        return data;
    }
  }

  recordAttempt(attempt: MutationAttempt): void {
    this.successHistory.push(attempt);

    if (this.successHistory.length > 1000) {
      this.successHistory = this.successHistory.slice(-500);
    }
  }

  getSuccessRate(templateName: string): number {
    const attempts = this.successHistory.filter((a) => a.template.name === templateName);
    if (attempts.length === 0) {
      const template = this.templates.get(templateName);
      return template?.successRate ?? 0;
    }

    const successes = attempts.filter((a) => a.success).length;
    return successes / attempts.length;
  }

  getStatistics(): {
    totalAttempts: number;
    totalSuccesses: number;
    averageSuccessRate: number;
    bestTemplate: string;
    worstTemplate: string;
  } {
    const attempts = this.successHistory.length;
    const successes = this.successHistory.filter((a) => a.success).length;

    const templateStats = new Map<string, { attempts: number; successes: number }>();
    for (const template of this.templates.values()) {
      templateStats.set(template.name, { attempts: 0, successes: 0 });
    }

    for (const attempt of this.successHistory) {
      const stats = templateStats.get(attempt.template.name);
      if (stats) {
        stats.attempts++;
        if (attempt.success) stats.successes++;
      }
    }

    let bestTemplate = "";
    let bestRate = 0;
    let worstTemplate = "";
    let worstRate = 1;

    for (const [name, stats] of templateStats) {
      const rate = stats.attempts > 0 ? stats.successes / stats.attempts : 0;
      if (rate > bestRate) {
        bestRate = rate;
        bestTemplate = name;
      }
      if (rate < worstRate) {
        worstRate = rate;
        worstTemplate = name;
      }
    }

    return {
      totalAttempts: attempts,
      totalSuccesses: successes,
      averageSuccessRate: attempts > 0 ? successes / attempts : 0,
      bestTemplate,
      worstTemplate,
    };
  }

  clearHistory(): void {
    this.successHistory = [];
  }
}
