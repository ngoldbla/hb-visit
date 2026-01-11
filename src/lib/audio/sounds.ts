/**
 * R2-D2 style sound synthesizers using Web Audio API
 *
 * These create the characteristic chirps and beeps through:
 * - Frequency sweeps (glissando)
 * - FM modulation for character
 * - Envelope shaping
 */

import { getAudioContext, isAudioReady } from "./audio-context";

interface ChirpParams {
  startFreq: number;
  endFreq: number;
  duration: number;
  delay?: number;
  gain?: number;
}

/**
 * Play a single R2-D2 style chirp with frequency sweep
 */
function playChirp(ctx: AudioContext, params: ChirpParams): void {
  const { startFreq, endFreq, duration, delay = 0, gain = 0.3 } = params;
  const now = ctx.currentTime + delay;

  // Main oscillator with frequency sweep
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

  // FM modulator for R2-D2 character
  const modulator = ctx.createOscillator();
  const modGain = ctx.createGain();
  modulator.frequency.setValueAtTime(50 + Math.random() * 50, now);
  modGain.gain.setValueAtTime(30, now);
  modulator.connect(modGain);
  modGain.connect(osc.frequency);

  // Amplitude envelope
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime(gain, now + 0.01);
  envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

  // Connect and schedule
  osc.connect(envelope);
  envelope.connect(ctx.destination);

  modulator.start(now);
  osc.start(now);
  osc.stop(now + duration);
  modulator.stop(now + duration);
}

/**
 * Play a happy beep sequence for standard check-ins
 * Ascending chirps that sound welcoming
 */
export function playHappyBeep(): void {
  if (!isAudioReady()) return;
  const ctx = getAudioContext();

  // Happy ascending sequence
  playChirp(ctx, { startFreq: 600, endFreq: 900, duration: 0.1, delay: 0 });
  playChirp(ctx, { startFreq: 800, endFreq: 1200, duration: 0.1, delay: 0.12 });
  playChirp(ctx, { startFreq: 1000, endFreq: 1400, duration: 0.15, delay: 0.24 });
}

/**
 * Play an excited chirp sequence for streak check-ins
 * More chirps for longer streaks
 */
export function playStreakChirp(streak: number): void {
  if (!isAudioReady()) return;
  const ctx = getAudioContext();

  // More chirps for longer streaks (3-6 chirps)
  const chirpCount = Math.min(streak + 2, 6);

  for (let i = 0; i < chirpCount; i++) {
    const baseFreq = 700 + i * 150;
    playChirp(ctx, {
      startFreq: baseFreq,
      endFreq: baseFreq + 400 + i * 50,
      duration: 0.08 + Math.random() * 0.04,
      delay: i * 0.1,
      gain: 0.25,
    });
  }
}

/**
 * Play a celebratory sequence for milestone check-ins
 * Fanfare-like ascending pattern
 */
export function playMilestoneSequence(): void {
  if (!isAudioReady()) return;
  const ctx = getAudioContext();

  // Celebratory fanfare pattern
  const notes = [800, 1000, 1200, 1000, 1200, 1600];

  notes.forEach((freq, i) => {
    playChirp(ctx, {
      startFreq: freq * 0.8,
      endFreq: freq * 1.2,
      duration: 0.12,
      delay: i * 0.15,
      gain: 0.3,
    });
  });
}

/**
 * Play a softer, shorter chime for mobile check-ins
 */
export function playMobileChime(): void {
  if (!isAudioReady()) return;
  const ctx = getAudioContext();

  // Shorter, gentler beeps for mobile
  playChirp(ctx, { startFreq: 800, endFreq: 1100, duration: 0.08, gain: 0.2 });
  playChirp(ctx, { startFreq: 1000, endFreq: 1300, duration: 0.1, delay: 0.1, gain: 0.15 });
}

/**
 * Play a farewell sequence for check-outs
 * Descending, winding-down chirps that sound like "bye bye"
 */
export function playFarewellChirp(): void {
  if (!isAudioReady()) return;
  const ctx = getAudioContext();

  // Descending "bye bye" pattern - opposite of happy beep
  playChirp(ctx, { startFreq: 1200, endFreq: 800, duration: 0.12, delay: 0 });
  playChirp(ctx, { startFreq: 1000, endFreq: 600, duration: 0.15, delay: 0.15 });
  playChirp(ctx, { startFreq: 800, endFreq: 500, duration: 0.2, delay: 0.32, gain: 0.25 });
}

/**
 * Play a softer farewell chime for mobile check-outs
 */
export function playMobileFarewell(): void {
  if (!isAudioReady()) return;
  const ctx = getAudioContext();

  // Shorter, gentler descending beeps for mobile checkout
  playChirp(ctx, { startFreq: 1000, endFreq: 700, duration: 0.1, gain: 0.2 });
  playChirp(ctx, { startFreq: 800, endFreq: 500, duration: 0.12, delay: 0.12, gain: 0.15 });
}
