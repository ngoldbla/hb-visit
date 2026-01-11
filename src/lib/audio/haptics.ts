/**
 * Haptic feedback utilities for mobile devices
 *
 * Uses navigator.vibrate() on Android
 * Falls back to low-frequency audio pulse on iOS (which doesn't support vibration API)
 */

import { getAudioContext, isAudioReady } from "./audio-context";

/**
 * Play a low-frequency audio pulse that creates a haptic-like sensation
 * Used as fallback on iOS which doesn't support navigator.vibrate()
 */
function playHapticPulse(): void {
  if (!isAudioReady()) return;
  const ctx = getAudioContext();

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(80, ctx.currentTime); // Low rumble frequency

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

/**
 * Trigger strong success haptic pattern (Apple Pay style)
 * Pattern: strong-pause-strong
 */
export function triggerHapticSuccess(): void {
  // Try native vibration first (Android, some Windows)
  if ("vibrate" in navigator) {
    // Apple Pay style pattern: initial pulse, short pause, confirmation pulse
    navigator.vibrate([50, 50, 100]);
    return;
  }

  // iOS fallback: audio pulse
  playHapticPulse();
}

/**
 * Trigger a light haptic tap
 */
export function triggerHapticTap(): void {
  if ("vibrate" in navigator) {
    navigator.vibrate(30);
    return;
  }

  // Lighter audio pulse for iOS
  if (!isAudioReady()) return;
  const ctx = getAudioContext();

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(100, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
}
