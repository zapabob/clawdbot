import dgram from "node:dgram";
import { EventEmitter } from "node:events";
import { buildOscPacket, decodeOscPacket, type OscValue } from "../core/osc.js";
import { globalOscGuard } from "../core/guard.js";

export interface OSCOptions {
  sendPort?: number;
  receivePort?: number;
  host?: string;
  onPacket?: (address: string, args: any[]) => void;
  logger?: { info: (m: string) => void; error: (m: string) => void };
}

export class OSCClient extends EventEmitter {
  private sendSocket: dgram.Socket;
  private receiveSocket: dgram.Socket;
  private sendPort: number;
  private receivePort: number;
  private host: string;
  private logger?: OSCOptions["logger"];

  constructor(options: OSCOptions = {}) {
    super();
    this.sendPort = options.sendPort ?? 9000;
    this.receivePort = options.receivePort ?? 9001;
    this.host = options.host ?? "127.0.0.1";
    this.logger = options.logger;

    this.sendSocket = dgram.createSocket("udp4");
    this.receiveSocket = dgram.createSocket("udp4");

    this.receiveSocket.on("message", (msg) => {
      try {
        const { address, args } = decodeOscPacket(msg);

        // 1. Loop Protection: Ignore echoes of our own sent packets
        if (globalOscGuard.isEcho(address, args[0])) {
          return;
        }

        // 2. Cool-down check: Suppress high-frequency incoming events if needed
        // (Optional: add if specific events are too noisy)

        this.emit("packet", address, args);
        if (options.onPacket) options.onPacket(address, args);
      } catch (err) {
        this.logger?.error(`Failed to decode OSC packet: ${String(err)}`);
      }
    });

    this.receiveSocket.on("error", (err) => {
      this.logger?.error(`OSC receive socket error: ${String(err)}`);
    });
  }

  async start() {
    return new Promise<void>((resolve, reject) => {
      this.receiveSocket.bind(this.receivePort, () => {
        this.logger?.info(`OSC Client listening on ${this.host}:${this.receivePort}`);
        resolve();
      });
      this.receiveSocket.once("error", reject);
    });
  }

  async stop() {
    this.receiveSocket.close();
    this.sendSocket.close();
  }

  /**
   * Internal low-level send.
   * Safety validation is handled here via globalOscGuard.
   */
  async sendRaw(address: string, types: string, args: any[]) {
    // 1. Safety Guard & Rate Limiting
    globalOscGuard.validate(address, this.host, this.sendPort);

    // 2. Loop Protection: Record what we sent to ignore its echo
    globalOscGuard.recordSent(address, args[0]);

    // 3. Build and Send
    const packet = buildOscPacket(address, types, args);
    return new Promise<void>((resolve, reject) => {
      this.sendSocket.send(packet, this.sendPort, this.host, (err) => {
        if (err) {
          this.logger?.error(`Failed to send OSC packet to ${address}: ${String(err)}`);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Legacy wrapper for compatibility with existing code.
   */
  async send(address: string, args: { type: string; value: any }[]) {
    const types = args.map(a => a.type).join("");
    const values = args.map(a => a.value);
    return this.sendRaw(address, types, values);
  }
}
