"use client";

import { useState, useEffect, useCallback } from "react";
import { AttractMode } from "./attract-mode";
import { type Quote } from "./quote-cycle";
import { createClient } from "@/lib/supabase/client";

interface CommunityStats {
  monthlyCount: number;
  monthlyGoal: number;
  recentCheckIns: Array<{ name: string; time: string; emoji: string | null }>;
  topStreak: number;
}

interface AttractCycleManagerProps {
  onScreenTap?: () => void;
}

export function AttractCycleManager({ onScreenTap }: AttractCycleManagerProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    monthlyCount: 0,
    monthlyGoal: 1000,
    recentCheckIns: [],
    topStreak: 0,
  });

  // Fetch quotes
  const fetchQuotes = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("quotes")
      .select("id, text, author, category, source")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (data) {
      setQuotes(data);
    }
  }, []);

  // Fetch community stats
  const fetchCommunityStats = useCallback(async () => {
    const supabase = createClient();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [monthlyResult, recentResult, goalResult, streakResult] = await Promise.all([
      supabase
        .from("check_ins")
        .select("id", { count: "exact" })
        .gte("check_in_time", startOfMonth.toISOString())
        .eq("is_overtap", false),
      supabase
        .from("check_ins")
        .select("visitor_name, check_in_time, members(avatar_emoji)")
        .gte("check_in_time", todayStart.toISOString())
        .eq("is_overtap", false)
        .order("check_in_time", { ascending: false })
        .limit(50),
      supabase
        .from("community_goals")
        .select("target_count")
        .eq("is_active", true)
        .eq("goal_type", "monthly_checkins")
        .single(),
      supabase
        .from("members")
        .select("current_streak")
        .order("current_streak", { ascending: false })
        .limit(1)
        .single(),
    ]);

    setCommunityStats({
      monthlyCount: monthlyResult.count || 0,
      monthlyGoal: goalResult.data?.target_count || 1000,
      recentCheckIns: (recentResult.data || []).map((c) => ({
        name: c.visitor_name || "Visitor",
        time: new Date(c.check_in_time).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        emoji: c.members?.avatar_emoji || null,
      })),
      topStreak: streakResult.data?.current_streak || 0,
    });
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchQuotes();
    fetchCommunityStats();

    // Refresh stats periodically
    const statsInterval = setInterval(fetchCommunityStats, 30000);

    return () => {
      clearInterval(statsInterval);
    };
  }, [fetchQuotes, fetchCommunityStats]);

  return (
    <AttractMode
      stats={communityStats}
      quotes={quotes}
      onScreenTap={onScreenTap}
    />
  );
}
