import type { OSCClient } from "../osc/client.js";

/**
 * Handles VRChat Input Controller OSC commands with safety 0-reset.
 * Prevents "stuck" buttons by ensuring every press (1) is followed by a release (0).
 */
export class InputController {
  private activeLatches: Set<string> = new Set();

  constructor(private client: OSCClient) {}

  /**
   * Triggers an input button (e.g., Jump, Interact).
   * Automatically sends 1 then 0 after a short delay.
   */
  async trigger(name: string, delayMs = 50) {
    const address = `/input/${name}`;
    
    // Safety check: Don't double-trigger if already latched
    if (this.activeLatches.has(address)) return;
    this.activeLatches.add(address);

    try {
      // Press (1)
      await this.client.sendRaw(address, "i", [1]);

      // Wait and Release (0)
      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          try {
            await this.client.sendRaw(address, "i", [0]);
          } finally {
            this.activeLatches.delete(address);
            resolve();
          }
        }, delayMs);
      });
    } catch (err) {
      this.activeLatches.delete(address);
      throw err;
    }
  }

  /**
   * Sets an input axis (e.g., Vertical, Horizontal).
   * Range: -1.0 to 1.0. 
   * Note: In a real "terminal" usage, we might want to ensure a reset to 0.0 later.
   */
  async setAxis(name: string, value: number) {
    const address = `/input/${name}`;
    return this.client.sendRaw(address, "f", [value]);
  }

  /**
   * Force reset all known inputs to 0.
   * Useful as a "Panic Button" or during stop.
   */
  async panicReset() {
    for (const address of this.activeLatches) {
      await this.client.sendRaw(address, "i", [0]);
    }
    this.activeLatches.clear();
  }
}
