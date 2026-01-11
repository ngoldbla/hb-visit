/**
 * AudioContext singleton management with browser autoplay policy handling
 */

let audioContext: AudioContext | null = null;
let isUnlocked = false;

/**
 * Get or create the AudioContext singleton
 * Throws if called on the server
 */
export function getAudioContext(): AudioContext {
  if (typeof window === "undefined") {
    throw new Error("AudioContext is only available in the browser");
  }
  if (!audioContext) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioContextClass();
  }
  return audioContext;
}

/**
 * Unlock audio playback - must be called from a user gesture
 * Returns immediately if already unlocked
 */
export async function unlockAudio(): Promise<void> {
  if (isUnlocked) return;

  const ctx = getAudioContext();

  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  // Play a silent buffer to fully unlock on iOS Safari
  const buffer = ctx.createBuffer(1, 1, 22050);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);

  isUnlocked = true;
}

/**
 * Check if audio is ready to play
 */
export function isAudioUnlocked(): boolean {
  return isUnlocked && audioContext?.state === "running";
}

/**
 * Check if audio context exists and is running
 */
export function isAudioReady(): boolean {
  return audioContext?.state === "running";
}
