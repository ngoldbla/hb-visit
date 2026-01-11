import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateDeviceToken } from "@/lib/auth/tokens";
import { getEarnedBadges, BADGES, BadgeDefinition } from "@/lib/badges";

export interface StatsResponse {
  success: boolean;
  error?: string;
  stats?: {
    member: {
      name: string;
      email: string;
      avatarEmoji: string;
      personalityNickname: string | null;
      currentStreak: number;
      longestStreak: number;
      totalCheckIns: number;
      totalHours: number;
      memberSince: string;
    };
    weeklyActivity: boolean[]; // M-Su, true if checked in
    monthlyHeatmap: { date: string; count: number }[];
    earnedBadges: Array<{
      id: string;
      name: string;
      emoji: string;
      description: string;
      earnedAt: string;
    }>;
    allBadges: Array<{
      id: string;
      name: string;
      emoji: string;
      description: string;
      earned: boolean;
      earnedAt?: string;
    }>;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Get token from header
    const token = request.headers.get("X-Visitor-Token");

    if (!token) {
      return NextResponse.json<StatsResponse>(
        { success: false, error: "No token provided" },
        { status: 400 }
      );
    }

    // Validate token
    const validation = await validateDeviceToken(token);

    if (!validation.success || !validation.visitorEmail) {
      return NextResponse.json<StatsResponse>(
        { success: false, error: validation.error || "Invalid token" },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Get member data
    const { data: member } = await supabase
      .from("members")
      .select(
        "id, name, email, avatar_emoji, personality_nickname, current_streak, longest_streak, total_check_ins, created_at"
      )
      .eq("email", validation.visitorEmail)
      .single();

    if (!member) {
      return NextResponse.json<StatsResponse>(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    // Get check-ins for the current month (for heatmap)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data: monthlyCheckIns } = await supabase
      .from("check_ins")
      .select("check_in_time, duration_minutes")
      .eq("member_id", member.id)
      .eq("is_overtap", false)
      .gte("check_in_time", startOfMonth.toISOString())
      .lte("check_in_time", endOfMonth.toISOString())
      .order("check_in_time", { ascending: true });

    // Build monthly heatmap
    const heatmapMap = new Map<string, number>();
    let totalMinutes = 0;

    if (monthlyCheckIns) {
      for (const checkIn of monthlyCheckIns) {
        const date = checkIn.check_in_time.split("T")[0];
        heatmapMap.set(date, (heatmapMap.get(date) || 0) + 1);
        if (checkIn.duration_minutes) {
          totalMinutes += checkIn.duration_minutes;
        }
      }
    }

    // Create heatmap array for all days in month
    const monthlyHeatmap: { date: string; count: number }[] = [];
    for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      monthlyHeatmap.push({
        date: dateStr,
        count: heatmapMap.get(dateStr) || 0,
      });
    }

    // Get weekly activity (current week, M-Su)
    const weekStart = new Date(now);
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday is start
    weekStart.setDate(weekStart.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);

    const weeklyActivity: boolean[] = [];
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(weekStart);
      checkDate.setDate(weekStart.getDate() + i);
      const dateStr = checkDate.toISOString().split("T")[0];
      weeklyActivity.push(heatmapMap.get(dateStr) !== undefined && heatmapMap.get(dateStr)! > 0);
    }

    // Get earned badges
    const earnedBadges = await getEarnedBadges(supabase, member.id);

    // Create all badges list with earned status
    const earnedBadgeIds = new Set(earnedBadges.map((b) => b.id));
    const allBadges = BADGES.map((badge: BadgeDefinition) => {
      const earned = earnedBadges.find((eb) => eb.id === badge.id);
      return {
        id: badge.id,
        name: badge.name,
        emoji: badge.emoji,
        description: badge.description,
        earned: earnedBadgeIds.has(badge.id),
        earnedAt: earned?.earnedAt,
      };
    });

    // Calculate total hours
    const totalHours = Math.round(totalMinutes / 60);

    return NextResponse.json<StatsResponse>({
      success: true,
      stats: {
        member: {
          name: member.name,
          email: member.email,
          avatarEmoji: member.avatar_emoji || "😊",
          personalityNickname: member.personality_nickname,
          currentStreak: member.current_streak || 0,
          longestStreak: member.longest_streak || 0,
          totalCheckIns: member.total_check_ins || 0,
          totalHours,
          memberSince: member.created_at || new Date().toISOString(),
        },
        weeklyActivity,
        monthlyHeatmap,
        earnedBadges: earnedBadges.map((b) => ({
          id: b.id,
          name: b.name,
          emoji: b.emoji,
          description: b.description,
          earnedAt: b.earnedAt,
        })),
        allBadges,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json<StatsResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
