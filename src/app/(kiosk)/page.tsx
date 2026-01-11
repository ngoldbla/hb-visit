"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AttractCycleManager } from "@/components/kiosk/attract-cycle-manager";
import { SuccessScreen } from "@/components/kiosk/success-screen";
import { createClient } from "@/lib/supabase/client";

type KioskState = "attract" | "celebrating";

interface CelebrationStats {
  monthlyCount: number;
  monthlyGoal: number;
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
  const [celebrationStats, setCelebrationStats] = useState<CelebrationStats>({
    monthlyCount: 0,
    monthlyGoal: 1000,
  });

  // Fetch celebration stats (for success screen)
  const fetchCelebrationStats = useCallback(async () => {
    const supabase = createClient();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [goalResult, countResult] = await Promise.all([
      supabase
        .from("community_goals")
        .select("target_count, current_count")
        .eq("is_active", true)
        .eq("goal_type", "monthly_checkins")
        .single(),
      supabase
        .from("check_ins")
        .select("id", { count: "exact" })
        .gte("check_in_time", startOfMonth.toISOString())
        .eq("is_overtap", false),
    ]);

    setCelebrationStats({
      monthlyCount: countResult.count || goalResult.data?.current_count || 0,
      monthlyGoal: goalResult.data?.target_count || 1000,
    });
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCelebrationStats();
  }, [fetchCelebrationStats]);

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

            // Refresh celebration stats immediately
            await fetchCelebrationStats();

            setCheckInResult({
              visitorName: payload.new.visitor_name || "Visitor",
              checkInTime: new Date(payload.new.check_in_time),
              location: payload.new.location,
              streak,
              monthlyCount: celebrationStats.monthlyCount + 1,
              monthlyGoal: celebrationStats.monthlyGoal,
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
  }, [fetchCelebrationStats, celebrationStats.monthlyCount, celebrationStats.monthlyGoal]);

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
            <AttractCycleManager />
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
