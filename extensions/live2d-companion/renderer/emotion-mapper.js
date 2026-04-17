const EMOTION_MAP = {
    happy: {
        motion: { group: "TapBody", index: 0 },
        expression: "exp_happy",
        speedRate: 1.1,
        pitchScale: 1.05,
    },
    sad: {
        motion: { group: "FlickHead", index: 0 },
        expression: "exp_sad",
        speedRate: 0.9,
        pitchScale: 0.95,
    },
    surprised: {
        motion: { group: "Shake", index: 0 },
        expression: "exp_surprised",
        speedRate: 1.2,
        pitchScale: 1.1,
    },
    angry: {
        motion: { group: "Shake", index: 1 },
        expression: "exp_angry",
        speedRate: 1.15,
        pitchScale: 0.9,
    },
    embarrassed: {
        motion: { group: "TapBody", index: 1 },
        expression: "exp_embarrassed",
        speedRate: 1.05,
        pitchScale: 1.0,
    },
    neutral: {
        motion: { group: "Idle", index: 0 },
        expression: "",
        speedRate: 1.0,
        pitchScale: 1.0,
    },
};
const KEYWORD_MAP = [
    { emotion: "happy", patterns: /嬉しい|ありがとう|！！|うれし|よかった|やった/u },
    { emotion: "sad", patterns: /悲しい|ごめん|泣|つらい|さびしい|残念/u },
    { emotion: "surprised", patterns: /えっ|驚|！\?|びっくり|まさか/u },
    { emotion: "angry", patterns: /怒|ダメ|やめて|許せない|むかつく/u },
    { emotion: "embarrassed", patterns: /恥ずかしい|えへ|照れ|もう…|きゃっ/u },
];
const EXPLICIT_TAG = /\[EMOTION:(\w+)\]/i;
export function detectEmotion(text) {
    // Check explicit tag first
    const tagMatch = EXPLICIT_TAG.exec(text);
    if (tagMatch) {
        const tag = tagMatch[1].toLowerCase();
        if (tag in EMOTION_MAP)
            return tag;
    }
    // Keyword scan
    for (const { emotion, patterns } of KEYWORD_MAP) {
        if (patterns.test(text))
            return emotion;
    }
    return "neutral";
}
export function applyEmotion(controller, emotion) {
    const profile = EMOTION_MAP[emotion] ?? EMOTION_MAP.neutral;
    controller.playMotion(profile.motion.group, profile.motion.index);
    if (profile.expression) {
        controller.playExpression(profile.expression);
    }
    return profile;
}
export function getEmotionProfile(emotion) {
    return EMOTION_MAP[emotion] ?? EMOTION_MAP.neutral;
}
