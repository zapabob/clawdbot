import companionConfig from "../companion.config.json" assert { type: "json" };
const VOICEVOX_BASE = companionConfig.voicevoxUrl;
const SPEAKER = companionConfig.voicevoxSpeaker;
export class LipSyncController {
  live2d;
  audioCtx = null;
  analyser = null;
  dataArray = null;
  lipAnimFrame = null;
  constructor(live2d) {
    this.live2d = live2d;
  }
  async speak(text, emotionProfile) {
    try {
      // 1. Audio query
      const queryRes = await fetch(
        `${VOICEVOX_BASE}/audio_query?text=${encodeURIComponent(text)}&speaker=${SPEAKER}`,
        { method: "POST" },
      );
      if (!queryRes.ok) throw new Error(`audio_query failed: ${queryRes.status}`);
      const query = await queryRes.json();
      // Apply emotion modifiers
      if (emotionProfile) {
        query.speedScale = (query.speedRate ?? 1.0) * emotionProfile.speedRate;
        query.pitchScale = (query.pitchScale ?? 0.0) + (emotionProfile.pitchScale - 1.0) * 0.3;
      }
      // 2. Synthesis → WAV buffer
      const synthRes = await fetch(`${VOICEVOX_BASE}/synthesis?speaker=${SPEAKER}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });
      if (!synthRes.ok) throw new Error(`synthesis failed: ${synthRes.status}`);
      const wavBuffer = await synthRes.arrayBuffer();
      // 3. Phoneme-based timeline as fallback (run regardless for accuracy)
      const phonemeTimeline = buildPhonemeTimeline(query);
      // 4. Play audio + lip sync
      await this.playWithLipSync(wavBuffer, phonemeTimeline);
    } catch (err) {
      console.warn("[LipSync] VOICEVOX unavailable:", err);
    }
  }
  async playWithLipSync(wavBuffer, timeline) {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    const decoded = await this.audioCtx.decodeAudioData(wavBuffer);
    const source = this.audioCtx.createBufferSource();
    source.buffer = decoded;
    // Analyser for real-time amplitude
    if (!this.analyser) {
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.dataArray = new Float32Array(this.analyser.fftSize);
    }
    source.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
    const startTime = this.audioCtx.currentTime;
    source.start(startTime);
    // Phoneme timeline playback
    for (const point of timeline) {
      const delay = point.t * 1000;
      setTimeout(() => this.live2d.setLipSyncValue(point.v), delay);
    }
    // Real-time amplitude polling
    this.startAnalyserLoop();
    source.onended = () => {
      this.stopAnalyserLoop();
      this.live2d.setLipSyncValue(0);
    };
  }
  startAnalyserLoop() {
    if (this.lipAnimFrame !== null) return;
    const loop = () => {
      if (this.analyser && this.dataArray) {
        this.analyser.getFloatTimeDomainData(this.dataArray);
        let sum = 0;
        for (const v of this.dataArray) sum += v * v;
        const rms = Math.sqrt(sum / this.dataArray.length);
        // Map RMS (0..~0.3) to lip open (0..1)
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
  const OPEN_VOWELS = new Set(["a", "e", "i", "o", "u", "A", "E", "I", "O", "U"]);
  for (const phrase of query.accent_phrases ?? []) {
    for (const mora of phrase.moras ?? []) {
      const dur = mora.vowel_length ?? 0.07;
      // Open mouth at start of mora, close at end
      timeline.push({ t, v: 0.8 });
      timeline.push({ t: t + dur * 0.8, v: 0 });
      t += dur;
    }
  }
  return timeline;
}
