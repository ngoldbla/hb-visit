import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone/normalize";
import { hashPin } from "@/lib/auth/pin";
import { validateName } from "@/lib/validation/name-moderation";
import { performCheckIn } from "@/lib/checkin/perform-checkin";

export async function POST(request: NextRequest) {
  try {
    const { name, phone, pin, avatar_emoji } = await request.json();

    // Validate required fields
    if (!name || !phone || !pin) {
      return NextResponse.json(
        { success: false, error: "Name, phone, and PIN are required" },
        { status: 400 }
      );
    }

    // Validate name
    const trimmedName = name.trim();
    const nameValidation = validateName(trimmedName);
    if (!nameValidation.isValid) {
      return NextResponse.json(
        { success: false, error: nameValidation.userMessage, code: "invalid_name" },
        { status: 400 }
      );
    }

    // Validate PIN format
    if (typeof pin !== "string" || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: "PIN must be 4 digits", code: "invalid_pin" },
        { status: 400 }
      );
    }

    // Normalize phone
    const normalized = normalizePhone(phone);
    if (!normalized) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number", code: "invalid_phone" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if phone already registered
    const { data: existing } = await supabase
      .from("members")
      .select("id")
      .eq("phone_normalized", normalized)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "This phone number is already registered. Try checking in with your PIN.",
          code: "phone_exists",
        },
        { status: 409 }
      );
    }

    // Hash PIN
    const pinHash = await hashPin(pin);

    // Create member with placeholder email
    const placeholderEmail = `phone_${normalized}@kiosk.local`;
    const emoji = avatar_emoji || "😊";

    const { data: newMember, error: insertError } = await supabase
      .from("members")
      .insert({
        email: placeholderEmail,
        name: trimmedName,
        phone_normalized: normalized,
        pin_hash: pinHash,
        pin_set_at: new Date().toISOString(),
        avatar_emoji: emoji,
        current_streak: 0,
        longest_streak: 0,
        total_check_ins: 0,
      })
      .select("id, current_streak, longest_streak, last_check_in, avatar_emoji, total_check_ins")
      .single();

    if (insertError || !newMember) {
      console.error("Member creation error:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to create account" },
        { status: 500 }
      );
    }

    // Immediately check in
    const result = await performCheckIn({
      supabase,
      member: newMember,
      visitorName: trimmedName,
      visitorEmail: placeholderEmail,
      location: "kiosk",
      checkInMethod: "kiosk_pin",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Kiosk registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
