"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AttractMode } from "./attract-mode";
import { QuoteCycle, type Quote } from "./quote-cycle";
import { createClient } from "@/lib/supabase/client";

type CyclePanel = "stats" | "quotes";

export interface CycleConfig {
  enableStats: boolean;
  enableQuotes: boolean;
  cycleDuration: number; // seconds
}

interface CommunityStats {
  monthlyCount: number;
  monthlyGoal: number;
  recentCheckIns: Array<{ name: string; time: string; emoji: string | null }>;
  topStreak: number;
}

const DEFAULT_CONFIG: CycleConfig = {
  enableStats: true,
  enableQuotes: true,
  cycleDuration: 15,
};

export function AttractCycleManager() {
  const [config, setConfig] = useState<CycleConfig>(DEFAULT_CONFIG);
  const [activePanel, setActivePanel] = useState<CyclePanel>("stats");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    monthlyCount: 0,
    monthlyGoal: 1000,
    recentCheckIns: [],
    topStreak: 0,
  });

  // Fetch configuration from kiosk_settings
  const fetchConfig = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("kiosk_settings")
      .select("setting_value")
      .eq("setting_key", "attract_cycle_config")
      .single();

    if (data?.setting_value) {
      const value = data.setting_value as unknown as CycleConfig;
      setConfig({
        enableStats: value.enableStats ?? true,
        enableQuotes: value.enableQuotes ?? true,
        cycleDuration: value.cycleDuration ?? 15,
      });
    }
  }, []);

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

    // Get current month's check-in count
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
        .limit(10),
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
    fetchConfig();
    fetchQuotes();
    fetchCommunityStats();

    // Refresh stats periodically
    const statsInterval = setInterval(fetchCommunityStats, 30000);

    return () => {
      clearInterval(statsInterval);
    };
  }, [fetchConfig, fetchQuotes, fetchCommunityStats]);

  // Build list of enabled panels
  const enabledPanels: CyclePanel[] = [];
  if (config.enableStats) enabledPanels.push("stats");
  if (config.enableQuotes && quotes.length > 0) enabledPanels.push("quotes");

  // Cycle through panels
  useEffect(() => {
    // If only one panel or no panels, don't cycle
    if (enabledPanels.length <= 1) {
      if (enabledPanels.length === 1) {
        setActivePanel(enabledPanels[0]);
      }
      return;
    }

    const interval = setInterval(() => {
      setActivePanel((current) => {
        const currentIndex = enabledPanels.indexOf(current);
        const nextIndex = (currentIndex + 1) % enabledPanels.length;
        return enabledPanels[nextIndex];
      });
    }, config.cycleDuration * 1000);

    return () => clearInterval(interval);
  }, [enabledPanels.length, config.cycleDuration, enabledPanels]);

  // Ensure active panel is valid
  useEffect(() => {
    if (enabledPanels.length > 0 && !enabledPanels.includes(activePanel)) {
      setActivePanel(enabledPanels[0]);
    }
  }, [enabledPanels, activePanel]);

  // Handler to skip from quotes to stats screen
  const handleSkipToStats = useCallback(() => {
    if (activePanel === "quotes") {
      setActivePanel("stats");
    }
  }, [activePanel]);

  // If no panels enabled, show stats as fallback
  if (enabledPanels.length === 0) {
    return <AttractMode stats={communityStats} />;
  }

  return (
    <AnimatePresence mode="wait">
      {activePanel === "stats" && (
        <motion.div
          key="stats"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="h-full"
        >
          <AttractMode stats={communityStats} />
        </motion.div>
      )}
      {activePanel === "quotes" && (
        <motion.div
          key="quotes"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="h-full"
        >
          <QuoteCycle quotes={quotes} displayDuration={8000} onSkip={handleSkipToStats} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
