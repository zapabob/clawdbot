function expressionForAsset(expression, assetType) {
  if (assetType === "live2d" && !expression.startsWith("exp_")) {
    return `exp_${expression}`;
  }
  return expression;
}
function motionForAsset(expression, assetType) {
  return assetType === "live2d" ? "TapBody" : expression;
}
export function buildOptimisticAvatarCommandState(params) {
  const { command, assetType } = params;
  const now = params.now ?? Date.now();
  let update = null;
  if (command.loadModel) {
    update = { lastAction: "load_model", lastUpdatedAt: now };
  }
  if (command.lookAt) {
    update = {
      ...(update ?? {}),
      lastAction: "look_at",
      lastLookAt: command.lookAt,
      lastUpdatedAt: now,
    };
  }
  if (command.pose) {
    update = {
      ...(update ?? {}),
      lastAction: "pose",
      lastUpdatedAt: now,
    };
  }
  if (typeof command.motion === "string" && command.motion.trim()) {
    update = {
      ...(update ?? {}),
      lastAction: "motion",
      lastMotion: command.motion.trim(),
      lastMotionIndex:
        typeof command.motionIndex === "number" && Number.isFinite(command.motionIndex)
          ? command.motionIndex
          : 0,
      lastUpdatedAt: now,
    };
  }
  if (typeof command.gesture === "string" && command.gesture.trim()) {
    update = {
      ...(update ?? {}),
      lastAction: "gesture",
      lastMotion: command.gesture.trim(),
      lastUpdatedAt: now,
    };
  }
  if (typeof command.expression === "string" && command.expression.trim()) {
    const expression = command.expression.trim();
    update = {
      ...(update ?? {}),
      lastAction: "expression",
      lastEmotion: expression,
      lastExpression: expressionForAsset(expression, assetType),
      lastMotion: motionForAsset(expression, assetType),
      lastMotionIndex:
        typeof command.motionIndex === "number" && Number.isFinite(command.motionIndex)
          ? command.motionIndex
          : 0,
      lastUpdatedAt: now,
    };
  }
  if (typeof command.speakText === "string" && command.speakText.trim()) {
    const emotion =
      typeof command.speakEmotion === "string" && command.speakEmotion.trim()
        ? command.speakEmotion.trim()
        : typeof command.expression === "string" && command.expression.trim()
          ? command.expression.trim()
          : params.currentEmotion;
    update = {
      ...(update ?? {}),
      lastAction: "speak",
      ...(emotion
        ? {
            lastEmotion: emotion,
            lastExpression: expressionForAsset(emotion, assetType),
            lastMotion: motionForAsset(emotion, assetType),
            lastMotionIndex:
              typeof command.motionIndex === "number" && Number.isFinite(command.motionIndex)
                ? command.motionIndex
                : 0,
          }
        : {}),
      lastUpdatedAt: now,
      lastSpeechAt: now,
    };
  }
  return update;
}
