
const REDACTION_PATTERNS = [
  /api[-_]?key/i,
  /auth[-_]?token/i,
  /password/i,
  /secret/i,
  /bearer/i,
  /ghp_[a-zA-Z0-9]+/, // GitHub Personal Access Token
  /sk-[a-zA-Z0-9]{20,}/, // OpenAI/etc potential keys
];

const REPLACEMENT = "[REDACTED]";

function recursiveRedact(obj: unknown): unknown {
  if (typeof obj === "string") {
    let result = obj;
    // Simple heuristic: if a string looks like a key/value pair or just a long random string, apply redaction
    // For now, let's just match patterns against the WHOLE string if it's a value
    // Actually, for log *messages*, we need to search within the string.
    for (const pattern of REDACTION_PATTERNS) {
        // This is a naive implementation; real world needs careful regex
        // We will just do a simple replace for specific patterns
        // But matching keys in a JSON object is safer.
    }
    return result;
  }
  if (Array.isArray(obj)) {
    return obj.map(recursiveRedact);
  }
  if (obj && typeof obj === "object") {
    const newObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
       let shouldRedact = false;
       for (const pattern of REDACTION_PATTERNS) {
           if (pattern.test(key)) {
               shouldRedact = true;
               break;
           }
       }
       if (shouldRedact) {
           newObj[key] = REPLACEMENT;
       } else {
           newObj[key] = recursiveRedact(value);
       }
    }
    return newObj;
  }
  return obj;
}

// Minimal redaction focused on keys in objects
export function redactLogObject(logObj: Record<string, unknown>): Record<string, unknown> {
    return recursiveRedact(logObj) as Record<string, unknown>;
}

export function redactSensitiveText(str: string, options?: { replaceWith?: string; patterns?: RegExp[]; mode?: string }): string {
  let result = str;
  const patterns = options?.patterns ?? REDACTION_PATTERNS;
  for (const pattern of patterns) {
    if (pattern.global) {
      result = result.replace(pattern, options?.replaceWith ?? REPLACEMENT);
    } else {
      // Create a global regex if needed for replaceAll behavior, or just replace once if intended.
      // For safety, let's assume we want to replace all occurrences.
      const flags = pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g";
      const globalPattern = new RegExp(pattern.source, flags);
      result = result.replace(globalPattern, options?.replaceWith ?? REPLACEMENT);
    }
  }
  return result;
}

export function getDefaultRedactPatterns() {
  return REDACTION_PATTERNS;
}

export function redactToolDetail(detail: string): string {
  return redactSensitiveText(detail);
}
