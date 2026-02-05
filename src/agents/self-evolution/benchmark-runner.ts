import { exec, execSync } from "child_process";
import { promisify } from "util";
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { join, dirname } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  output?: string;
}

export interface BenchmarkSuite {
  name: string;
  tests: BenchmarkTest[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  parallel?: boolean;
}

export interface BenchmarkTest {
  name: string;
  code: string;
  timeout: number;
  expected?: unknown;
  dependencies?: string[];
}

export interface BenchmarkResult {
  suite: string;
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
  metrics: {
    passRate: number;
    averageDuration: number;
    longestTest: string;
    shortestTest: string;
  };
  timestamp: Date;
}

export interface BenchmarkConfig {
  timeout: number;
  maxRetries: number;
  parallel: boolean;
  coverage: boolean;
  verbose: boolean;
}

const DEFAULT_CONFIG: BenchmarkConfig = {
  timeout: 30000,
  maxRetries: 2,
  parallel: false,
  coverage: false,
  verbose: false,
};

export class BenchmarkRunner {
  private config: BenchmarkConfig;
  private testDir: string;
  private resultHistory: BenchmarkResult[];

  constructor(config: Partial<BenchmarkConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.testDir = join(tmpdir(), `benchmark_${Date.now()}`);
    this.resultHistory = [];

    if (!existsSync(this.testDir)) {
      mkdirSync(this.testDir, { recursive: true });
    }
  }

  async runSuite(suite: BenchmarkSuite): Promise<BenchmarkResult> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    if (suite.setup) {
      await suite.setup();
    }

    const tests = suite.parallel
      ? await this.runTestsParallel(suite.tests)
      : await this.runTestsSequential(suite.tests);

    results.push(...tests);

    if (suite.teardown) {
      await suite.teardown();
    }

    const duration = Date.now() - startTime;
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    const passRates = results.filter((r) => r.passed).map((r) => r.duration);
    const avgDuration =
      passRates.length > 0 ? passRates.reduce((a, b) => a + b, 0) / passRates.length : 0;

    const sortedByDuration = [...results].sort((a, b) => a.duration - b.duration);

    const result: BenchmarkResult = {
      suite: suite.name,
      totalTests: results.length,
      passed,
      failed,
      duration,
      results,
      metrics: {
        passRate: results.length > 0 ? passed / results.length : 0,
        averageDuration: avgDuration,
        longestTest: sortedByDuration[sortedByDuration.length - 1]?.name || "N/A",
        shortestTest: sortedByDuration[0]?.name || "N/A",
      },
      timestamp: new Date(),
    };

    this.resultHistory.push(result);
    return result;
  }

  private async runTestsSequential(tests: BenchmarkTest[]): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const test of tests) {
      const result = await this.runTest(test);
      results.push(result);
    }

    return results;
  }

  private async runTestsParallel(tests: BenchmarkTest[]): Promise<TestResult[]> {
    return Promise.all(tests.map((test) => this.runTest(test)));
  }

  private async runTest(test: BenchmarkTest): Promise<TestResult> {
    const startTime = Date.now();

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await this.executeTest(test);
        const duration = Date.now() - startTime;

        if (this.config.verbose) {
          console.log(`[PASS] ${test.name}: ${duration}ms`);
        }

        return {
          name: test.name,
          passed: true,
          duration,
          output: result.stdout,
        };
      } catch (error) {
        if (attempt < this.config.maxRetries) {
          if (this.config.verbose) {
            console.log(
              `[RETRY] ${test.name}: attempt ${attempt + 1}/${this.config.maxRetries + 1}`,
            );
          }
          await this.sleep(100 * (attempt + 1));
        } else {
          return {
            name: test.name,
            passed: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }
    }

    return {
      name: test.name,
      passed: false,
      duration: Date.now() - startTime,
      error: "Max retries exceeded",
    };
  }

  private async executeTest(test: BenchmarkTest): Promise<{ stdout: string; stderr: string }> {
    const testFile = join(this.testDir, `test_${test.name.replace(/\s+/g, "_")}.py`);

    let code = test.code;
    if (this.config.coverage) {
      code = `import coverage\ncov = coverage.Coverage()\ncov.start()\n${code}\ncov.stop()\ncov.save()`;
    }

    writeFileSync(testFile, code, "utf-8");

    if (test.dependencies && test.dependencies.length > 0) {
      for (const dep of test.dependencies) {
        try {
          await execAsync(`python -c "import ${dep}"`);
        } catch {
          await execAsync(`pip install ${dep}`);
        }
      }
    }

    const command = `python "${testFile}"`;
    const { stdout, stderr } = await execAsync(command, {
      timeout: test.timeout || this.config.timeout,
    });

    if (test.expected) {
      const actual = JSON.parse(stdout.trim());
      if (JSON.stringify(actual) !== JSON.stringify(test.expected)) {
        throw new Error(`Expected ${JSON.stringify(test.expected)}, got ${JSON.stringify(actual)}`);
      }
    }

    return { stdout: stdout || "", stderr: stderr || "" };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  createBasicSuite(
    name: string,
    testCases: Array<{ code: string; expected?: unknown }>,
  ): BenchmarkSuite {
    return {
      name,
      tests: testCases.map((tc, i) => ({
        name: `test_${i}`,
        code: tc.code,
        timeout: this.config.timeout,
        expected: tc.expected,
      })),
    };
  }

  createCodeReviewSuite(): BenchmarkSuite {
    return {
      name: "code_review",
      tests: [
        {
          name: "syntax_check",
          code: `
import ast
code = open("target.py").read()
ast.parse(code)
print("Syntax OK")
`,
          timeout: 10000,
        },
        {
          name: "type_check",
          code: `
import subprocess
result = subprocess.run(["python", "-m", "pyright", "--outputjson", "target.py"], capture_output=True, text=True)
print(result.stdout)
`,
          timeout: 20000,
        },
        {
          name: "lint_check",
          code: `
import subprocess
result = subprocess.run(["flake8", "target.py", "--max-line-length=100"], capture_output=True, text=True)
print(result.stdout or "No issues")
`,
          timeout: 15000,
        },
      ],
    };
  }

  getResultHistory(): BenchmarkResult[] {
    return [...this.resultHistory];
  }

  getLatestResult(): BenchmarkResult | null {
    return this.resultHistory[this.resultHistory.length - 1] || null;
  }

  getAveragePassRate(): number {
    if (this.resultHistory.length === 0) return 0;
    const totalPassRate = this.resultHistory.reduce((sum, r) => sum + r.metrics.passRate, 0);
    return totalPassRate / this.resultHistory.length;
  }

  cleanup(): void {
    if (existsSync(this.testDir)) {
      rmSync(this.testDir, { recursive: true, force: true });
    }
  }

  destroy(): void {
    this.cleanup();
    this.resultHistory = [];
  }
}
