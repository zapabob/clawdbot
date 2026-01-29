import { OSCClient, type OSCOptions } from "../osc/client.js";
import { AuditLogger } from "../core/audit.js";
import { globalOscGuard } from "../core/guard.js";
import { InputController } from "./input.js";
import { ChatboxController } from "./chatbox.js";
import { AvatarController } from "./avatar.js";
import { CameraController } from "./camera.js";
import { VRChatOSCQuery } from "../discovery/oscquery.js";

export class VRChatProtocol {
  public client: OSCClient;
  public audit: AuditLogger;
  public input: InputController;
  public chatbox: ChatboxController;
  public avatar: AvatarController;
  public camera: CameraController;
  public discovery: VRChatOSCQuery;

  private lastAvatarChange = 0;
  private currentAvatarId = "";
  private readonly avatarCooldown = 1000;
  public capabilities: Set<string> = new Set();

  constructor(options: OSCOptions & { baseDir: string }) {
    this.audit = new AuditLogger(options.baseDir);
    this.discovery = new VRChatOSCQuery();
    this.client = new OSCClient({
      ...options,
      onPacket: (addr, args) => {
        this.audit.log("RECV", addr, args);
        this.handleIncomingPacket(addr, args);
      },
    });

    // Wrap client.send with audit logging, cool-down, and capability checks
    const originalSend = this.client.send.bind(this.client);
    this.client.send = async (addr, args) => {
      const now = Date.now();

      // 1. Cool-down check
      if (now - this.lastAvatarChange < this.avatarCooldown) {
        if (addr.startsWith("/avatar/parameters/") || addr.startsWith("/input/")) {
          return;
        }
      }

      // 2. Capability Negotiation
      if (addr.startsWith("/avatar/parameters/") || addr.startsWith("/dolly/")) {
        if (this.capabilities.size > 0 && !this.capabilities.has(addr)) {
          const hint = addr.startsWith("/dolly/") ? " (Requires VRC+)" : "";
          this.audit.log("SKIP", addr + hint, args);
          return;
        }
      }

      this.audit.log("SEND", addr, args);
      return originalSend(addr, args);
    };

    this.input = new InputController(this.client);
    this.chatbox = new ChatboxController(this.client);
    this.avatar = new AvatarController(this.client);
    this.camera = new CameraController(this.client);
  }

  private async syncCapabilities(avatarId: string) {
    try {
      const params = await this.discovery.listParameters(avatarId);
      this.capabilities = new Set(params);
      this.audit.log("INFO", `Synced ${this.capabilities.size} capabilities for ${avatarId}`, []);
    } catch (err) {
      this.audit.log("ERROR", `Capability sync failed: ${err}`, []);
    }
  }

  private handleIncomingPacket(address: string, args: any[]) {
    if (address === "/avatar/change") {
      const avatarId = args[0] as string;
      this.lastAvatarChange = Date.now();
      this.currentAvatarId = avatarId;
      this.client.emit("avatar:change", avatarId);
      this.syncCapabilities(avatarId); // Trigger async sync
    } else if (address.startsWith("/avatar/parameters/")) {
      const name = address.replace("/avatar/parameters/", "");
      this.client.emit(`avatar:param:${name}`, args[0]);
    }
  }

  /**
   * Manually trigger a full capability scan.
   */
  async scanLocalConfig() {
    if (!this.currentAvatarId) return;
    this.audit.log("INFO", "Manual capability scan triggered", [this.currentAvatarId]);
    await this.syncCapabilities(this.currentAvatarId);
  }

  async start() {
    await this.client.start();
  }

  async stop() {
    await this.client.stop();
  }
}
