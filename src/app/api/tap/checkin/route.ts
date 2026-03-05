import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateDeviceToken } from "@/lib/auth/tokens";
import { performCheckIn } from "@/lib/checkin/perform-checkin";

export async function POST(request: NextRequest) {
  try {
    // Get the token from header or body
    const token =
      request.headers.get("X-Visitor-Token") ||
      (await request.json().catch(() => ({}))).token;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "No token provided" },
        { status: 400 }
      );
    }

    // Get location and optional activity from query params
    const url = new URL(request.url);
    const location = url.searchParams.get("loc") || "unknown";
    const activitySlug = url.searchParams.get("activity") || null;

    // Validate the token
    const validation = await validateDeviceToken(token);

    if (!validation.success || !validation.visitorEmail || !validation.visitorName) {
      return NextResponse.json(
        { success: false, error: validation.error || "Invalid token", requiresAuth: true },
        { status: 401 }
      );
    }

    const visitorEmail = validation.visitorEmail;
    const visitorName = validation.visitorName;

    const supabase = await createClient();

    // Get or create member record for streak tracking
    let member = null;
    const { data: existingMember } = await supabase
      .from("members")
      .select("id, current_streak, longest_streak, last_check_in, avatar_emoji, total_check_ins")
      .eq("email", visitorEmail)
      .single();

    if (existingMember) {
      member = existingMember;
    } else {
      // Create member if doesn't exist
      const { data: newMember } = await supabase
        .from("members")
        .insert({
          email: visitorEmail,
          name: visitorName,
          current_streak: 1,
          longest_streak: 1,
          last_check_in: new Date().toISOString().split("T")[0],
          total_check_ins: 0,
        })
        .select("id, current_streak, longest_streak, last_check_in, avatar_emoji, total_check_ins")
        .single();
      member = newMember;
    }

    // Validate activity if provided
    let activity: { id: string; name: string; slug: string; location_id: string } | null = null;
    if (activitySlug) {
      const { data: activityData } = await supabase
        .from("activities")
        .select("id, name, slug, location_id")
        .eq("slug", activitySlug)
        .eq("is_active", true)
        .single();

      if (!activityData) {
        return NextResponse.json(
          { success: false, error: "Activity not found or inactive" },
          { status: 404 }
        );
      }
      activity = activityData;
    }

    if (!member) {
      return NextResponse.json(
        { success: false, error: "Failed to create or find member" },
        { status: 500 }
      );
    }

    const result = await performCheckIn({
      supabase,
      member,
      visitorName,
      visitorEmail,
      location,
      checkInMethod: "nfc_token",
      activityId: activity?.id,
      activityName: activity?.name,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
