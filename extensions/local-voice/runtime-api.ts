import { AudioInput } from "./src/audio-input.js";
import {
  LocalWhisperSTT,
  type STTConfig,
  type STTEventHandlers,
  type STTSessionState,
} from "./src/stt.js";

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
  getLastError: () => string | null;
};

export type LocalVoiceCompanionDefaults = {
  sttBackend: "local-voice-whisper";
  ttsBackend: "voicevox";
};

export function resolveLocalVoiceCompanionDefaults(): LocalVoiceCompanionDefaults {
  return {
    sttBackend: "local-voice-whisper",
    ttsBackend: "voicevox",
  };
}

export function createLocalWhisperMicSession(params: {
  sttConfig?: Partial<STTConfig>;
  handlers: LocalWhisperMicSessionHandlers;
}): LocalWhisperMicSession {
  let state: LocalWhisperMicSessionState = "idle";
  let running = false;
  let lastError: string | null = null;
  let audioInput: AudioInput | null = null;
  let sttSession: LocalWhisperSTT | null = null;

  const setState = (nextState: LocalWhisperMicSessionState): void => {
    if (state !== nextState) {
      state = nextState;
      params.handlers.onStateChange?.(nextState);
    }
  };

  const sttHandlers: STTEventHandlers = {
    onTranscript: (text) => {
      params.handlers.onTranscript(text);
      setState("listening");
    },
    onError: (error) => {
      lastError = error.message;
      setState("error");
      params.handlers.onError?.(error);
    },
    onConnect: () => {
      setState("listening");
    },
    onDisconnect: () => {
      if (!running) {
        setState("idle");
        return;
      }
      lastError = lastError ?? "Local whisper STT disconnected unexpectedly";
      setState("error");
    },
    onSpeechEnd: () => {
      if (running) {
        setState("processing");
      }
    },
  };

  return {
    start: async () => {
      if (running) {
        return true;
      }

      lastError = null;
      running = true;
      sttSession = new LocalWhisperSTT(params.sttConfig ?? {}, sttHandlers);
      try {
        await sttSession.connect();
      } catch (error) {
        running = false;
        lastError = `Unable to start local whisper STT: ${
          error instanceof Error ? error.message : String(error)
        }`;
        sttSession = null;
        setState("error");
        return false;
      }

      audioInput = new AudioInput();
      audioInput.onData((data) => {
        sttSession?.sendAudio(data);
      });
      const started = audioInput.start();
      if (!started) {
        lastError = audioInput.getLastError() ?? "Unable to start microphone capture";
        running = false;
        setState("error");
        sttSession.disconnect();
        sttSession = null;
        audioInput = null;
        return false;
      }
      setState("listening");
      return true;
    },
    stop: () => {
      running = false;
      audioInput?.stop();
      sttSession?.disconnect();
      audioInput = null;
      sttSession = null;
      setState("idle");
    },
    getState: () => state,
    isRunning: () => running,
    getLastError: () => lastError,
  };
}

export type { STTConfig, STTSessionState };
