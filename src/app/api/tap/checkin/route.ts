import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateDeviceToken } from "@/lib/auth/tokens";

// Calculate streak based on last check-in date
function calculateStreak(lastCheckIn: string | null, currentStreak: number | null): { newStreak: number; isNewDay: boolean } {
  if (!lastCheckIn) {
    return { newStreak: 1, isNewDay: true };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDate = new Date(lastCheckIn);
  lastDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day - no streak change
    return { newStreak: currentStreak || 1, isNewDay: false };
  } else if (diffDays === 1) {
    // Consecutive day - increment streak
    return { newStreak: (currentStreak || 0) + 1, isNewDay: true };
  } else {
    // Gap in days - reset streak
    return { newStreak: 1, isNewDay: true };
  }
}

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

    // Get location from query params or body
    const url = new URL(request.url);
    const location = url.searchParams.get("loc") || "unknown";

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
      .select("id, current_streak, longest_streak, last_check_in")
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
        })
        .select("id, current_streak, longest_streak, last_check_in")
        .single();
      member = newMember;
    }

    // Check for recent check-in within 2 hours (overtap detection)
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const twoHoursAgo = new Date(Date.now() - TWO_HOURS_MS).toISOString();

    let isOvertap = false;
    if (member?.id) {
      const { data: recentCheckIn } = await supabase
        .from("check_ins")
        .select("id")
        .eq("member_id", member.id)
        .gte("check_in_time", twoHoursAgo)
        .eq("is_overtap", false)
        .limit(1)
        .single();

      isOvertap = !!recentCheckIn;
    }

    // Calculate new streak
    const { newStreak, isNewDay } = calculateStreak(
      member?.last_check_in ?? null,
      member?.current_streak ?? null
    );

    // Update member streak if it's a new day AND not an overtap
    if (member && isNewDay && !isOvertap) {
      const newLongest = Math.max(newStreak, member.longest_streak || 0);
      await supabase
        .from("members")
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_check_in: new Date().toISOString().split("T")[0],
        })
        .eq("id", member.id);
    }

    // Create check-in record (always created, but marked as overtap if within 2 hours)
    const { data: checkIn, error: checkInError } = await supabase
      .from("check_ins")
      .insert({
        check_in_time: new Date().toISOString(),
        check_in_method: "nfc_token",
        location,
        visitor_name: visitorName,
        member_id: member?.id,
        status: "checked_in",
        is_overtap: isOvertap,
      })
      .select("id")
      .single();

    if (checkInError) {
      console.error("Failed to create check-in:", checkInError);
      return NextResponse.json(
        { success: false, error: "Failed to create check-in" },
        { status: 500 }
      );
    }

    // Get current month's check-in count for community goal (excluding overtaps)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: monthlyCount } = await supabase
      .from("check_ins")
      .select("id", { count: "exact" })
      .gte("check_in_time", startOfMonth.toISOString())
      .eq("is_overtap", false);

    // Update community goal count
    await supabase
      .from("community_goals")
      .update({ current_count: monthlyCount || 0 })
      .eq("is_active", true)
      .eq("goal_type", "monthly_checkins");

    return NextResponse.json({
      success: true,
      check_in_id: checkIn.id,
      visitor_name: visitorName,
      visitor_email: visitorEmail,
      location,
      streak: isOvertap ? (member?.current_streak ?? 1) : newStreak,
      monthly_count: monthlyCount || 0,
      is_overtap: isOvertap,
      message: `Welcome back, ${visitorName}!`,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
