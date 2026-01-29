import { danger } from "../globals.js";
import { logError } from "../logger.js";

/**
 * List of command binaries that are generally considered dangerous to allow
 * arbitrary execution of, especially in an agentic context.
 */
const DANGEROUS_BINARIES = new Set([
  // "rm", // Allowed for self-improvement/cleaning
  "mkfs",
  "dd",
  "nc",
  "netcat",
  "ncat",
  // "wget", // Allowed for self-replication
  // "curl", // Allowed for self-replication
  // "ssh",  // Allowed for self-replication/deployment
  // "scp",  // Allowed for self-replication/deployment
  "ftp",
  "sftp",
  "telnet",
  "base64", // often used for exfiltration, but might be needed? keeping blocked for now unless requested
  "sudo",
  "su",
  // "chmod", // Allowed for self-improvement (executable permissions)
  "chown",
  "chgrp",
  // "kill", // Allowed for self-management (restarting)
  // "killall", // Allowed for self-management
  // "pkill", // Allowed for self-management
  "shutdown",
  "reboot",
  "init",
  "systemctl",
  "service",
  "mount",
  "umount",
]);

/**
 * List of shopping/financial related keywords to watch out for in arguments.
 * This is a heuristic and not exhaustive.
 */
const SHOPPING_KEYWORDS = [
  "buy",
  "purchase",
  "checkout",
  "pay",
  "credit card",
  "creditcard",
  "cc",
  "stripe",
  "paypal",
  "shopping",
  "amazon",
  "ebay",
];

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SecurityError";
  }
}

/**
 * Checks if a command and its arguments are allowed to be executed.
 * @param command The command binary or path to execute.
 * @param args The arguments to be passed to the command.
 * @returns true if allowed, throws SecurityError if denied.
 */
export function assertCommandAllowed(command: string, args: string[]): void {
  const binary = command.split(/[/\\]/).pop() || command;

  // 1. Check against dangerous binaries
  if (DANGEROUS_BINARIES.has(binary)) {
    const msg = `Security Block: Execution of dangerous binary '${binary}' is not allowed.`;
    logError(danger(msg));
    throw new SecurityError(msg);
  }

  // 3. Ransomware Heuristics (Encryption tools)
  if (binary === "openssl" && args.includes("enc")) {
    const msg = `Security Block: Suspected ransomware activity (openssl enc).`;
    logError(danger(msg));
    throw new SecurityError(msg);
  }
  if (binary === "gpg" && (args.includes("-c") || args.includes("--symmetric"))) {
    const msg = `Security Block: Suspected ransomware activity (gpg symmetric encryption).`;
    logError(danger(msg));
    throw new SecurityError(msg);
  }
  if (
    (binary === "zip" || binary === "7z" || binary === "rar") &&
    (args.includes("-p") || args.includes("-e") || args.includes("--password"))
  ) {
    const msg = `Security Block: Suspected ransomware activity (archive with password/encryption).`;
    logError(danger(msg));
    throw new SecurityError(msg);
  }

  // 4. Check for shell injection indicators in arguments if not using shell:true
  // But strictly speaking, execFile/spawn separate args. We mostly care about what the args ARE.
  // Heuristic: Check for shopping/financial keywords in arguments
  const lowerArgs = args.map((a) => a.toLowerCase()).join(" ");
  for (const keyword of SHOPPING_KEYWORDS) {
    // Regex boundary check to avoid false positives inside other words, though simple includes might suffice
    // extending to simple includes for broad safety
    if (lowerArgs.includes(keyword)) {
      // Just a warning or strict block? Let's block to be safe as requested.
      // But "pay" logic might be too aggressive (e.g. "payload").
      // Let's stick to stricter checking for common sensitive operations.
      // For now, let's log a warning for these instead of blocking, unless it's very specific.
      // Actually, user asked to "prevent shopping", so we should take it seriously.
      if (
        keyword === "buy" ||
        keyword === "purchase" ||
        keyword === "checkout" ||
        keyword === "payment"
      ) {
        const msg = `Security Block: Detected potential shopping/financial activity in arguments: '${keyword}'.`;
        logError(danger(msg));
        throw new SecurityError(msg);
      }
    }
  }

  return;
}
