import companionConfig from "../companion.config.json" with { type: "json" };
export class SttHandler {
    recognition = null;
    active = false;
    onTranscript = null;
    constructor(onTranscript) {
        this.onTranscript = onTranscript;
        this.init();
    }
    init() {
        const Ctor = window.SpeechRecognition ??
            window
                .webkitSpeechRecognition;
        if (!Ctor) {
            console.warn("[STT] SpeechRecognition API not available in this environment.");
            return;
        }
        this.recognition = new Ctor();
        this.recognition.lang = companionConfig.stt.lang;
        this.recognition.continuous = companionConfig.stt.continuous;
        this.recognition.interimResults = false;
        this.recognition.onresult = (event) => {
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
        this.recognition.onerror = (event) => {
            const err = event.error;
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
                        }
                        catch {
                            /* already started */
                        }
                    }
                }, 300);
            }
        };
    }
    start() {
        if (!this.recognition)
            return;
        this.active = true;
        try {
            this.recognition.start();
        }
        catch {
            // Already started
        }
    }
    stop() {
        if (!this.recognition)
            return;
        this.active = false;
        try {
            this.recognition.stop();
        }
        catch {
            // Already stopped
        }
    }
    get isActive() {
        return this.active;
    }
}
