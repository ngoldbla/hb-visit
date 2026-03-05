import { SupabaseClient } from "@supabase/supabase-js";
import { calculateNicknameFromTimestamps } from "@/lib/nicknames";
import { buildBadgeContext, evaluateAndAwardBadges, EarnedBadge } from "@/lib/badges";

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
    return { newStreak: currentStreak || 1, isNewDay: false };
  } else if (diffDays === 1) {
    return { newStreak: (currentStreak || 0) + 1, isNewDay: true };
  } else {
    return { newStreak: 1, isNewDay: true };
  }
}

export interface PerformCheckInParams {
  supabase: SupabaseClient;
  member: {
    id: string;
    current_streak: number | null;
    longest_streak: number | null;
    last_check_in: string | null;
    avatar_emoji: string | null;
    total_check_ins: number | null;
  };
  visitorName: string;
  visitorEmail: string;
  location: string;
  checkInMethod: string;
  activityId?: string | null;
  activityName?: string | null;
}

export interface PerformCheckInResult {
  success: true;
  action: "checkin";
  check_in_id: string;
  visitor_name: string;
  visitor_email: string;
  avatar_emoji: string;
  location: string;
  streak: number;
  arrival_position: number;
  monthly_count: number;
  is_overtap: boolean;
  new_badges: EarnedBadge[];
  activity_name: string | null;
  message: string;
}

export async function performCheckIn(params: PerformCheckInParams): Promise<PerformCheckInResult> {
  const { supabase, member, visitorName, visitorEmail, location, checkInMethod, activityId, activityName } = params;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Overtap detection
  let isOvertap = false;
  if (activityId) {
    // Activity overtap: same activity within 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const { data: recentActivityCheckIn } = await supabase
      .from("check_ins")
      .select("id")
      .eq("member_id", member.id)
      .eq("activity_id", activityId)
      .gte("check_in_time", twoHoursAgo.toISOString())
      .eq("is_overtap", false)
      .limit(1)
      .single();

    isOvertap = !!recentActivityCheckIn;
  } else {
    // Regular overtap: any non-activity check-in today
    const { data: recentCheckIn } = await supabase
      .from("check_ins")
      .select("id")
      .eq("member_id", member.id)
      .is("activity_id", null)
      .gte("check_in_time", todayStart.toISOString())
      .eq("is_overtap", false)
      .limit(1)
      .single();

    isOvertap = !!recentCheckIn;
  }

  // Calculate new streak
  const { newStreak, isNewDay } = calculateStreak(
    member.last_check_in,
    member.current_streak
  );

  // Get today's check-in count for arrival position
  const { count: todayCount } = await supabase
    .from("check_ins")
    .select("id", { count: "exact" })
    .gte("check_in_time", todayStart.toISOString())
    .eq("is_overtap", false);

  const arrivalPosition = (todayCount || 0) + 1;

  // Track newly earned badges
  let newBadges: EarnedBadge[] = [];

  // Update member streak, total check-ins, and nickname if it's a new day AND not an overtap
  if (isNewDay && !isOvertap) {
    const newLongest = Math.max(newStreak, member.longest_streak || 0);
    const newTotalCheckIns = (member.total_check_ins || 0) + 1;

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
        total_check_ins: newTotalCheckIns,
        personality_nickname: nicknameResult.nickname,
      })
      .eq("id", member.id);

    // Evaluate and award badges
    const badgeContext = await buildBadgeContext(
      supabase,
      member.id,
      newStreak,
      newTotalCheckIns
    );
    newBadges = await evaluateAndAwardBadges(supabase, member.id, badgeContext);
  }

  // Create check-in record
  const { data: checkIn, error: checkInError } = await supabase
    .from("check_ins")
    .insert({
      check_in_time: new Date().toISOString(),
      check_in_method: checkInMethod,
      location,
      visitor_name: visitorName,
      member_id: member.id,
      status: "checked_in",
      arrival_position: arrivalPosition,
      is_overtap: isOvertap,
      activity_id: activityId || null,
    })
    .select("id")
    .single();

  if (checkInError) {
    throw new Error("Failed to create check-in");
  }

  // Update community goal count
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: monthlyCount } = await supabase
    .from("check_ins")
    .select("id", { count: "exact" })
    .gte("check_in_time", startOfMonth.toISOString())
    .eq("is_overtap", false);

  await supabase
    .from("community_goals")
    .update({ current_count: monthlyCount || 0 })
    .eq("is_active", true)
    .eq("goal_type", "monthly_checkins");

  return {
    success: true,
    action: "checkin",
    check_in_id: checkIn.id,
    visitor_name: visitorName,
    visitor_email: visitorEmail,
    avatar_emoji: member.avatar_emoji || "😊",
    location,
    streak: isOvertap ? (member.current_streak ?? 1) : newStreak,
    arrival_position: arrivalPosition,
    monthly_count: monthlyCount || 0,
    is_overtap: isOvertap,
    new_badges: newBadges,
    activity_name: activityName || null,
    message: activityName
      ? `Checked in for ${activityName}`
      : `Welcome back, ${visitorName}!`,
  };
}
