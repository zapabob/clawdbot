import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { Type } from "@sinclair/typebox";
import {
  ABSOLUTE_SECURITY_RULES,
  BLOCKED_PATTERNS,
  GUARDRAIL_VIOLATION_MESSAGES,
  AUDIT_CONFIG,
  ALL_DETECTION_PATTERNS,
} from "./rules.js";

// =============================================================================
// 検出結果型定義
// =============================================================================

export interface DetectionResult {
  detected: boolean;
  type?:
    | "credentials"
    | "pii"
    | "confidential"
    | "bypass"
    | "self-modification"
    | "credential-request";
  matchedPattern?: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  message: string;
  blocked: boolean;
}

export interface ScanResult {
  safe: boolean;
  detections: DetectionResult[];
  redactedContent?: string;
}

// =============================================================================
// 機密情報検出エンジン
// =============================================================================

export class SecretDetector {
  private static readonly REPLACEMENT = "[REDACTED]";

  /**
   * テキスト内の機密情報を検出
   */
  static detectSecrets(content: string): DetectionResult[] {
    const detections: DetectionResult[] = [];

    // 認証情報の検出
    for (const pattern of ABSOLUTE_SECURITY_RULES.credentials.patterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          detections.push({
            detected: true,
            type: "credentials",
            matchedPattern: match.substring(0, 20) + "...",
            severity: "CRITICAL",
            message: "Credential pattern detected",
            blocked: true,
          });
        }
      }
    }

    // PIIの検出
    for (const pattern of ABSOLUTE_SECURITY_RULES.personalInformation.patterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          detections.push({
            detected: true,
            type: "pii",
            matchedPattern: match.substring(0, 10) + "...",
            severity: "HIGH",
            message: "Personal information detected",
            blocked: true,
          });
        }
      }
    }

    // 機密データの検出
    for (const pattern of ABSOLUTE_SECURITY_RULES.confidentialData.patterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          detections.push({
            detected: true,
            type: "confidential",
            matchedPattern: match.substring(0, 20) + "...",
            severity: "HIGH",
            message: "Confidential data detected",
            blocked: true,
          });
        }
      }
    }

    return detections;
  }

  /**
   * 機密情報をマスク化
   */
  static redactSecrets(content: string): string {
    let redacted = content;

    for (const pattern of ALL_DETECTION_PATTERNS) {
      redacted = redacted.replace(pattern, this.REPLACEMENT);
    }

    return redacted;
  }

  /**
   * コンテンツをスキャンして安全チェック
   */
  static scan(content: string): ScanResult {
    const detections = this.detectSecrets(content);
    const hasCritical = detections.some((d) => d.severity === "CRITICAL");

    if (hasCritical) {
      return {
        safe: false,
        detections,
        redactedContent: this.redactSecrets(content),
      };
    }

    return {
      safe: detections.length === 0,
      detections,
      redactedContent: detections.length > 0 ? this.redactSecrets(content) : content,
    };
  }
}

// =============================================================================
// プロンプトインジェクション検出
// =============================================================================

export class PromptInjectionDetector {
  /**
   * ガードレール回避の試行を検出
   */
  static detectBypassAttempt(prompt: string): DetectionResult | null {
    for (const pattern of BLOCKED_PATTERNS.bypassAttempts) {
      if (pattern.test(prompt)) {
        return {
          detected: true,
          type: "bypass",
          matchedPattern: pattern.source.substring(0, 50),
          severity: "CRITICAL",
          message: GUARDRAIL_VIOLATION_MESSAGES.bypassAttempt,
          blocked: true,
        };
      }
    }
    return null;
  }

  /**
   * 自己変更の試行を検出
   */
  static detectSelfModification(prompt: string): DetectionResult | null {
    for (const pattern of BLOCKED_PATTERNS.selfModification) {
      if (pattern.test(prompt)) {
        return {
          detected: true,
          type: "self-modification",
          matchedPattern: pattern.source.substring(0, 50),
          severity: "CRITICAL",
          message: GUARDRAIL_VIOLATION_MESSAGES.selfModification,
          blocked: true,
        };
      }
    }
    return null;
  }

  /**
   * 認証情報要求を検出
   */
  static detectCredentialRequest(prompt: string): DetectionResult | null {
    for (const pattern of BLOCKED_PATTERNS.credentialRequests) {
      if (pattern.test(prompt)) {
        return {
          detected: true,
          type: "credential-request",
          matchedPattern: pattern.source.substring(0, 50),
          severity: "CRITICAL",
          message: GUARDRAIL_VIOLATION_MESSAGES.credentials,
          blocked: true,
        };
      }
    }
    return null;
  }

  /**
   * プロンプトを完全スキャン
   */
  static scanPrompt(prompt: string): DetectionResult[] {
    const detections: DetectionResult[] = [];

    const bypass = this.detectBypassAttempt(prompt);
    if (bypass) {
      detections.push(bypass);
    }

    const selfMod = this.detectSelfModification(prompt);
    if (selfMod) {
      detections.push(selfMod);
    }

    const credReq = this.detectCredentialRequest(prompt);
    if (credReq) {
      detections.push(credReq);
    }

    // 機密情報も検出
    const secrets = SecretDetector.detectSecrets(prompt);
    detections.push(...secrets);

    return detections;
  }
}

// =============================================================================
// 外部送信ガードレール
// =============================================================================

export class OutboundGuard {
  private static allowedDomains: Set<string> = new Set([
    "api.openai.com",
    "api.anthropic.com",
    "generativelanguage.googleapis.com",
    "api.github.com",
    "api.vrchat.cloud",
    "discord.com",
    "slack.com",
    "api.telegram.org",
  ]);

  /**
   * URLが許可リストにあるか確認
   */
  static isAllowedDestination(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return this.allowedDomains.has(urlObj.hostname);
    } catch {
      return false;
    }
  }

  /**
   * 送信前のコンテンツチェック
   */
  static validateOutboundData(data: string, destination: string): ScanResult {
    // まず機密情報を検出
    const scanResult = SecretDetector.scan(data);

    if (!scanResult.safe) {
      return scanResult;
    }

    // 宛先の確認
    if (!this.isAllowedDestination(destination)) {
      return {
        safe: false,
        detections: [
          {
            detected: true,
            type: "confidential",
            severity: "HIGH",
            message: `Blocked: Destination ${destination} is not in allowlist`,
            blocked: true,
          },
        ],
      };
    }

    return scanResult;
  }

  /**
   * 許可ドメインを追加（慎重に使用）
   */
  static addAllowedDomain(domain: string): void {
    this.allowedDomains.add(domain);
  }
}

// =============================================================================
// 監査ログ
// =============================================================================

export class AuditLogger {
  private static logs: Array<{
    timestamp: string;
    type: string;
    severity: string;
    message: string;
    details?: Record<string, unknown>;
  }> = [];

  /**
   * セキュリティイベントをログ
   */
  static log(event: {
    type: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    message: string;
    details?: Record<string, unknown>;
  }): void {
    const entry = {
      timestamp: new Date().toISOString(),
      ...event,
    };

    this.logs.push(entry);

    // コンソールにも出力（機密情報は含めない）
    if (AUDIT_CONFIG.logAllTriggers) {
      console.error(`[GUARDRAIL ${event.severity}] ${event.type}: ${event.message}`);
    }

    // ログを制限
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-5000);
    }
  }

  /**
   * 検出イベントをログ
   */
  static logDetection(result: DetectionResult, context?: string): void {
    this.log({
      type: result.type || "unknown",
      severity: result.severity,
      message: result.message,
      details: {
        blocked: result.blocked,
        context: context ? SecretDetector.redactSecrets(context.substring(0, 200)) : undefined,
      },
    });
  }

  /**
   * ログを取得
   */
  static getLogs(): typeof this.logs {
    return [...this.logs];
  }

  /**
   * ログをクリア
   */
  static clearLogs(): void {
    this.logs = [];
  }
}

// =============================================================================
// メインガードレールクラス
// =============================================================================

export class Guardrails {
  /**
   * 入力を検証
   */
  static validateInput(input: string): { safe: boolean; violations: DetectionResult[] } {
    const violations = PromptInjectionDetector.scanPrompt(input);

    // 重大な違反がある場合はログ
    const criticalViolations = violations.filter((v) => v.severity === "CRITICAL");
    for (const violation of criticalViolations) {
      AuditLogger.logDetection(violation, input);
    }

    return {
      safe: violations.filter((v) => v.blocked).length === 0,
      violations,
    };
  }

  /**
   * 出力を検証
   */
  static validateOutput(output: string): {
    safe: boolean;
    redacted: string;
    violations: DetectionResult[];
  } {
    const scan = SecretDetector.scan(output);

    // 機密情報が検出された場合はログ
    for (const detection of scan.detections) {
      AuditLogger.logDetection(detection, output);
    }

    return {
      safe: scan.safe,
      redacted: scan.redactedContent || output,
      violations: scan.detections,
    };
  }

  /**
   * 外部送信前の検証
   */
  static validateOutbound(
    data: string,
    destination: string,
  ): { allowed: boolean; result: ScanResult } {
    const result = OutboundGuard.validateOutboundData(data, destination);

    if (!result.safe) {
      for (const detection of result.detections) {
        AuditLogger.logDetection(detection, `Destination: ${destination}`);
      }
    }

    return {
      allowed: result.safe,
      result,
    };
  }

  /**
   * コード生成時の安全チェック
   */
  static validateGeneratedCode(code: string): { safe: boolean; violations: DetectionResult[] } {
    const violations: DetectionResult[] = [];

    // ガードレールルールファイルの変更を検出
    if (code.includes("GUARDRAILS_VERSION") || code.includes("ABSOLUTE_SECURITY_RULES")) {
      violations.push({
        detected: true,
        type: "self-modification",
        severity: "CRITICAL",
        message: "Attempt to modify guardrails rules detected in generated code",
        blocked: true,
      });
    }

    // 機密情報パターンを検出
    const secretScan = SecretDetector.scan(code);
    violations.push(...secretScan.detections);

    // 自己変更パターンを検出
    const selfMod = PromptInjectionDetector.detectSelfModification(code);
    if (selfMod) {
      violations.push(selfMod);
    }

    // ログ
    for (const violation of violations.filter((v) => v.severity === "CRITICAL")) {
      AuditLogger.logDetection(violation, code.substring(0, 200));
    }

    return {
      safe: violations.filter((v) => v.blocked).length === 0,
      violations,
    };
  }
}

// =============================================================================
// OpenClaw統合
// =============================================================================

export function registerGuardrails(api: OpenClawPluginApi): void {
  // 入力フィルターツールを登録
  api.registerTool({
    name: "guardrails_scan_input",
    label: "Security Input Scanner",
    description: "Scan input for security violations and prompt injection attempts",
    parameters: Type.Object({
      input: Type.String({ description: "Input text to scan" }),
    }),
    async execute(_id: string, params: { input: string }) {
      const result = Guardrails.validateInput(params.input);

      return {
        content: [
          {
            type: "text",
            text: result.safe
              ? "Input passed security check"
              : `SECURITY VIOLATION: ${result.violations.map((v) => v.message).join(", ")}`,
          },
        ],
        details: null,
      } as const;
    },
  });

  // 出力フィルターツールを登録
  api.registerTool({
    name: "guardrails_scan_output",
    label: "Security Output Scanner",
    description: "Scan output for leaked credentials or sensitive data",
    parameters: Type.Object({
      output: Type.String({ description: "Output text to scan" }),
    }),
    async execute(_id: string, params: { output: string }) {
      const result = Guardrails.validateOutput(params.output);

      return {
        content: [
          {
            type: "text",
            text: result.safe
              ? "Output passed security check"
              : `SENSITIVE DATA DETECTED: Content redacted. Violations: ${result.violations.map((v) => v.type).join(", ")}`,
          },
        ],
        details: null,
      } as const;
    },
  });

  // ガードレールステータス確認ツール
  api.registerTool({
    name: "guardrails_status",
    label: "Guardrails Status",
    description: "Check guardrails status and recent security events",
    parameters: Type.Object({}),
    async execute() {
      const logs = AuditLogger.getLogs().slice(-10);

      return {
        content: [
          {
            type: "text",
            text: `Guardrails Status:
- Active Rules: ${Object.keys(ABSOLUTE_SECURITY_RULES).length} categories
- Detection Patterns: ${ALL_DETECTION_PATTERNS.length} patterns
- Recent Events: ${logs.length} logged

Recent Security Events:
${logs.map((l) => `[${l.timestamp}] ${l.severity}: ${l.type}`).join("\n") || "No recent events"}`,
          },
        ],
        details: null,
      } as const;
    },
  });

  console.log("[Guardrails] AI Safety Guardrails registered successfully");
  console.log("[Guardrails] Three Laws of Robotics adaptation active");
  console.log("[Guardrails] Absolute security rules enforced");
}
