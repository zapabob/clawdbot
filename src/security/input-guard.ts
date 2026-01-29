
/**
 * Input Guard - Prompt Injection & Jailbreak Defense
 * 
 * Scans user inputs for adversarial patterns used to bypass safety protocols.
 */

import { danger } from "../globals.js";
import { logError } from "../logger.js";

// Common patterns used in prompt injection / jailbreaking
const JAILBREAK_PATTERNS = [
    /ignore previous instructions/i,
    /ignore all previous instructions/i,
    /system override/i,
    /you are now in developer mode/i,
    /you are now DAN/i,
    /do anything now/i,
    /jailbreak/i,
    /debug mode/i,
    /switch to unrestricted mode/i
];

/**
 * Checks if the input text contains potential prompt injection strings.
 * @param text The user input text.
 * @returns true if safe, false if injection detected.
 */
export function isInputSafe(text: string): boolean {
    const normalize = text.toLowerCase();
    
    for (const pattern of JAILBREAK_PATTERNS) {
        if (pattern.test(normalize)) {
            logError(danger(`Security Block: Prompt injection detected: ${pattern}`));
            return false;
        }
    }
    
    // Additional heuristics: e.g., huge repetition of special chars
    if ((text.match(/!/g) || []).length > 50) return false;
    
    return true;
}

export class InputSecurityError extends Error {
    constructor(msg: string = "Input blocked by security policies.") {
        super(msg);
        this.name = "InputSecurityError";
    }
}
