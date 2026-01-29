import type { OSCClient } from "../osc/client.js";

/**
 * Handles VRChat Chatbox OSC commands.
 * v1.1: Added SFX support, Typing-Delay concierge flow, and strict UTF-8 limits.
 */
export class ChatboxController {
  private maxLength = 144;
  private maxLines = 9;

  constructor(private client: OSCClient) {}

  /**
   * Sends text to the chatbox with optional SFX.
   * v1.2.1: Strict order (NFC -> Lines -> 144 chars)
   */
  async sendMessage(text: string, immediate = true, sfx = true) {
    const address = "/chatbox/input";
    
    // 1. NFC Normalization
    let processed = text.normalize("NFC");
    
    // 2. Line count limit (9 lines)
    const lines = processed.split("\n");
    if (lines.length > this.maxLines) {
      processed = lines.slice(0, this.maxLines).join("\n");
    }

    // 3. Character count limit (144 chars)
    if (processed.length > this.maxLength) {
      processed = processed.slice(0, this.maxLength);
    }

    // VRChat expects [string, bool (immediate), bool (sfx/complete)]
    return this.client.sendRaw(address, "sTT", [processed, immediate, sfx]);
  }

  /**
   * Concierge Flow: Shows typing indicator for a realistic delay before sending.
   */
  async sendWithTyping(text: string, delayMs = 1000, sfx = true) {
    await this.setTyping(true);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    try {
      await this.sendMessage(text, true, sfx);
    } finally {
      await this.setTyping(false);
    }
  }

  /**
   * Sets the typing indicator.
   */
  async setTyping(active: boolean) {
    const address = "/chatbox/typing";
    return this.client.sendRaw(address, active ? "T" : "F", []);
  }
}
