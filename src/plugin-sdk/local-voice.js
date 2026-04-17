import { tryLoadActivatedBundledPluginPublicSurfaceModuleSync, } from "./facade-runtime.js";
function tryLoadLocalVoiceFacadeModule() {
    return tryLoadActivatedBundledPluginPublicSurfaceModuleSync({
        dirName: "local-voice",
        artifactBasename: "runtime-api.js",
    });
}
export function resolveLocalVoiceCompanionDefaults() {
    return (tryLoadLocalVoiceFacadeModule()?.resolveLocalVoiceCompanionDefaults() ?? {
        sttBackend: "local-voice-whisper",
        ttsBackend: "voicevox",
    });
}
export function createLocalWhisperMicSession(params) {
    return tryLoadLocalVoiceFacadeModule()?.createLocalWhisperMicSession(params) ?? null;
}
