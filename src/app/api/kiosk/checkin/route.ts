import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { performCheckIn } from "@/lib/checkin/perform-checkin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { member_id } = body;

    if (!member_id || typeof member_id !== "string") {
      return NextResponse.json(
        { success: false, error: "member_id is required" },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(member_id)) {
      return NextResponse.json(
        { success: false, error: "Invalid member_id format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify member exists and is active
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, name, email, current_streak, longest_streak, last_check_in, avatar_emoji, total_check_ins, is_active")
      .eq("id", member_id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    if (member.is_active === false) {
      return NextResponse.json(
        { success: false, error: "Member is inactive" },
        { status: 403 }
      );
    }

    const result = await performCheckIn({
      supabase,
      member,
      visitorName: member.name,
      visitorEmail: member.email,
      location: "kiosk",
      checkInMethod: "kiosk_directory",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Kiosk check-in error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
