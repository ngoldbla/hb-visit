/**
 * Time-based personality nicknames
 * Calculated from check-in patterns over the last 30 days
 */

export interface NicknameResult {
  nickname: string;
  description: string;
  emoji: string;
}

interface CheckInPattern {
  hour: number; // 0-23
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
}

/**
 * Calculate a personality nickname based on check-in patterns
 */
export function calculateNickname(checkInTimes: Date[]): NicknameResult {
  if (checkInTimes.length < 3) {
    return {
      nickname: "Newcomer",
      description: "Just getting started",
      emoji: "🌱",
    };
  }

  const patterns: CheckInPattern[] = checkInTimes.map((time) => ({
    hour: time.getHours(),
    dayOfWeek: time.getDay(),
  }));

  // Count early, late, and weekend check-ins
  const earlyBirdCount = patterns.filter((p) => p.hour < 8).length;
  const nightOwlCount = patterns.filter((p) => p.hour >= 18).length;
  const lunchRusherCount = patterns.filter(
    (p) => p.hour >= 11 && p.hour <= 13
  ).length;
  const weekendCount = patterns.filter(
    (p) => p.dayOfWeek === 0 || p.dayOfWeek === 6
  ).length;
  const nineToFiveCount = patterns.filter(
    (p) => p.hour >= 8 && p.hour <= 10
  ).length;

  const total = patterns.length;
  const earlyPct = earlyBirdCount / total;
  const nightPct = nightOwlCount / total;
  const lunchPct = lunchRusherCount / total;
  const weekendPct = weekendCount / total;
  const nineToFivePct = nineToFiveCount / total;

  // Calculate time variance to detect consistency
  const hours = patterns.map((p) => p.hour);
  const avgHour = hours.reduce((a, b) => a + b, 0) / hours.length;
  const variance =
    hours.reduce((acc, h) => acc + Math.pow(h - avgHour, 2), 0) / hours.length;
  const isConsistent = variance < 4; // Low variance = consistent

  // Determine nickname based on patterns (priority order)
  if (earlyPct >= 0.6) {
    return {
      nickname: "Early Bird",
      description: "Catches the worm before everyone else",
      emoji: "🐦",
    };
  }

  if (nightPct >= 0.6) {
    return {
      nickname: "Night Owl",
      description: "Burns the midnight oil",
      emoji: "🦉",
    };
  }

  if (weekendPct >= 0.4) {
    return {
      nickname: "Weekend Warrior",
      description: "Hustles when others rest",
      emoji: "⚔️",
    };
  }

  if (lunchPct >= 0.5) {
    return {
      nickname: "Lunch Rusher",
      description: "Peak productivity at noon",
      emoji: "🍔",
    };
  }

  if (nineToFivePct >= 0.6 && isConsistent) {
    return {
      nickname: "9-to-5er",
      description: "Clockwork precision",
      emoji: "⏰",
    };
  }

  if (isConsistent && total >= 10) {
    return {
      nickname: "The Regular",
      description: "You can set your watch by them",
      emoji: "📅",
    };
  }

  // Check for first-of-day frequency (would need additional data)
  // For now, use variance as a proxy for unpredictability
  if (variance > 16) {
    return {
      nickname: "Wildcard",
      description: "Keeps everyone guessing",
      emoji: "🃏",
    };
  }

  // Default nickname
  return {
    nickname: "Community Member",
    description: "Part of the HatchBridge family",
    emoji: "🏠",
  };
}

/**
 * Calculate nickname from a list of check-in timestamps (ISO strings)
 */
export function calculateNicknameFromTimestamps(timestamps: string[]): NicknameResult {
  const dates = timestamps.map((ts) => new Date(ts));
  return calculateNickname(dates);
}
