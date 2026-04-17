import { loadActivatedBundledPluginPublicSurfaceModuleSync, } from "./facade-runtime.js";
export const COMPANION_PERMISSION_CAPABILITIES = [
    "mic",
    "camera",
    "screen",
    "tab-follow",
];
function loadLive2dCompanionFacadeModule() {
    return loadActivatedBundledPluginPublicSurfaceModuleSync({
        dirName: "live2d-companion",
        artifactBasename: "runtime-api.js",
    });
}
export function getCompanionState(params) {
    return loadLive2dCompanionFacadeModule().getCompanionState(params);
}
export function getCompanionInputSnapshot(params) {
    return loadLive2dCompanionFacadeModule().getCompanionInputSnapshot(params);
}
export function setCompanionPermission(params) {
    return loadLive2dCompanionFacadeModule().setCompanionPermission(params);
}
export function speakWithCompanion(params) {
    return loadLive2dCompanionFacadeModule().speakWithCompanion(params);
}
export function setCompanionAvatarCommand(params) {
    return loadLive2dCompanionFacadeModule().setCompanionAvatarCommand(params);
}
export function attachCompanionTab(params) {
    return loadLive2dCompanionFacadeModule().attachCompanionTab(params);
}
export function detachCompanionTab(params) {
    return loadLive2dCompanionFacadeModule().detachCompanionTab(params);
}
export function updateCompanionTabContext(params) {
    return loadLive2dCompanionFacadeModule().updateCompanionTabContext(params);
}
export function requestCompanionTabSnapshot(params) {
    return loadLive2dCompanionFacadeModule().requestCompanionTabSnapshot(params);
}
export function importCompanionAsset(params) {
    return loadLive2dCompanionFacadeModule().importCompanionAsset(params);
}
export function activateCompanionAsset(params) {
    return loadLive2dCompanionFacadeModule().activateCompanionAsset(params);
}
export function requestCompanionCameraCapture(params) {
    return loadLive2dCompanionFacadeModule().requestCompanionCameraCapture(params);
}
export function requestCompanionScreenCapture(params) {
    return loadLive2dCompanionFacadeModule().requestCompanionScreenCapture(params);
}
