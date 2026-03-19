import {
  sendVRChatChatbox,
  sendVRChatInput,
  sendVRChatOscRaw,
} from "../../metaverse/vrchat-core.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";

export const vrchatHandlers: GatewayRequestHandlers = {
  "vrchat.chatbox": async ({ params, respond }) => {
    const { message, sendImmediately = true } = params as {
      message: string;
      sendImmediately?: boolean;
    };
    if (!message) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "message required"));
      return;
    }

    const result = await sendVRChatChatbox(message, sendImmediately);
    if (result.success) {
      respond(true, { ok: true });
    } else {
      respond(false, undefined, errorShape(ErrorCodes.INTERNAL_ERROR, result.error));
    }
  },

  "vrchat.input": async ({ params, respond }) => {
    const { action, value = true } = params as {
      action: string;
      value?: boolean | number;
    };
    if (!action) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "action required"));
      return;
    }

    const result = await sendVRChatInput(action, value);
    if (result.success) {
      respond(true, { ok: true });
    } else {
      respond(false, undefined, errorShape(ErrorCodes.INTERNAL_ERROR, result.error));
    }
  },

  "vrchat.status": async ({ respond }) => {
    // Currently just returns a heartbeat of the core metaverse substrate
    respond(true, {
      ok: true,
      substrate: "python-osc",
      bridge: "scripts/osc_chatbox.py",
    });
  },

  "vrchat.raw": async ({ params, respond }) => {
    const { address, args = [] } = params as {
      address: string;
      args?: (string | number | boolean | null)[];
    };
    if (!address) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "address required"));
      return;
    }

    const result = await sendVRChatOscRaw(address, args);
    if (result.success) {
      respond(true, { ok: true });
    } else {
      respond(false, undefined, errorShape(ErrorCodes.INTERNAL_ERROR, result.error));
    }
  },
};
