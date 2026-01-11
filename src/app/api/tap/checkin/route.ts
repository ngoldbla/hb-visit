import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateDeviceToken } from "@/lib/auth/tokens";
import { calculateNicknameFromTimestamps } from "@/lib/nicknames";

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

// Get duration title based on minutes
function getDurationTitle(minutes: number): { title: string; message: string } {
  if (minutes < 30) {
    return { title: "Quick Pit Stop", message: "Speed demon! In and out." };
  } else if (minutes < 120) {
    return { title: "Focused Session", message: "Quality time. Nice." };
  } else if (minutes < 240) {
    return { title: "Solid Shift", message: "Productive day!" };
  } else if (minutes < 480) {
    return { title: "Full Day Hero", message: "Marathon effort!" };
  } else {
    return { title: "All-Nighter", message: "Legendary dedication!" };
  }
}

// Peace out messages
const PEACE_OUT_MESSAGES = [
  "Peace out, {name}! See you tomorrow!",
  "Later, {name}! Great hustle today.",
  "Catch you on the flip side, {name}!",
  "Until next time, {name}! Keep building.",
  "{name} has left the building!",
  "Mic drop. {name} out.",
  "Deuces, {name}!",
  "{name} is outta here!",
];

function getRandomPeaceOutMessage(name: string): string {
  const message = PEACE_OUT_MESSAGES[Math.floor(Math.random() * PEACE_OUT_MESSAGES.length)];
  return message.replace("{name}", name);
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

    // Check if user is already checked in today (for check-out functionality)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let activeCheckIn = null;
    if (member?.id) {
      const { data } = await supabase
        .from("check_ins")
        .select("id, check_in_time")
        .eq("member_id", member.id)
        .eq("status", "checked_in")
        .gte("check_in_time", todayStart.toISOString())
        .order("check_in_time", { ascending: false })
        .limit(1)
        .single();
      activeCheckIn = data;
    }

    // If already checked in, perform check-out
    if (activeCheckIn) {
      const checkInTime = new Date(activeCheckIn.check_in_time);
      const checkOutTime = new Date();
      const durationMinutes = Math.round((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));

      // Update the check-in record to checked out
      await supabase
        .from("check_ins")
        .update({
          check_out_time: checkOutTime.toISOString(),
          check_out_method: "nfc_token",
          status: "checked_out",
          duration_minutes: durationMinutes,
        })
        .eq("id", activeCheckIn.id);

      const durationInfo = getDurationTitle(durationMinutes);
      const peaceOutMessage = getRandomPeaceOutMessage(visitorName);

      return NextResponse.json({
        success: true,
        action: "checkout",
        check_in_id: activeCheckIn.id,
        visitor_name: visitorName,
        visitor_email: visitorEmail,
        avatar_emoji: member?.avatar_emoji || "😊",
        location,
        duration_minutes: durationMinutes,
        duration_title: durationInfo.title,
        duration_message: durationInfo.message,
        message: peaceOutMessage,
      });
    }

    // Calculate new streak for check-in
    const { newStreak, isNewDay } = calculateStreak(
      member?.last_check_in ?? null,
      member?.current_streak ?? null
    );

    // Get today's check-in count for arrival position
    const { count: todayCount } = await supabase
      .from("check_ins")
      .select("id", { count: "exact" })
      .gte("check_in_time", todayStart.toISOString());

    const arrivalPosition = (todayCount || 0) + 1;

    // Update member streak, total check-ins, and nickname if it's a new day
    if (member && isNewDay) {
      const newLongest = Math.max(newStreak, member.longest_streak || 0);

      // Calculate personality nickname from last 30 days of check-ins
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentCheckIns } = await supabase
        .from("check_ins")
        .select("check_in_time")
        .eq("member_id", member.id)
        .gte("check_in_time", thirtyDaysAgo.toISOString())
        .order("check_in_time", { ascending: false });

      const checkInTimestamps = (recentCheckIns || []).map(
        (c) => c.check_in_time
      );
      const nicknameResult = calculateNicknameFromTimestamps(checkInTimestamps);

      await supabase
        .from("members")
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_check_in: new Date().toISOString().split("T")[0],
          total_check_ins: (member.total_check_ins || 0) + 1,
          personality_nickname: nicknameResult.nickname,
        })
        .eq("id", member.id);
    }

    // Create check-in record
    const { data: checkIn, error: checkInError } = await supabase
      .from("check_ins")
      .insert({
        check_in_time: new Date().toISOString(),
        check_in_method: "nfc_token",
        location,
        visitor_name: visitorName,
        member_id: member?.id,
        status: "checked_in",
        arrival_position: arrivalPosition,
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

    // Get current month's check-in count for community goal
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: monthlyCount } = await supabase
      .from("check_ins")
      .select("id", { count: "exact" })
      .gte("check_in_time", startOfMonth.toISOString());

    // Update community goal count
    await supabase
      .from("community_goals")
      .update({ current_count: monthlyCount || 0 })
      .eq("is_active", true)
      .eq("goal_type", "monthly_checkins");

    return NextResponse.json({
      success: true,
      action: "checkin",
      check_in_id: checkIn.id,
      visitor_name: visitorName,
      visitor_email: visitorEmail,
      avatar_emoji: member?.avatar_emoji || "😊",
      location,
      streak: newStreak,
      arrival_position: arrivalPosition,
      monthly_count: monthlyCount || 0,
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
