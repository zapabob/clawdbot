import type { OSCClient } from "../osc/client.js";

/**
 * Handles VRChat Avatar Parameter OSC commands.
 */
export class AvatarController {
  private client: OSCClient;

  constructor(client: OSCClient) {
    this.client = client;
  }

  /**
   * Sets an avatar parameter.
   * @param name The parameter name.
   * @param value The value (bool, int, or float).
   */
  async setParameter(name: string, value: boolean | number) {
    const address = `/avatar/parameters/${name}`;

    if (typeof value === "boolean") {
      return this.client.send(address, [{ type: value ? "T" : "F", value: true }]);
    } else if (Number.isInteger(value)) {
      return this.client.send(address, [{ type: "i", value }]);
    } else {
      return this.client.send(address, [{ type: "f", value }]);
    }
  }
}
