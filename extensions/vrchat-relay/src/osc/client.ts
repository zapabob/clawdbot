import { exec } from "node:child_process";
import { createSocket, type Socket } from "node:dgram";
import path from "node:path";
import { encodeOSCMessage, decodeOSCMessage } from "./codec.js";
import type { OSCConfig, OSCMessage } from "./types.js";
import { DEFAULT_OSC_CONFIG, DEFAULT_OSC_PATHS } from "./types.js";

export class OSCClient {
  private socket: Socket | null = null;
  private config: OSCConfig;
  private listenerSocket: Socket | null = null;
  private messageHandlers: ((message: OSCMessage) => void)[] = [];

  constructor(config: Partial<OSCConfig> = {}) {
    this.config = { ...DEFAULT_OSC_CONFIG, ...config };
  }

  /**
   * Initialize the OSC client socket
   */
  init(): void {
    if (this.socket) return;

    this.socket = createSocket("udp4");
    this.socket.on("error", (err) => {
      console.error("OSC socket error:", err);
    });
  }

  /**
   * Send an OSC message to VRChat
   */
  send(address: string, args: (string | number | boolean | null)[]): void {
    try {
      // Use the python bridge because node-udp packets are often dropped by VRChat
      // or formed in a way that VRChat doesn't recognize for certain commands.
      const scriptPath = path.resolve(process.cwd(), "scripts/osc_chatbox.py");

      const mappedArgs = args.map((arg) => {
        if (typeof arg === "boolean") return arg ? "true" : "false";
        if (arg === null) return "null";
        if (typeof arg === "string" && arg.includes(" ")) return `"${arg}"`;
        return String(arg);
      });

      const cmd = `py -3 "${scriptPath}" --raw "${address}" ${mappedArgs.join(" ")}`;
      exec(cmd, (error) => {
        if (error) {
          console.error(`[OSCClient] Python bridge failed: ${error.message}`);
        }
      });
    } catch (err) {
      console.error("[OSCClient] Error in send:", err);
    }
  }

  /**
   * Send a chatbox message to VRChat
   */
  sendChatbox(message: string, sendImmediately = true): void {
    if (message.length > 144) {
      throw new Error("Chatbox message exceeds 144 character limit");
    }

    this.send(DEFAULT_OSC_PATHS.chatbox, [message, sendImmediately]);
  }

  /**
   * Set typing indicator in VRChat chatbox
   */
  setTyping(typing: boolean): void {
    this.send(DEFAULT_OSC_PATHS.chatboxTyping, [typing]);
  }

  /**
   * Send an avatar parameter to VRChat
   */
  sendAvatarParameter(name: string, value: boolean | number): void {
    const address = `/avatar/parameters/${name}`;
    this.send(address, [value]);
  }

  /**
   * Send input command to VRChat
   */
  sendInput(action: string, value: boolean | number = true): void {
    const address = `/input/${action}`;
    this.send(address, [value]);
  }

  /**
   * Start OSC listener to receive messages from VRChat
   */
  startListener(onMessage?: (msg: OSCMessage) => void): void {
    if (this.listenerSocket) return;

    if (onMessage) {
      this.messageHandlers.push(onMessage);
    }

    this.listenerSocket = createSocket("udp4");

    this.listenerSocket.on("message", (buffer) => {
      try {
        const packet = decodeOSCMessage(buffer);

        if (packet && "address" in packet) {
          const msg: OSCMessage = {
            address: packet.address,
            args: packet.args as (string | number | boolean | null)[],
          };

          this.messageHandlers.forEach((handler) => {
            try {
              handler(msg);
            } catch (err) {
              console.error("Message handler error:", err);
            }
          });
        }
      } catch (err) {
        console.error("Failed to parse OSC message:", err);
      }
    });

    this.listenerSocket.on("error", (err) => {
      console.error("OSC listener error:", err);
    });

    this.listenerSocket.bind(this.config.incomingPort, () => {
      console.log(`OSC listener started on port ${this.config.incomingPort}`);
    });
  }

  /**
   * Stop OSC listener
   */
  stopListener(): void {
    if (this.listenerSocket) {
      this.listenerSocket.close();
      this.listenerSocket = null;
      console.log("OSC listener stopped");
    }
  }

  /**
   * Add a message handler
   */
  addMessageHandler(handler: (message: OSCMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Remove a message handler
   */
  removeMessageHandler(handler: (message: OSCMessage) => void): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  /**
   * Check if listener is running
   */
  isListening(): boolean {
    return this.listenerSocket !== null;
  }

  /**
   * Close the OSC client
   */
  close(): void {
    this.stopListener();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

// Singleton instance for reuse
let globalClient: OSCClient | null = null;

export function getOSCClient(config?: Partial<OSCConfig>): OSCClient {
  if (!globalClient) {
    globalClient = new OSCClient(config);
  }
  return globalClient;
}

export function resetOSCClient(): void {
  if (globalClient) {
    globalClient.close();
    globalClient = null;
  }
}
