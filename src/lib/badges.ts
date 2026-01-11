import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./supabase/types";

export type BadgeType = "milestone" | "streak" | "time";

export interface BadgeDefinition {
  id: string;
  name: string;
  type: BadgeType;
  emoji: string;
  description: string;
}

export interface BadgeContext {
  currentStreak: number;
  totalCheckIns: number;
  checkInHours: number[]; // Hours (0-23) of check-ins in last 30 days
  weekendCheckInPercentage: number; // 0-100
}

export interface EarnedBadge extends BadgeDefinition {
  earnedAt: string;
}

// Badge definitions
export const BADGES: BadgeDefinition[] = [
  // Milestone badges
  {
    id: "first_steps",
    name: "First Steps",
    type: "milestone",
    emoji: "🌱",
    description: "Complete your first check-in",
  },
  {
    id: "regular",
    name: "Regular",
    type: "milestone",
    emoji: "📅",
    description: "Complete 10 check-ins",
  },
  {
    id: "committed",
    name: "Committed",
    type: "milestone",
    emoji: "💪",
    description: "Complete 50 check-ins",
  },
  {
    id: "dedicated",
    name: "Dedicated",
    type: "milestone",
    emoji: "🏆",
    description: "Complete 100 check-ins",
  },
  // Streak badges
  {
    id: "spark",
    name: "Spark",
    type: "streak",
    emoji: "✨",
    description: "Achieve a 3-day streak",
  },
  {
    id: "flame",
    name: "Flame",
    type: "streak",
    emoji: "🔥",
    description: "Achieve a 7-day streak",
  },
  {
    id: "bonfire",
    name: "Bonfire",
    type: "streak",
    emoji: "🔥🔥",
    description: "Achieve a 14-day streak",
  },
  {
    id: "inferno",
    name: "Inferno",
    type: "streak",
    emoji: "🌋",
    description: "Achieve a 30-day streak",
  },
  // Time-based badges
  {
    id: "early_bird",
    name: "Early Bird",
    type: "time",
    emoji: "🐦",
    description: "60%+ of check-ins before 8am",
  },
  {
    id: "night_owl",
    name: "Night Owl",
    type: "time",
    emoji: "🦉",
    description: "60%+ of check-ins after 6pm",
  },
  {
    id: "weekend_warrior",
    name: "Weekend Warrior",
    type: "time",
    emoji: "⚔️",
    description: "40%+ of check-ins on weekends",
  },
];

// Get badge by ID
export function getBadge(id: string): BadgeDefinition | undefined {
  return BADGES.find((b) => b.id === id);
}

// Check if a badge should be unlocked based on context
function shouldUnlockBadge(badge: BadgeDefinition, context: BadgeContext): boolean {
  switch (badge.id) {
    // Milestone badges
    case "first_steps":
      return context.totalCheckIns >= 1;
    case "regular":
      return context.totalCheckIns >= 10;
    case "committed":
      return context.totalCheckIns >= 50;
    case "dedicated":
      return context.totalCheckIns >= 100;

    // Streak badges
    case "spark":
      return context.currentStreak >= 3;
    case "flame":
      return context.currentStreak >= 7;
    case "bonfire":
      return context.currentStreak >= 14;
    case "inferno":
      return context.currentStreak >= 30;

    // Time-based badges (require at least 5 check-ins to evaluate)
    case "early_bird": {
      if (context.checkInHours.length < 5) return false;
      const earlyCount = context.checkInHours.filter((h) => h < 8).length;
      return (earlyCount / context.checkInHours.length) * 100 >= 60;
    }
    case "night_owl": {
      if (context.checkInHours.length < 5) return false;
      const lateCount = context.checkInHours.filter((h) => h >= 18).length;
      return (lateCount / context.checkInHours.length) * 100 >= 60;
    }
    case "weekend_warrior": {
      if (context.checkInHours.length < 5) return false;
      return context.weekendCheckInPercentage >= 40;
    }

    default:
      return false;
  }
}

// Evaluate and award badges for a member
export async function evaluateAndAwardBadges(
  supabase: SupabaseClient<Database>,
  memberId: string,
  context: BadgeContext
): Promise<EarnedBadge[]> {
  // Get existing achievements for this member
  const { data: existingAchievements } = await supabase
    .from("achievements")
    .select("badge_name")
    .eq("member_id", memberId);

  const existingBadgeIds = new Set(
    existingAchievements?.map((a) => a.badge_name) ?? []
  );

  // Check which new badges should be awarded
  const newBadges: EarnedBadge[] = [];
  const now = new Date().toISOString();

  for (const badge of BADGES) {
    // Skip if already earned
    if (existingBadgeIds.has(badge.id)) continue;

    // Check if should unlock
    if (shouldUnlockBadge(badge, context)) {
      // Insert into achievements table
      const { error } = await supabase.from("achievements").insert({
        member_id: memberId,
        badge_name: badge.id,
        badge_type: badge.type,
        earned_at: now,
      });

      if (!error) {
        newBadges.push({
          ...badge,
          earnedAt: now,
        });
      }
    }
  }

  return newBadges;
}

// Build badge context from check-in data
export async function buildBadgeContext(
  supabase: SupabaseClient<Database>,
  memberId: string,
  currentStreak: number,
  totalCheckIns: number
): Promise<BadgeContext> {
  // Get check-ins from last 30 days for time-based badges
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentCheckIns } = await supabase
    .from("check_ins")
    .select("check_in_time")
    .eq("member_id", memberId)
    .eq("is_overtap", false)
    .gte("check_in_time", thirtyDaysAgo.toISOString())
    .order("check_in_time", { ascending: false });

  const checkInHours: number[] = [];
  let weekendCount = 0;

  if (recentCheckIns) {
    for (const checkIn of recentCheckIns) {
      const date = new Date(checkIn.check_in_time);
      checkInHours.push(date.getHours());

      // Check if weekend (0 = Sunday, 6 = Saturday)
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendCount++;
      }
    }
  }

  const weekendCheckInPercentage =
    checkInHours.length > 0
      ? (weekendCount / checkInHours.length) * 100
      : 0;

  return {
    currentStreak,
    totalCheckIns,
    checkInHours,
    weekendCheckInPercentage,
  };
}

// Get all earned badges for a member
export async function getEarnedBadges(
  supabase: SupabaseClient<Database>,
  memberId: string
): Promise<EarnedBadge[]> {
  const { data: achievements } = await supabase
    .from("achievements")
    .select("badge_name, earned_at")
    .eq("member_id", memberId)
    .order("earned_at", { ascending: true });

  if (!achievements) return [];

  return achievements
    .map((a) => {
      const badge = getBadge(a.badge_name);
      if (!badge) return null;
      return {
        ...badge,
        earnedAt: a.earned_at ?? new Date().toISOString(),
      };
    })
    .filter((b): b is EarnedBadge => b !== null);
}
