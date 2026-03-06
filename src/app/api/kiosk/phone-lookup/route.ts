import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone/normalize";

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    const normalized = normalizePhone(phone);
    if (!normalized) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: member } = await supabase
      .from("members")
      .select("id, name, avatar_emoji")
      .eq("phone_normalized", normalized)
      .eq("is_active", true)
      .single();

    if (!member) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      name: member.name,
      avatar_emoji: member.avatar_emoji,
      member_id: member.id,
    });
  } catch (error) {
    console.error("Phone lookup error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
