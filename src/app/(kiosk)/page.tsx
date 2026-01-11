"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AttractMode } from "@/components/kiosk/attract-mode";
import { SuccessScreen } from "@/components/kiosk/success-screen";
import { createClient } from "@/lib/supabase/client";
import { formatDisplayName } from "@/lib/utils";

type KioskState = "attract" | "celebrating";

interface CommunityStats {
  monthlyCount: number;
  monthlyGoal: number;
  recentCheckIns: Array<{ name: string; time: string }>;
  topStreak: number;
}

interface CheckInResult {
  visitorName: string;
  checkInTime: Date;
  location?: string;
  streak: number;
  monthlyCount: number;
  monthlyGoal: number;
}

export default function KioskPage() {
  const [state, setState] = useState<KioskState>("attract");
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    monthlyCount: 0,
    monthlyGoal: 1000,
    recentCheckIns: [],
    topStreak: 0,
  });

  // Fetch community stats
  const fetchCommunityStats = useCallback(async () => {
    const supabase = createClient();

    // Get current month boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch all data in parallel
    const [goalResult, countResult, recentResult, streakResult] = await Promise.all([
      // Get active community goal
      supabase
        .from("community_goals")
        .select("target_count, current_count")
        .eq("is_active", true)
        .eq("goal_type", "monthly_checkins")
        .single(),

      // Get monthly check-in count
      supabase
        .from("check_ins")
        .select("id", { count: "exact" })
        .gte("check_in_time", startOfMonth.toISOString()),

      // Get recent check-ins for today
      supabase
        .from("check_ins")
        .select("visitor_name, check_in_time")
        .gte("check_in_time", startOfDay.toISOString())
        .order("check_in_time", { ascending: false })
        .limit(10),

      // Get top current streak
      supabase
        .from("members")
        .select("current_streak")
        .order("current_streak", { ascending: false })
        .limit(1)
        .single(),
    ]);

    // Format recent check-ins
    const recentCheckIns = (recentResult.data || []).map((checkIn) => {
      const time = new Date(checkIn.check_in_time);
      const timeAgo = getTimeAgo(time);
      return {
        name: formatDisplayName(checkIn.visitor_name || ""),
        time: timeAgo,
      };
    });

    setCommunityStats({
      monthlyCount: countResult.count || goalResult.data?.current_count || 0,
      monthlyGoal: goalResult.data?.target_count || 1000,
      recentCheckIns,
      topStreak: streakResult.data?.current_streak || 0,
    });
  }, []);

  // Helper to format time ago
  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return "Earlier today";
  }

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchCommunityStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchCommunityStats, 30000);
    return () => clearInterval(interval);
  }, [fetchCommunityStats]);

  // Subscribe to real-time check-ins from NFC taps
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("nfc-checkins")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "check_ins",
        },
        async (payload) => {
          // Show celebration for NFC token check-ins
          if (payload.new && payload.new.check_in_method === "nfc_token") {
            // Fetch the member's streak for this check-in
            let streak = 1;
            if (payload.new.member_id) {
              const { data: member } = await supabase
                .from("members")
                .select("current_streak")
                .eq("id", payload.new.member_id)
                .single();
              streak = member?.current_streak || 1;
            }

            // Refresh community stats immediately
            await fetchCommunityStats();

            setCheckInResult({
              visitorName: payload.new.visitor_name || "Visitor",
              checkInTime: new Date(payload.new.check_in_time),
              location: payload.new.location,
              streak,
              monthlyCount: communityStats.monthlyCount + 1,
              monthlyGoal: communityStats.monthlyGoal,
            });
            setState("celebrating");

            // Return to attract mode after 6 seconds
            setTimeout(() => {
              setState("attract");
              setCheckInResult(null);
            }, 6000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCommunityStats, communityStats.monthlyCount, communityStats.monthlyGoal]);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {state === "attract" && (
          <motion.div
            key="attract"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full"
          >
            <AttractMode stats={communityStats} />
          </motion.div>
        )}

        {state === "celebrating" && checkInResult && (
          <motion.div
            key="celebrating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full h-full"
          >
            <SuccessScreen
              visitorName={checkInResult.visitorName}
              streak={checkInResult.streak}
              monthlyCount={checkInResult.monthlyCount}
              monthlyGoal={checkInResult.monthlyGoal}
              location={checkInResult.location}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
