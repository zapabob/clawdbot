import path from "node:path";
import { sendCompanionIpcRequest, } from "./companion-ipc.js";
function resolveCompanionStateDir(stateDir) {
    return path.resolve(stateDir ?? process.env.OPENCLAW_STATE_DIR ?? path.join(process.cwd(), ".openclaw-desktop"));
}
async function sendCompanionAction(params) {
    return (await sendCompanionIpcRequest({
        stateDir: resolveCompanionStateDir(params.stateDir),
        action: params.action,
        ...(params.payload === undefined ? {} : { payload: params.payload }),
    }));
}
export function getCompanionState(params) {
    return sendCompanionAction({
        ...(params?.stateDir ? { stateDir: params.stateDir } : {}),
        action: "get-state",
    });
}
export function listCompanionAssets(params) {
    return sendCompanionAction({
        ...(params?.stateDir ? { stateDir: params.stateDir } : {}),
        action: "list-assets",
    });
}
export function getCompanionInputSnapshot(params) {
    return sendCompanionAction({
        ...(params?.stateDir ? { stateDir: params.stateDir } : {}),
        action: "get-input-snapshot",
        ...(params?.payload === undefined ? {} : { payload: params.payload }),
    });
}
export function setCompanionPermission(params) {
    return sendCompanionAction({
        ...(params.stateDir ? { stateDir: params.stateDir } : {}),
        action: "set-permission",
        payload: {
            capability: params.capability,
            decision: params.decision,
        },
    });
}
export function speakWithCompanion(params) {
    const payload = {
        text: params.text,
    };
    return sendCompanionAction({
        ...(params.stateDir ? { stateDir: params.stateDir } : {}),
        action: "speak",
        payload,
    });
}
export function setCompanionAvatarCommand(params) {
    return sendCompanionAction({
        ...(params.stateDir ? { stateDir: params.stateDir } : {}),
        action: "set-avatar-command",
        payload: {
            avatarCommand: params.avatarCommand,
        },
    });
}
export function attachCompanionTab(params) {
    return sendCompanionAction({
        ...(params.stateDir ? { stateDir: params.stateDir } : {}),
        action: "attach-tab",
        payload: params.attachment,
    });
}
export function detachCompanionTab(params) {
    return sendCompanionAction({
        ...(params?.stateDir ? { stateDir: params.stateDir } : {}),
        action: "detach-tab",
    });
}
export function updateCompanionTabContext(params) {
    return sendCompanionAction({
        ...(params.stateDir ? { stateDir: params.stateDir } : {}),
        action: "update-tab-context",
        payload: params.attachment,
    });
}
export function requestCompanionTabSnapshot(params) {
    return sendCompanionAction({
        ...(params?.stateDir ? { stateDir: params.stateDir } : {}),
        action: "request-tab-snapshot",
    });
}
export function importCompanionAsset(params) {
    return sendCompanionAction({
        ...(params.stateDir ? { stateDir: params.stateDir } : {}),
        action: "import-asset",
        payload: params.asset,
    });
}
export function activateCompanionAsset(params) {
    return sendCompanionAction({
        ...(params.stateDir ? { stateDir: params.stateDir } : {}),
        action: "activate-asset",
        payload: {
            assetId: params.assetId,
        },
    });
}
export function requestCompanionCameraCapture(params) {
    return sendCompanionAction({
        ...(params?.stateDir ? { stateDir: params.stateDir } : {}),
        action: "request-camera-capture",
    });
}
export function requestCompanionScreenCapture(params) {
    return sendCompanionAction({
        ...(params?.stateDir ? { stateDir: params.stateDir } : {}),
        action: "request-screen-capture",
    });
}
