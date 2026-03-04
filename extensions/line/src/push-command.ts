/**
 * LINE Proactive Push command module.
 *
 * Registers slash commands so that the はくあ AI persona can
 * proactively send LINE messages without waiting for an inbound webhook.
 *
 * Usage:
 *   /line_push <userId> <message text...>
 *   /line_status
 */

import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { getLineRuntime } from "./runtime.js";

export function registerLinePushCommand(api: OpenClawPluginApi): void {
  // /line_push <userId> <message...>
  api.registerCommand({
    name: "line_push",
    description:
      "Send a proactive LINE message to a user or group. " +
      "Usage: /line_push <userId> <message>. " +
      "はくあから能動的にLINEメッセージを送信します。",
    acceptsArgs: true,
    requireAuth: true,
    handler: async (ctx) => {
      const args = (ctx.args ?? "").trim();
      if (!args) {
        return {
          text: "Usage: /line_push <lineUserId> <message text>\nExample: /line_push Uxxxxxxxx こんにちは！",
        };
      }

      // First token is the target ID, rest is the message
      const spaceIdx = args.indexOf(" ");
      if (spaceIdx === -1) {
        return {
          text: "Error: メッセージ本文が必要です。\nUsage: /line_push <lineUserId> <message>",
        };
      }

      const to = args.substring(0, spaceIdx).trim();
      const message = args.substring(spaceIdx + 1).trim();

      if (!message) {
        return { text: "Error: メッセージが空です。" };
      }

      const { pushMessageLine } = getLineRuntime().channel.line;
      try {
        const result = await pushMessageLine(to, message, { verbose: true });
        const preview = message.length > 50 ? `${message.substring(0, 50)}…` : message;
        return {
          text: `✓ LINEメッセージ送信完了 → ${result.chatId}: ${preview}`,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { text: `✗ LINE push 失敗: ${msg}` };
      }
    },
  });

  // /line_status
  api.registerCommand({
    name: "line_status",
    description: "LINEチャネルの設定状態とBot名を確認します。",
    acceptsArgs: false,
    requireAuth: true,
    handler: async () => {
      const runtime = getLineRuntime();
      const cfg = runtime.config.loadConfig();
      try {
        const account = runtime.channel.line.resolveLineAccount({ cfg });
        const configured = Boolean(
          account.channelAccessToken?.trim() && account.channelSecret?.trim(),
        );
        const probe = configured
          ? await runtime.channel.line.probeLineBot(account.channelAccessToken, 3000)
          : null;
        const botName = probe?.ok ? (probe.bot?.displayName ?? "Unknown") : "N/A";
        return {
          text: [
            `LINE Status:`,
            `- Configured: ${configured}`,
            `- Bot Name: ${botName}`,
            `- Account ID: ${account.accountId}`,
            `- DM Policy: ${account.config.dmPolicy ?? "pairing"}`,
            `- Group Policy: ${account.config.groupPolicy ?? "allowlist"}`,
          ].join("\n"),
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { text: `LINE status check failed: ${msg}` };
      }
    },
  });
}
