/**
 * Audio module exports
 */

export { getAudioContext, unlockAudio, isAudioUnlocked, isAudioReady } from "./audio-context";
export { playHappyBeep, playStreakChirp, playMilestoneSequence, playMobileChime } from "./sounds";
export { triggerHapticSuccess, triggerHapticTap } from "./haptics";
