import {
  tryLoadActivatedBundledPluginPublicSurfaceModuleSync,
} from "./facade-runtime.js";

export type LocalWhisperMicSessionState = "idle" | "listening" | "processing" | "error";

export type LocalWhisperMicSessionHandlers = {
  onTranscript: (text: string) => void;
  onError?: (error: Error) => void;
  onStateChange?: (state: LocalWhisperMicSessionState) => void;
};

export type LocalWhisperMicSession = {
  start: () => Promise<boolean>;
  stop: () => void;
  getState: () => LocalWhisperMicSessionState;
  isRunning: () => boolean;
};

export type LocalVoiceCompanionDefaults = {
  sttBackend: "local-voice-whisper";
  ttsBackend: "voicevox";
};

type LocalVoiceFacadeModule = {
  resolveLocalVoiceCompanionDefaults: () => LocalVoiceCompanionDefaults;
  createLocalWhisperMicSession: (params: {
    sttConfig?: Record<string, unknown>;
    handlers: LocalWhisperMicSessionHandlers;
  }) => LocalWhisperMicSession;
};

function tryLoadLocalVoiceFacadeModule(): LocalVoiceFacadeModule | null {
  return tryLoadActivatedBundledPluginPublicSurfaceModuleSync<LocalVoiceFacadeModule>({
    dirName: "local-voice",
    artifactBasename: "runtime-api.js",
  });
}

export function resolveLocalVoiceCompanionDefaults(): LocalVoiceCompanionDefaults {
  return (
    tryLoadLocalVoiceFacadeModule()?.resolveLocalVoiceCompanionDefaults() ?? {
      sttBackend: "local-voice-whisper",
      ttsBackend: "voicevox",
    }
  );
}

export function createLocalWhisperMicSession(params: {
  sttConfig?: Record<string, unknown>;
  handlers: LocalWhisperMicSessionHandlers;
}): LocalWhisperMicSession | null {
  return tryLoadLocalVoiceFacadeModule()?.createLocalWhisperMicSession(params) ?? null;
}
