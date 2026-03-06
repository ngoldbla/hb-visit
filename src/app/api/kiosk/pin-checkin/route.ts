import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone/normalize";
import {
  verifyPin,
  isPinLocked,
  getLockoutRemaining,
  recordFailedAttempt,
  resetFailedAttempts,
} from "@/lib/auth/pin";
import { performCheckIn } from "@/lib/checkin/perform-checkin";

export async function POST(request: NextRequest) {
  try {
    const { phone, pin } = await request.json();

    if (!phone || !pin) {
      return NextResponse.json(
        { success: false, error: "Phone and PIN are required" },
        { status: 400 }
      );
    }

    if (typeof pin !== "string" || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: "PIN must be 4 digits" },
        { status: 400 }
      );
    }

    const normalized = normalizePhone(phone);
    if (!normalized) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number", code: "invalid_phone" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: member } = await supabase
      .from("members")
      .select(
        "id, name, email, avatar_emoji, pin_hash, pin_failed_attempts, pin_locked_until, current_streak, longest_streak, last_check_in, total_check_ins, is_active"
      )
      .eq("phone_normalized", normalized)
      .eq("is_active", true)
      .single();

    if (!member) {
      return NextResponse.json(
        { success: false, error: "Phone not found", code: "not_found" },
        { status: 404 }
      );
    }

    if (!member.pin_hash) {
      return NextResponse.json(
        { success: false, error: "No PIN set for this account", code: "no_pin" },
        { status: 400 }
      );
    }

    // Check lockout
    if (isPinLocked(member)) {
      const remaining = getLockoutRemaining(member);
      return NextResponse.json(
        {
          success: false,
          error: "Too many attempts. Try again later.",
          code: "locked",
          lockout_remaining: remaining,
        },
        { status: 429 }
      );
    }

    // Verify PIN
    const pinValid = await verifyPin(pin, member.pin_hash);

    if (!pinValid) {
      const { locked, attemptsRemaining } = await recordFailedAttempt(
        supabase,
        member.id,
        member.pin_failed_attempts || 0
      );

      if (locked) {
        return NextResponse.json(
          {
            success: false,
            error: "Too many attempts. Try again in 5 minutes.",
            code: "locked",
            lockout_remaining: 300,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Incorrect PIN",
          code: "wrong_pin",
          attempts_remaining: attemptsRemaining,
        },
        { status: 401 }
      );
    }

    // PIN correct - reset failed attempts
    await resetFailedAttempts(supabase, member.id);

    // Perform check-in
    const result = await performCheckIn({
      supabase,
      member,
      visitorName: member.name,
      visitorEmail: member.email,
      location: "kiosk",
      checkInMethod: "kiosk_pin",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("PIN check-in error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
