import WebSocket from "ws";
import type { AuthResult } from "./auth.js";
import { loadOpenAICodexAuth } from "./auth.js";

export type STTConfig = {
  model: string;
  vadThreshold: number;
  silenceDurationMs: number;
  prefixPaddingMs: number;
};

export type STTEventHandlers = {
  onTranscript: (text: string) => void;
  onPartial?: (text: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

export type STTSessionState = "disconnected" | "connecting" | "connected" | "error";

export interface STTSession {
  connect(): Promise<void>;
  disconnect(): void;
  sendAudio(data: Buffer): void;
  getState(): STTSessionState;
}

const DEFAULT_STT_CONFIG: STTConfig = {
  model: "gpt-4o-transcribe",
  vadThreshold: 0.5,
  silenceDurationMs: 800,
  prefixPaddingMs: 300,
};

export class OpenAIRealtimeSTT implements STTSession {
  private ws: WebSocket | null = null;
  private config: STTConfig;
  private handlers: STTEventHandlers;
  private state: STTSessionState = "disconnected";
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor(config: Partial<STTConfig>, handlers: STTEventHandlers) {
    this.config = { ...DEFAULT_STT_CONFIG, ...config };
    this.handlers = handlers;
  }

  getState(): STTSessionState {
    return this.state;
  }

  async connect(): Promise<void> {
    if (this.state === "connected" || this.state === "connecting") {
      return;
    }

    const authResult: AuthResult = await loadOpenAICodexAuth();
    if (!authResult.success || !authResult.accessToken) {
      const error = new Error(authResult.error ?? "Authentication failed");
      this.handlers.onError?.(error);
      this.state = "error";
      throw error;
    }

    this.state = "connecting";

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket("wss://api.openai.com/v1/realtime?intent=transcription", {
          headers: {
            Authorization: `Bearer ${authResult.accessToken}`,
            "OpenAI-Beta": "realtime=v1",
          },
        });

        this.setupWebSocketHandlers(resolve, reject);
      } catch (err) {
        this.state = "error";
        reject(err);
      }
    });
  }

  private setupWebSocketHandlers(resolve: () => void, reject: (error: Error) => void): void {
    if (!this.ws) {
      return;
    }

    const connectionTimeout = setTimeout(() => {
      if (this.state === "connecting") {
        this.state = "error";
        reject(new Error("Connection timeout"));
        this.ws?.close();
      }
    }, 10000);

    this.ws.on("open", () => {
      clearTimeout(connectionTimeout);
      this.state = "connected";
      this.reconnectAttempts = 0;
      this.configureSession();
      this.handlers.onConnect?.();
      resolve();
    });

    this.ws.on("message", (data: WebSocket.RawData) => {
      this.handleMessage(data);
    });

    this.ws.on("error", (error: Error) => {
      clearTimeout(connectionTimeout);
      this.state = "error";
      this.handlers.onError?.(error);
      reject(error);
    });

    this.ws.on("close", () => {
      clearTimeout(connectionTimeout);
      const wasConnected = this.state === "connected";
      this.state = "disconnected";
      if (wasConnected) {
        this.handlers.onDisconnect?.();
        this.attemptReconnect();
      }
    });
  }

  private configureSession(): void {
    this.sendEvent({
      type: "transcription_session.update",
      session: {
        input_audio_format: "g711_ulaw",
        input_audio_transcription: {
          model: this.config.model,
        },
        turn_detection: {
          type: "server_vad",
          threshold: this.config.vadThreshold,
          prefix_padding_ms: this.config.prefixPaddingMs,
          silence_duration_ms: this.config.silenceDurationMs,
        },
      },
    });
  }

  private handleMessage(data: WebSocket.RawData): void {
    try {
      const event = JSON.parse(data.toString()) as STTEvent;
      this.processEvent(event);
    } catch (err) {
      this.handlers.onError?.(new Error(`Failed to parse message: ${String(err)}`));
    }
  }

  private processEvent(event: STTEvent): void {
    switch (event.type) {
      case "transcription_session.created":
      case "transcription_session.updated":
        break;

      case "input_audio_buffer.speech_started":
        this.handlers.onSpeechStart?.();
        break;

      case "input_audio_buffer.speech_stopped":
        this.handlers.onSpeechEnd?.();
        break;

      case "conversation.item.input_audio_transcription.delta":
        if (event.delta) {
          this.handlers.onPartial?.(event.delta);
        }
        break;

      case "conversation.item.input_audio_transcription.completed":
        if (event.transcript) {
          this.handlers.onTranscript(event.transcript);
        }
        break;

      case "error":
        this.handlers.onError?.(new Error(event.error?.message ?? "Unknown STT error"));
        break;
    }
  }

  private sendEvent(event: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  sendAudio(muLawData: Buffer): void {
    if (this.state !== "connected") {
      return;
    }
    this.sendEvent({
      type: "input_audio_buffer.append",
      audio: muLawData.toString("base64"),
    });
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.handlers.onError?.(new Error("Max reconnect attempts reached"));
      return;
    }

    this.reconnectAttempts++;
    const delay = 1000 * Math.pow(2, this.reconnectAttempts - 1);

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      await this.connect();
    } catch (err) {
      this.handlers.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.state = "disconnected";
  }
}

type STTEvent = {
  type: string;
  delta?: string;
  transcript?: string;
  error?: { message?: string };
};
