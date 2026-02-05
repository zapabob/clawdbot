import type { Genome, Individual } from "./population.js";

export interface FitnessMetrics {
  correctness: number;
  efficiency: number;
  readability: number;
  maintainability: number;
  security: number;
  testCoverage: number;
}

export interface FitnessConfig {
  weights: Partial<FitnessMetrics>;
  timeout: number;
  maxCodeLength: number;
  minCodeLength: number;
}

export interface EvaluationResult {
  individual: Individual;
  metrics: FitnessMetrics;
  fitness: number;
  errors: string[];
  executionTime: number;
}

const DEFAULT_CONFIG: FitnessConfig = {
  weights: {
    correctness: 0.35,
    efficiency: 0.2,
    readability: 0.15,
    maintainability: 0.1,
    security: 0.1,
    testCoverage: 0.1,
  },
  timeout: 5000,
  maxCodeLength: 10000,
  minCodeLength: 10,
};

export class FitnessEvaluator {
  private config: FitnessConfig;
  private cache: Map<string, number>;

  constructor(config: Partial<FitnessConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();
  }

  evaluate(individual: Individual): EvaluationResult {
    const startTime = Date.now();
    const errors: string[] = [];
    let metrics: FitnessMetrics = {
      correctness: 0,
      efficiency: 0,
      readability: 0,
      maintainability: 0,
      security: 0,
      testCoverage: 0,
    };

    const cacheKey = this.getCacheKey(individual.genome);
    if (this.cache.has(cacheKey)) {
      return {
        individual,
        metrics,
        fitness: this.cache.get(cacheKey)!,
        errors,
        executionTime: Date.now() - startTime,
      };
    }

    try {
      metrics = this.computeMetrics(individual.genome);
    } catch (error) {
      errors.push(`Evaluation error: ${error}`);
      metrics = this.getDefaultMetrics();
    }

    const fitness = this.computeWeightedFitness(metrics);

    if (errors.length === 0) {
      this.cache.set(cacheKey, fitness);
    }

    return {
      individual,
      metrics,
      fitness,
      errors,
      executionTime: Date.now() - startTime,
    };
  }

  evaluateAll(individuals: Individual[]): EvaluationResult[] {
    return individuals.map((ind) => this.evaluate(ind));
  }

  private computeMetrics(genome: Genome): FitnessMetrics {
    const code = genome.code;

    return {
      correctness: this.assessCorrectness(code),
      efficiency: this.assessEfficiency(code),
      readability: this.assessReadability(code),
      maintainability: this.assessMaintainability(code),
      security: this.assessSecurity(code),
      testCoverage: this.assessTestCoverage(code),
    };
  }

  private assessCorrectness(code: string): number {
    if (!code || code.length < this.config.minCodeLength) return 0;

    let score = 0.5;

    const syntaxErrors = this.detectSyntaxErrors(code);
    score -= syntaxErrors * 0.1;

    const hasErrorHandling = /\btry\s*\{|\bcatch\s*\(|\bexcept\b|\btry\s*:/.test(code);
    if (hasErrorHandling) score += 0.1;

    const hasReturn = /\breturn\b/.test(code);
    if (hasReturn) score += 0.1;

    const hasTypeHints = /:\s*(str|int|bool|list|dict|tuple|float|None|Optional|List|Dict)\b/.test(
      code,
    );
    if (hasTypeHints) score += 0.1;

    const balancedParens = this.checkBalanced(code, "(", ")");
    const balancedBraces = this.checkBalanced(code, "{", "}");
    const balancedBrackets = this.checkBalanced(code, "[", "]");
    if (balancedParens && balancedBraces && balancedBrackets) score += 0.2;

    return Math.max(0, Math.min(1, score));
  }

  private assessEfficiency(code: string): number {
    if (!code) return 0;

    let score = 0.7;

    const loops = (code.match(/\bfor\s|\bwhile\s/g) || []).length;
    score -= Math.min(loops * 0.05, 0.2);

    const hasListComp = /\[.*for.*in.*\]/.test(code);
    if (hasListComp) score += 0.1;

    const hasGenerator = /\b\(.*for.*in.*\)/.test(code);
    if (hasGenerator) score += 0.1;

    const hasMemoization = /\bcache\b|\blru_cache\b|\bmemoize\b/.test(code);
    if (hasMemoization) score += 0.1;

    const hasEarlyReturn = /\breturn\b.*\breturn\b/.test(code);
    if (!hasEarlyReturn) score += 0.1;

    const complexityMatch = code.match(/cyclomatic\s*complexity/i);
    if (complexityMatch) {
      const complexity = parseInt(complexityMatch[1]) || 10;
      score -= Math.max(0, (complexity - 10) * 0.02);
    }

    return Math.max(0, Math.min(1, score));
  }

  private assessReadability(code: string): number {
    if (!code) return 0;

    let score = 0.6;

    const lines = code.split("\n");
    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
    if (avgLineLength > 0 && avgLineLength < 80) score += 0.15;
    else if (avgLineLength > 120) score -= 0.1;

    const hasComments = /\/\/|\/\*|#/.test(code);
    if (hasComments) score += 0.15;

    const hasDocstring = /["']{3}|"""[^"""]*"""/.test(code);
    if (hasDocstring) score += 0.1;

    const functions = (code.match(/def\s+\w+/g) || []).length;
    if (functions > 0) score += 0.1 / Math.max(1, functions);

    const descriptiveNames =
      /\b(function|variable|calculate|process|handle|validate|parse)\b/i.test(code);
    if (descriptiveNames) score += 0.1;

    const hasBlankLines = /\n\s*\n/.test(code);
    if (hasBlankLines) score += 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private assessMaintainability(code: string): number {
    if (!code) return 0;

    let score = 0.6;

    const lines = code.split("\n");
    if (lines.length > 10 && lines.length < 200) score += 0.2;
    else if (lines.length > 300) score -= 0.2;

    const hasConstants = /^[A-Z_][A-Z0-9_]*\s*=/m.test(code);
    if (hasConstants) score += 0.1;

    const hasConfiguration = /config|settings|params|options/i.test(code);
    if (hasConfiguration) score += 0.1;

    const hasTests = /test_|spec_|assert\s*\(/.test(code);
    if (hasTests) score += 0.1;

    const hasImports = /\bimport\b|\brequire\b/.test(code);
    if (hasImports) score += 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private assessSecurity(code: string): number {
    if (!code) return 0;

    let score = 0.8;

    const dangerousPatterns = [
      /\beval\s*\(/,
      /\bexec\s*\(/,
      /\b__import__\s*\(/,
      /\bpickle\.loads\b/,
      /\byaml\.load\b.*(?:Loader=None|safe_load=False)/,
      /\bSQL\b.*\bINJECTION\b/i,
      /\bpassword\s*=\s*["'][^"']+["']/i,
      /\bapi[_-]?key\s*=\s*["'][^"']+["']/i,
      /\bsecret\s*=\s*["'][^"']+["']/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        score -= 0.3;
        break;
      }
    }

    const hasInputValidation = /\bvalidate\b|\bsanitize\b|\bcheck\b.*input/i.test(code);
    if (hasInputValidation) score += 0.1;

    const hasAuth = /\bauth\b|\bauthenticate\b|\bauthorize\b/i.test(code);
    if (hasAuth) score += 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private assessTestCoverage(code: string): number {
    if (!code) return 0;

    const hasTests = /\btest\b|\bspec\b|\bassert\b|\bunit\b/i.test(code);
    const hasMocking = /\bmock\b|\bstub\b|\bfake\b/i.test(code);
    const hasAssertions = /\bassert\b.+\b(equal|true|false|null|not None)\b/i.test(code);
    const hasCoverageImport = /\bcoverage\b|\bpytest\b|\bjest\b|\bmocha\b/i.test(code);

    let score = 0.3;
    if (hasTests) score += 0.2;
    if (hasMocking) score += 0.15;
    if (hasAssertions) score += 0.2;
    if (hasCoverageImport) score += 0.15;

    return Math.min(1, score);
  }

  private getDefaultMetrics(): FitnessMetrics {
    return {
      correctness: 0,
      efficiency: 0,
      readability: 0,
      maintainability: 0,
      security: 0,
      testCoverage: 0,
    };
  }

  private computeWeightedFitness(metrics: FitnessMetrics): number {
    const weights = this.config.weights;

    let fitness = 0;
    fitness += metrics.correctness * (weights.correctness ?? 0.35);
    fitness += metrics.efficiency * (weights.efficiency ?? 0.2);
    fitness += metrics.readability * (weights.readability ?? 0.15);
    fitness += metrics.maintainability * (weights.maintainability ?? 0.1);
    fitness += metrics.security * (weights.security ?? 0.1);
    fitness += metrics.testCoverage * (weights.testCoverage ?? 0.1);

    return fitness;
  }

  private detectSyntaxErrors(code: string): number {
    let errors = 0;

    const unbalanced = [
      { open: "(", close: ")" },
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ];

    for (const { open, close } of unbalanced) {
      const openCount = (code.match(new RegExp("\\" + open, "g")) || []).length;
      const closeCount = (code.match(new RegExp("\\" + close, "g")) || []).length;
      if (openCount !== closeCount) errors++;
    }

    return errors;
  }

  private checkBalanced(code: string, open: string, close: string): boolean {
    let count = 0;
    let inString = false;
    let stringChar = "";

    for (const char of code) {
      if (inString) {
        if (char === stringChar && code[code.indexOf(char) - 1] !== "\\") {
          inString = false;
        }
      } else {
        if (char === '"' || char === "'") {
          inString = true;
          stringChar = char;
        } else if (char === open) {
          count++;
        } else if (char === close) {
          count--;
          if (count < 0) return false;
        }
      }
    }

    return count === 0;
  }

  private getCacheKey(genome: Genome): string {
    return `${genome.strategy}_${genome.code.slice(0, 100)}_${JSON.stringify(genome.parameters)}`;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}
