import companionConfig from "../companion.config.json" with { type: "json" };
const VOICEVOX_BASE = companionConfig.voicevoxUrl;
const SPEAKER = companionConfig.voicevoxSpeaker;
export class LipSyncController {
    live2d;
    audioCtx = null;
    analyser = null;
    dataArray = null;
    lipAnimFrame = null;
    ttsProvider = companionConfig.ttsProvider ?? "voicevox";
    constructor(live2d) {
        this.live2d = live2d;
    }
    async speak(text, emotionProfile) {
        if (this.ttsProvider === "voicevox") {
            try {
                await this.speakWithVoicevox(text, emotionProfile);
                return;
            }
            catch (err) {
                console.warn("[LipSync] VOICEVOX unavailable, falling back to Web Speech:", err);
            }
        }
        // Free TTS fallback: Web Speech API (browser built-in, no cost)
        await this.speakWithWebSpeech(text);
    }
    // ── VOICEVOX TTS ─────────────────────────────────────────────────────────
    async speakWithVoicevox(text, emotionProfile) {
        // 1. Audio query
        const queryRes = await fetch(`${VOICEVOX_BASE}/audio_query?text=${encodeURIComponent(text)}&speaker=${SPEAKER}`, { method: "POST" });
        if (!queryRes.ok)
            throw new Error(`audio_query failed: ${queryRes.status}`);
        const query = (await queryRes.json());
        // Apply emotion modifiers
        if (emotionProfile) {
            query.speedScale =
                (query.speedRate ?? 1.0) * emotionProfile.speedRate;
            query.pitchScale =
                (query.pitchScale ?? 0.0) + (emotionProfile.pitchScale - 1.0) * 0.3;
        }
        // 2. Synthesis → WAV buffer
        const synthRes = await fetch(`${VOICEVOX_BASE}/synthesis?speaker=${SPEAKER}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(query),
        });
        if (!synthRes.ok)
            throw new Error(`synthesis failed: ${synthRes.status}`);
        const wavBuffer = await synthRes.arrayBuffer();
        // 3. Phoneme-based timeline
        const phonemeTimeline = buildPhonemeTimeline(query);
        // 4. Play audio + lip sync
        await this.playWithLipSync(wavBuffer, phonemeTimeline);
    }
    // ── Web Speech API (無料フォールバック / Moonshot代替) ────────────────────
    speakWithWebSpeech(text) {
        return new Promise((resolve) => {
            if (!("speechSynthesis" in window)) {
                this.live2d.setLipSyncValue(0);
                resolve();
                return;
            }
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = companionConfig.webSpeechLang ?? "ja-JP";
            utterance.rate = companionConfig.webSpeechRate ?? 1.0;
            utterance.pitch = companionConfig.webSpeechPitch ?? 1.1;
            // Pick Japanese voice if available
            const voices = window.speechSynthesis.getVoices();
            const jaVoice = voices.find((v) => v.lang.startsWith("ja"));
            if (jaVoice)
                utterance.voice = jaVoice;
            // Simple lip sync: open mouth on word boundaries
            utterance.onboundary = (e) => {
                if (e.name === "word") {
                    this.live2d.setLipSyncValue(0.65);
                    setTimeout(() => this.live2d.setLipSyncValue(0), 90);
                }
            };
            utterance.onstart = () => {
                window.companionBridge?.sendStateUpdate?.({ speaking: true });
            };
            utterance.onend = () => {
                this.live2d.setLipSyncValue(0);
                window.companionBridge?.sendStateUpdate?.({ speaking: false });
                resolve();
            };
            utterance.onerror = () => {
                this.live2d.setLipSyncValue(0);
                window.companionBridge?.sendStateUpdate?.({ speaking: false });
                resolve();
            };
            window.speechSynthesis.speak(utterance);
        });
    }
    // ── AudioContext playback + analyser lip sync ─────────────────────────────
    async playWithLipSync(wavBuffer, timeline) {
        if (!this.audioCtx) {
            this.audioCtx = new AudioContext();
        }
        const decoded = await this.audioCtx.decodeAudioData(wavBuffer);
        const source = this.audioCtx.createBufferSource();
        source.buffer = decoded;
        if (!this.analyser) {
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 256;
            this.dataArray = new Float32Array(this.analyser.fftSize);
        }
        source.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
        const startTime = this.audioCtx.currentTime;
        source.start(startTime);
        window.companionBridge?.sendStateUpdate?.({ speaking: true });
        for (const point of timeline) {
            const delay = point.t * 1000;
            setTimeout(() => this.live2d.setLipSyncValue(point.v), delay);
        }
        this.startAnalyserLoop();
        source.onended = () => {
            this.stopAnalyserLoop();
            this.live2d.setLipSyncValue(0);
            window.companionBridge?.sendStateUpdate?.({ speaking: false });
        };
    }
    startAnalyserLoop() {
        if (this.lipAnimFrame !== null)
            return;
        const loop = () => {
            if (this.analyser && this.dataArray) {
                this.analyser.getFloatTimeDomainData(this.dataArray);
                let sum = 0;
                for (const v of this.dataArray)
                    sum += v * v;
                const rms = Math.sqrt(sum / this.dataArray.length);
                this.live2d.setLipSyncValue(Math.min(1, rms * 6));
            }
            this.lipAnimFrame = requestAnimationFrame(loop);
        };
        this.lipAnimFrame = requestAnimationFrame(loop);
    }
    stopAnalyserLoop() {
        if (this.lipAnimFrame !== null) {
            cancelAnimationFrame(this.lipAnimFrame);
            this.lipAnimFrame = null;
        }
    }
}
function buildPhonemeTimeline(query) {
    const timeline = [];
    let t = 0;
    for (const phrase of query.accent_phrases ?? []) {
        for (const mora of phrase.moras ?? []) {
            const dur = mora.vowel_length ?? 0.07;
            timeline.push({ t, v: 0.8 });
            timeline.push({ t: t + dur * 0.8, v: 0 });
            t += dur;
        }
    }
    return timeline;
}
