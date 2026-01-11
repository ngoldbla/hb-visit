"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Calendar, Clock, Trophy, ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { StatsResponse } from "@/app/api/stats/route";

const STORAGE_KEY = "hb_visitor_token";

// Streak tier names
function getStreakTier(streak: number): { name: string; color: string } {
  if (streak >= 30) return { name: "Inferno", color: "text-red-500" };
  if (streak >= 14) return { name: "Bonfire", color: "text-orange-500" };
  if (streak >= 7) return { name: "Flame", color: "text-[#ffc421]" };
  if (streak >= 3) return { name: "Spark", color: "text-yellow-400" };
  return { name: "", color: "text-[#333]/50" };
}

// Weekly activity dots
function WeeklyDots({ activity }: { activity: boolean[] }) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="flex justify-between gap-2">
      {days.map((day, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <span className="text-xs text-[#333]/50">{day}</span>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              activity[i]
                ? "bg-gradient-to-br from-[#ffc421] to-[#ff9d00]"
                : "bg-[#333]/10"
            }`}
          >
            {activity[i] && (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </motion.div>
        </div>
      ))}
    </div>
  );
}

// Monthly heatmap calendar
function MonthlyHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const now = new Date();
  const monthName = now.toLocaleDateString("en-US", { month: "long" });

  // Get first day of month to calculate offset
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0

  // Create grid with empty cells for offset
  const cells = [
    ...Array(startOffset).fill(null),
    ...data,
  ];

  // Fill to complete last week
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    cells.push(...Array(remaining).fill(null));
  }

  const getIntensity = (count: number) => {
    if (count === 0) return "bg-[#333]/5";
    if (count === 1) return "bg-[#ffc421]/30";
    if (count === 2) return "bg-[#ffc421]/60";
    return "bg-[#ffc421]";
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-[#333]/70 mb-3">{monthName}</h3>
      <div className="grid grid-cols-7 gap-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="text-xs text-[#333]/40 text-center pb-1">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.01 }}
            className={`aspect-square rounded-sm ${
              cell === null ? "" : getIntensity(cell.count)
            }`}
            title={cell ? `${cell.date}: ${cell.count} check-in${cell.count !== 1 ? "s" : ""}` : ""}
          />
        ))}
      </div>
      <div className="flex items-center justify-end gap-1 mt-2 text-xs text-[#333]/40">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-[#333]/5" />
        <div className="w-3 h-3 rounded-sm bg-[#ffc421]/30" />
        <div className="w-3 h-3 rounded-sm bg-[#ffc421]/60" />
        <div className="w-3 h-3 rounded-sm bg-[#ffc421]" />
        <span>More</span>
      </div>
    </div>
  );
}

// Badge grid
function BadgeGrid({ badges }: { badges: Array<{
  id: string;
  name: string;
  emoji: string;
  description: string;
  earned: boolean;
  earnedAt?: string;
}> }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {badges.map((badge, i) => (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`relative p-3 rounded-xl text-center ${
            badge.earned
              ? "bg-gradient-to-br from-[#ffc421]/20 to-[#ff9d00]/20 border border-[#ffc421]/30"
              : "bg-[#333]/5 opacity-50"
          }`}
        >
          <div className={`text-2xl ${badge.earned ? "" : "grayscale"}`}>
            {badge.emoji}
          </div>
          <p className={`text-xs font-medium mt-1 ${
            badge.earned ? "text-[#000824]" : "text-[#333]/50"
          }`}>
            {badge.name}
          </p>
          {badge.earned && badge.earnedAt && (
            <p className="text-[10px] text-[#333]/40 mt-0.5">
              {new Date(badge.earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsResponse["stats"] | null>(null);

  useEffect(() => {
    async function fetchStats() {
      const token = localStorage.getItem(STORAGE_KEY);

      if (!token) {
        setError("Not logged in. Please check in first.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/stats", {
          headers: {
            "X-Visitor-Token": token,
          },
        });

        const data: StatsResponse = await response.json();

        if (data.success && data.stats) {
          setStats(data.stats);
        } else {
          setError(data.error || "Failed to load stats");
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff9e9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ffc421] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#333]/60">Loading your stats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fff9e9] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <h1 className="text-xl font-bold text-[#000824] mb-2">Oops!</h1>
          <p className="text-[#333]/60 mb-4">{error}</p>
          <Link
            href="/tap"
            className="inline-block bg-[#2153ff] text-white px-6 py-3 rounded-xl font-medium"
          >
            Check In
          </Link>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const streakTier = getStreakTier(stats.member.currentStreak);

  return (
    <div className="min-h-screen bg-[#fff9e9]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#fff9e9]/80 backdrop-blur-lg border-b border-[#333]/5">
        <div className="px-4 py-3 flex items-center">
          <Link href="/tap" className="p-2 -ml-2 text-[#333]/60">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="flex-1 text-center font-semibold text-[#000824]">Your Stats</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 pb-8 max-w-lg mx-auto">
        {/* Profile section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-[#ffc421] to-[#ff9d00] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-4xl">{stats.member.avatarEmoji}</span>
          </div>
          <h2 className="text-2xl font-bold text-[#000824]">{stats.member.name}</h2>
          {stats.member.personalityNickname && (
            <p className="text-[#ffc421] font-medium">{stats.member.personalityNickname}</p>
          )}
        </motion.section>

        {/* Streak section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-lg shadow-black/5 mb-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#333]/50">Current Streak</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[#000824]">
                  {stats.member.currentStreak}
                </span>
                <span className="text-lg text-[#333]/50">days</span>
              </div>
              {streakTier.name && (
                <p className={`text-sm font-medium ${streakTier.color}`}>
                  {streakTier.name}
                </p>
              )}
            </div>
            <motion.div
              animate={stats.member.currentStreak >= 3 ? {
                scale: [1, 1.1, 1],
                rotate: [-5, 5, -5],
              } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Flame className={`w-12 h-12 ${
                stats.member.currentStreak >= 7
                  ? "text-orange-500"
                  : stats.member.currentStreak >= 3
                    ? "text-[#ffc421]"
                    : "text-[#333]/20"
              }`} />
            </motion.div>
          </div>
        </motion.section>

        {/* Stats grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-3 gap-3 mb-4"
        >
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <Calendar className="w-6 h-6 text-[#2153ff] mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#000824]">{stats.member.totalCheckIns}</p>
            <p className="text-xs text-[#333]/50">Check-ins</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <Clock className="w-6 h-6 text-[#2153ff] mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#000824]">{stats.member.totalHours}</p>
            <p className="text-xs text-[#333]/50">Hours</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <Trophy className="w-6 h-6 text-[#ffc421] mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#000824]">{stats.member.longestStreak}</p>
            <p className="text-xs text-[#333]/50">Best Streak</p>
          </div>
        </motion.section>

        {/* Weekly activity */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 shadow-lg shadow-black/5 mb-4"
        >
          <h3 className="text-sm font-medium text-[#333]/70 mb-3">This Week</h3>
          <WeeklyDots activity={stats.weeklyActivity} />
        </motion.section>

        {/* Monthly heatmap */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-5 shadow-lg shadow-black/5 mb-4"
        >
          <MonthlyHeatmap data={stats.monthlyHeatmap} />
        </motion.section>

        {/* Badges */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 shadow-lg shadow-black/5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#333]/70">Badges</h3>
            <span className="text-xs text-[#ffc421] font-medium">
              {stats.earnedBadges.length} / {stats.allBadges.length}
            </span>
          </div>
          <BadgeGrid badges={stats.allBadges} />
        </motion.section>

        {/* Member since */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-[#333]/40 mt-6"
        >
          Member since {new Date(stats.member.memberSince).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </motion.p>
      </main>
    </div>
  );
}
