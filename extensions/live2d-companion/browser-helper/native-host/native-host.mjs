import { attachCompanionTab, detachCompanionTab, updateCompanionTabContext } from "../../runtime-api.js";

const stdin = process.stdin;
stdin.resume();
stdin.on("readable", readMessages);

let buffer = Buffer.alloc(0);

function sendMessage(message) {
  const payload = Buffer.from(JSON.stringify(message), "utf8");
  const header = Buffer.alloc(4);
  header.writeUInt32LE(payload.length, 0);
  process.stdout.write(Buffer.concat([header, payload]));
}

async function handleMessage(message) {
  try {
    switch (message?.type) {
      case "attach-tab":
        await attachCompanionTab({
          attachment: {
            tabId: String(message.tabId),
            url: String(message.url ?? ""),
            title: String(message.title ?? ""),
            ...(typeof message.textSnapshot === "string"
              ? { textSnapshot: message.textSnapshot }
              : {}),
          },
        });
        sendMessage({ ok: true, type: "attach-tab" });
        return;
      case "update-tab-context":
        await updateCompanionTabContext({
          attachment: {
            tabId: String(message.tabId),
            ...(typeof message.url === "string" ? { url: message.url } : {}),
            ...(typeof message.title === "string" ? { title: message.title } : {}),
            ...(typeof message.textSnapshot === "string"
              ? { textSnapshot: message.textSnapshot }
              : {}),
          },
        });
        sendMessage({ ok: true, type: "update-tab-context" });
        return;
      case "detach-tab":
        await detachCompanionTab();
        sendMessage({ ok: true, type: "detach-tab" });
        return;
      default:
        sendMessage({ ok: false, error: "unsupported_message" });
    }
  } catch (error) {
    sendMessage({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function readMessages() {
  let chunk;
  while ((chunk = stdin.read()) !== null) {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length >= 4) {
      const messageLength = buffer.readUInt32LE(0);
      if (buffer.length < 4 + messageLength) {
        break;
      }
      const body = buffer.subarray(4, 4 + messageLength);
      buffer = buffer.subarray(4 + messageLength);
      void handleMessage(JSON.parse(body.toString("utf8")));
    }
  }
}
