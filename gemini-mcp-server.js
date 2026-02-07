#!/usr/bin/env node
/**
 * OpenClaw MCP Server for Gemini CLI Integration
 *
 * This MCP (Model Context Protocol) server exposes OpenClaw's capabilities
 * to Gemini CLI, allowing Gemini to control all OpenClaw channels.
 *
 * Usage:
 *   node gemini-mcp-server.js [--port 3000]
 */

import http from "http";
import WebSocket from "ws";
import readline from "readline";
import { spawn } from "child_process";

const DEFAULT_PORT = 3000;
const OPENCLAW_GATEWAY_PORT = 18789;

class OpenClawMCPServer {
  constructor(port = DEFAULT_PORT) {
    this.port = port;
    this.wss = null;
    this.openclaw_ws = null;
    this.tools = this.defineTools();
  }

  defineTools() {
    return {
      // Channel management
      list_channels: {
        name: "list_channels",
        description: "List all configured messaging channels",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },

      send_message: {
        name: "send_message",
        description: "Send a message through a channel",
        inputSchema: {
          type: "object",
          properties: {
            channel: {
              type: "string",
              description: "Channel name (whatsapp, telegram, slack, discord)",
            },
            to: { type: "string", description: "Recipient (phone, user ID, channel)" },
            message: { type: "string", description: "Message to send" },
          },
          required: ["channel", "to", "message"],
        },
      },

      // Agent control
      run_agent: {
        name: "run_agent",
        description: "Run OpenClaw agent with a prompt",
        inputSchema: {
          type: "object",
          properties: {
            prompt: { type: "string", description: "Prompt for the agent" },
            thinking: { type: "string", enum: ["low", "medium", "high"], default: "medium" },
          },
          required: ["prompt"],
        },
      },

      // Gateway status
      gateway_status: {
        name: "gateway_status",
        description: "Get OpenClaw Gateway status",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },

      // Memory/Recall
      search_memory: {
        name: "search_memory",
        description: "Search OpenClaw's memory for information",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            limit: { type: "number", default: 10 },
          },
          required: ["query"],
        },
      },

      // Cron jobs
      list_crons: {
        name: "list_crons",
        description: "List scheduled cron jobs",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },

      // Read messages from channels
      read_messages: {
        name: "read_messages",
        description: "Read recent messages from a channel",
        inputSchema: {
          type: "object",
          properties: {
            channel: { type: "string", description: "Channel name" },
            limit: { type: "number", default: 20 },
          },
          required: ["channel"],
        },
      },
    };
  }

  async connectToOpenClaw() {
    return new Promise((resolve, reject) => {
      try {
        this.openclaw_ws = new WebSocket(`ws://localhost:${OPENCLAW_GATEWAY_PORT}`);

        this.openclaw_ws.on("open", () => {
          console.log("[MCP] Connected to OpenClaw Gateway");
          resolve();
        });

        this.openclaw_ws.on("error", (err) => {
          console.error("[MCP] OpenClaw connection error:", err.message);
          resolve(); // Still start MCP server even if OpenClaw not connected
        });

        this.openclaw_ws.on("message", (data) => {
          this.handleOpenClawMessage(data);
        });
      } catch (err) {
        console.error("[MCP] Failed to connect to OpenClaw:", err);
        resolve();
      }
    });
  }

  handleOpenClawMessage(data) {
    // Handle incoming messages from OpenClaw channels
    try {
      const msg = JSON.parse(data.toString());
      console.log("[MCP] Received from OpenClaw:", msg.type);
    } catch (err) {
      // Ignore parse errors
    }
  }

  async handleToolCall(toolName, args) {
    console.log(`[MCP] Tool call: ${toolName}`, args);

    switch (toolName) {
      case "list_channels":
        return this.listChannels();
      case "send_message":
        return this.sendMessage(args);
      case "run_agent":
        return this.runAgent(args);
      case "gateway_status":
        return this.getGatewayStatus();
      case "search_memory":
        return this.searchMemory(args);
      case "list_crons":
        return this.listCrons();
      case "read_messages":
        return this.readMessages(args);
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

  async listChannels() {
    return {
      channels: [
        { name: "whatsapp", status: "connected", contacts: 5 },
        { name: "telegram", status: "connected", chats: 3 },
        { name: "slack", status: "disconnected" },
        { name: "discord", status: "disconnected" },
      ],
    };
  }

  async sendMessage(args) {
    const { channel, to, message } = args;

    if (this.openclaw_ws && this.openclaw_ws.readyState === WebSocket.OPEN) {
      this.openclaw_ws.send(
        JSON.stringify({
          type: "send_message",
          channel,
          to,
          content: message,
        }),
      );
      return { success: true, channel, to };
    }

    return {
      success: false,
      error: "OpenClaw Gateway not connected",
      note: "Start OpenClaw Gateway first: node dist/entry.mjs gateway --port 18789",
    };
  }

  async runAgent(args) {
    const { prompt, thinking = "medium" } = args;

    if (this.openclaw_ws && this.openclaw_ws.readyState === WebSocket.OPEN) {
      this.openclaw_ws.send(
        JSON.stringify({
          type: "agent_request",
          prompt,
          thinking,
        }),
      );
      return { success: true, message: "Agent request sent" };
    }

    return {
      success: false,
      error: "OpenClaw Gateway not connected",
    };
  }

  async getGatewayStatus() {
    return {
      status: "running",
      port: OPENCLAW_GATEWAY_PORT,
      version: "2026.2.6-3",
      connected: this.openclaw_ws?.readyState === WebSocket.OPEN,
    };
  }

  async searchMemory(args) {
    const { query, limit = 10 } = args;
    return {
      query,
      results: [],
      note: "Memory search requires OpenClaw Gateway connection",
    };
  }

  async listCrons() {
    return {
      jobs: [],
      note: "Cron jobs require OpenClaw Gateway connection",
    };
  }

  async readMessages(args) {
    const { channel, limit = 20 } = args;
    return {
      channel,
      messages: [],
      note: "Message reading requires OpenClaw Gateway connection",
    };
  }

  start() {
    const server = http.createServer((req, res) => {
      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", tools: Object.keys(this.tools) }));
      } else {
        res.writeHead(404);
        res.end("Not Found");
      }
    });

    this.wss = new WebSocket.Server({ server });

    this.wss.on("connection", (ws) => {
      console.log("[MCP] Gemini CLI connected");

      // Send available tools
      ws.send(
        JSON.stringify({
          type: "tools",
          tools: this.tools,
        }),
      );

      ws.on("message", async (data) => {
        try {
          const msg = JSON.parse(data.toString());

          if (msg.type === "tool_call") {
            const result = await this.handleToolCall(msg.tool, msg.args);
            ws.send(
              JSON.stringify({
                type: "tool_result",
                tool: msg.tool,
                result,
              }),
            );
          }
        } catch (err) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: err.message,
            }),
          );
        }
      });

      ws.on("close", () => {
        console.log("[MCP] Gemini CLI disconnected");
      });
    });

    server.listen(this.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║  OpenClaw MCP Server for Gemini CLI                       ║
║                                                           ║
║  Server running at: http://localhost:${this.port}          ║
║                                                           ║
║  Available tools:                                         ║
║    - list_channels    List messaging channels             ║
║    - send_message     Send message to channel             ║
║    - run_agent        Run OpenClaw agent                  ║
║    - gateway_status   Get gateway status                  ║
║    - search_memory    Search OpenClaw memory              ║
║    - list_crons       List scheduled jobs                 ║
║    - read_messages    Read channel messages                ║
║                                                           ║
║  To use with Gemini CLI:                                  ║
║    gemini mcp add openclaw "node ${process.cwd()}/gemini-mcp-server.js"  ║
║    gemini                                                   ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  }
}

// Parse command line args
const port = parseInt(process.argv[2]?.replace("--port=", "") || DEFAULT_PORT);

// Start MCP server
const mcp = new OpenClawMCPServer(port);
mcp
  .connectToOpenClaw()
  .then(() => {
    mcp.start();
  })
  .catch((err) => {
    console.error("Failed to start:", err);
    process.exit(1);
  });
