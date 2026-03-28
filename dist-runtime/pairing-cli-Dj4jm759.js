import { t as formatCliCommand } from "./command-format-CI2Z3AdK.js";
import "./paths-Chd_ukvM.js";
import "./globals-BKVgh_pY.js";
import { s as loadConfig } from "./io-BeL7sW7Y.js";
import "./utils-DGUUVa38.js";
import { t as formatDocsLink } from "./links-CZOLMG0R.js";
import "./ansi-D3lUajt1.js";
import "./agent-scope-BIySJgkJ.js";
import "./file-identity-DgWfjfnD.js";
import "./boundary-file-read-DZTg2Wyt.js";
import "./logger-BsvC8P6f.js";
import "./exec-CbOKTdtq.js";
import "./registry-B5KsIQB2.js";
import { t as resolvePairingIdLabel } from "./pairing-labels-Bo86uP7c.js";
import "./boolean-CsNbQKvJ.js";
import "./env-C-KVzFmc.js";
import "./shell-env-BOjFl6MZ.js";
import "./config-state-CGV1IKLE.js";
import "./version-yfoo3YbF.js";
import "./min-host-version-DM6er2ZX.js";
import "./manifest-registry-CMy5XLiN.js";
import "./runtime-guard-WQAOpX6v.js";
import "./safe-text-CpFY0TZg.js";
import "./model-selection-CNzhkJya.js";
import "./env-substitution-X9lTyhgh.js";
import "./network-mode-JwypQ_rG.js";
import "./ip-CWtG939A.js";
import "./config-Cfud9qZm.js";
import "./runtime-Bd4XqlOP.js";
import "./json-file-zQUdGjzr.js";
import {
  f as listPairingChannels,
  n as approveChannelPairingCode,
  p as notifyPairingApproved,
  r as listChannelPairingRequests,
} from "./pairing-store-C5UkJF1E.js";
import { m as normalizeChannelId } from "./plugins-AUGbKgu9.js";
import { l as defaultRuntime } from "./subsystem-BZRyMoTO.js";
import { n as renderTable, t as getTerminalTableWidth } from "./table-o09hXzA6.js";
import { r as theme } from "./theme-CWrxY1-_.js";
//#region src/cli/pairing-cli.ts
/** Parse channel, allowing extension channels not in core registry. */
function parseChannel(raw, channels) {
  const value = (
    typeof raw === "string"
      ? raw
      : typeof raw === "number" || typeof raw === "boolean"
        ? String(raw)
        : ""
  )
    .trim()
    .toLowerCase();
  if (!value) throw new Error("Channel required");
  const normalized = normalizeChannelId(value);
  if (normalized) {
    if (!channels.includes(normalized))
      throw new Error(`Channel ${normalized} does not support pairing`);
    return normalized;
  }
  if (/^[a-z][a-z0-9_-]{0,63}$/.test(value)) return value;
  throw new Error(`Invalid channel: ${value}`);
}
async function notifyApproved(channel, id) {
  await notifyPairingApproved({
    channelId: channel,
    id,
    cfg: loadConfig(),
  });
}
function registerPairingCli(program) {
  const channels = listPairingChannels();
  const pairing = program
    .command("pairing")
    .description("Secure DM pairing (approve inbound requests)")
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/pairing", "docs.openclaw.ai/cli/pairing")}\n`,
    );
  pairing
    .command("list")
    .description("List pending pairing requests")
    .option("--channel <channel>", `Channel (${channels.join(", ")})`)
    .option("--account <accountId>", "Account id (for multi-account channels)")
    .argument("[channel]", `Channel (${channels.join(", ")})`)
    .option("--json", "Print JSON", false)
    .action(async (channelArg, opts) => {
      const channelRaw = opts.channel ?? channelArg ?? (channels.length === 1 ? channels[0] : "");
      if (!channelRaw)
        throw new Error(
          `Channel required. Use --channel <channel> or pass it as the first argument (expected one of: ${channels.join(", ")})`,
        );
      const channel = parseChannel(channelRaw, channels);
      const accountId = String(opts.account ?? "").trim();
      const requests = accountId
        ? await listChannelPairingRequests(channel, process.env, accountId)
        : await listChannelPairingRequests(channel);
      if (opts.json) {
        defaultRuntime.writeJson({
          channel,
          requests,
        });
        return;
      }
      if (requests.length === 0) {
        defaultRuntime.log(theme.muted(`No pending ${channel} pairing requests.`));
        return;
      }
      const idLabel = resolvePairingIdLabel(channel);
      const tableWidth = getTerminalTableWidth();
      defaultRuntime.log(
        `${theme.heading("Pairing requests")} ${theme.muted(`(${requests.length})`)}`,
      );
      defaultRuntime.log(
        renderTable({
          width: tableWidth,
          columns: [
            {
              key: "Code",
              header: "Code",
              minWidth: 10,
            },
            {
              key: "ID",
              header: idLabel,
              minWidth: 12,
              flex: true,
            },
            {
              key: "Meta",
              header: "Meta",
              minWidth: 8,
              flex: true,
            },
            {
              key: "Requested",
              header: "Requested",
              minWidth: 12,
            },
          ],
          rows: requests.map((r) => ({
            Code: r.code,
            ID: r.id,
            Meta: r.meta ? JSON.stringify(r.meta) : "",
            Requested: r.createdAt,
          })),
        }).trimEnd(),
      );
    });
  pairing
    .command("approve")
    .description("Approve a pairing code and allow that sender")
    .option("--channel <channel>", `Channel (${channels.join(", ")})`)
    .option("--account <accountId>", "Account id (for multi-account channels)")
    .argument("<codeOrChannel>", "Pairing code (or channel when using 2 args)")
    .argument("[code]", "Pairing code (when channel is passed as the 1st arg)")
    .option("--notify", "Notify the requester on the same channel", false)
    .action(async (codeOrChannel, code, opts) => {
      const defaultChannel = channels.length === 1 ? channels[0] : "";
      const usingExplicitChannel = Boolean(opts.channel);
      const hasPositionalCode = code != null;
      const channelRaw = usingExplicitChannel
        ? opts.channel
        : hasPositionalCode
          ? codeOrChannel
          : defaultChannel;
      const resolvedCode = usingExplicitChannel
        ? codeOrChannel
        : hasPositionalCode
          ? code
          : codeOrChannel;
      if (!channelRaw || !resolvedCode)
        throw new Error(
          `Usage: ${formatCliCommand("openclaw pairing approve <channel> <code>")} (or: ${formatCliCommand("openclaw pairing approve --channel <channel> <code>")})`,
        );
      if (opts.channel && code != null)
        throw new Error(
          `Too many arguments. Use: ${formatCliCommand("openclaw pairing approve --channel <channel> <code>")}`,
        );
      const channel = parseChannel(channelRaw, channels);
      const accountId = String(opts.account ?? "").trim();
      const approved = accountId
        ? await approveChannelPairingCode({
            channel,
            code: String(resolvedCode),
            accountId,
          })
        : await approveChannelPairingCode({
            channel,
            code: String(resolvedCode),
          });
      if (!approved)
        throw new Error(`No pending pairing request found for code: ${String(resolvedCode)}`);
      defaultRuntime.log(
        `${theme.success("Approved")} ${theme.muted(channel)} sender ${theme.command(approved.id)}.`,
      );
      if (!opts.notify) return;
      await notifyApproved(channel, approved.id).catch((err) => {
        defaultRuntime.log(theme.warn(`Failed to notify requester: ${String(err)}`));
      });
    });
}
//#endregion
export { registerPairingCli };
