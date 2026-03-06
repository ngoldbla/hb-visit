import bcrypt from "bcryptjs";
import { SupabaseClient } from "@supabase/supabase-js";

const SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 5;

/**
 * Hash a 4-digit PIN using bcrypt.
 */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

/**
 * Verify a PIN against its bcrypt hash.
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

/**
 * Check if a member's PIN is currently locked out due to too many failed attempts.
 */
export function isPinLocked(member: {
  pin_locked_until: string | null;
}): boolean {
  if (!member.pin_locked_until) return false;
  return new Date(member.pin_locked_until) > new Date();
}

/**
 * Get remaining lockout time in seconds. Returns 0 if not locked.
 */
export function getLockoutRemaining(member: {
  pin_locked_until: string | null;
}): number {
  if (!member.pin_locked_until) return 0;
  const remaining = new Date(member.pin_locked_until).getTime() - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

/**
 * Record a failed PIN attempt. Sets lockout after MAX_FAILED_ATTEMPTS.
 */
export async function recordFailedAttempt(
  supabase: SupabaseClient,
  memberId: string,
  currentAttempts: number
): Promise<{ locked: boolean; attemptsRemaining: number }> {
  const newAttempts = currentAttempts + 1;

  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockUntil = new Date(
      Date.now() + LOCKOUT_MINUTES * 60 * 1000
    ).toISOString();

    await supabase
      .from("members")
      .update({
        pin_failed_attempts: newAttempts,
        pin_locked_until: lockUntil,
      })
      .eq("id", memberId);

    return { locked: true, attemptsRemaining: 0 };
  }

  await supabase
    .from("members")
    .update({ pin_failed_attempts: newAttempts })
    .eq("id", memberId);

  return {
    locked: false,
    attemptsRemaining: MAX_FAILED_ATTEMPTS - newAttempts,
  };
}

/**
 * Reset failed attempts on successful PIN entry.
 */
export async function resetFailedAttempts(
  supabase: SupabaseClient,
  memberId: string
): Promise<void> {
  await supabase
    .from("members")
    .update({
      pin_failed_attempts: 0,
      pin_locked_until: null,
    })
    .eq("id", memberId);
}
