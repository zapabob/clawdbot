import companionConfig from "../companion.config.json" assert { type: "json" };

type SpeechRecognitionEvent = Event & { results: SpeechRecognitionResultList };
type SpeechRecognitionResultList = { [index: number]: SpeechRecognitionResult; length: number };
type SpeechRecognitionResult = { [index: number]: SpeechRecognitionAlternative; isFinal: boolean };
type SpeechRecognitionAlternative = { transcript: string };

declare class SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare const webkitSpeechRecognition: typeof SpeechRecognition;

export class SttHandler {
  private recognition: SpeechRecognition | null = null;
  private active = false;
  private onTranscript: ((text: string) => void) | null = null;

  constructor(onTranscript: (text: string) => void) {
    this.onTranscript = onTranscript;
    this.init();
  }

  private init(): void {
    const Ctor =
      (
        window as unknown as {
          SpeechRecognition?: typeof SpeechRecognition;
          webkitSpeechRecognition?: typeof SpeechRecognition;
        }
      ).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;

    if (!Ctor) {
      console.warn("[STT] SpeechRecognition API not available in this environment.");
      return;
    }

    this.recognition = new Ctor();
    this.recognition.lang = companionConfig.stt.lang;
    this.recognition.continuous = companionConfig.stt.continuous;
    this.recognition.interimResults = false;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const transcript = result[0].transcript.trim();
          if (transcript) {
            this.onTranscript?.(transcript);
          }
        }
      }
    };

    this.recognition.onerror = (event: Event) => {
      const err = (event as Event & { error?: string }).error;
      if (err !== "no-speech" && err !== "aborted") {
        console.warn("[STT] Recognition error:", err);
      }
    };

    // Auto-restart on end (keeps continuous listening)
    this.recognition.onend = () => {
      if (this.active) {
        setTimeout(() => {
          if (this.active) {
            try {
              this.recognition?.start();
            } catch {
              /* already started */
            }
          }
        }, 300);
      }
    };
  }

  start(): void {
    if (!this.recognition) return;
    this.active = true;
    try {
      this.recognition.start();
    } catch {
      // Already started
    }
  }

  stop(): void {
    if (!this.recognition) return;
    this.active = false;
    try {
      this.recognition.stop();
    } catch {
      // Already stopped
    }
  }

  get isActive(): boolean {
    return this.active;
  }
}
