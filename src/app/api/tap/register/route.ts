import { NextRequest, NextResponse } from "next/server";
import { createDeviceToken } from "@/lib/auth/tokens";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, company, avatarEmoji } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();

    // Get user agent for device tracking
    const userAgent = request.headers.get("user-agent") || undefined;

    // Create device token
    const result = await createDeviceToken(
      normalizedEmail,
      trimmedName,
      userAgent
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Create or update member record with avatar and profile info
    const supabase = await createClient();

    const { data: existingMember } = await supabase
      .from("members")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (existingMember) {
      // Update existing member with new info
      await supabase
        .from("members")
        .update({
          name: trimmedName,
          phone: phone || null,
          company: company || null,
          avatar_emoji: avatarEmoji || "😊",
        })
        .eq("id", existingMember.id);
    } else {
      // Create new member
      await supabase
        .from("members")
        .insert({
          email: normalizedEmail,
          name: trimmedName,
          phone: phone || null,
          company: company || null,
          avatar_emoji: avatarEmoji || "😊",
          current_streak: 0,
          longest_streak: 0,
          total_check_ins: 0,
        });
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      message: `Welcome, ${trimmedName}!`,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
