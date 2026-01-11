"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { UserCheck, Users, Clock, Target, Flame, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  todayCheckIns: number;
  currentlyIn: number;
  totalMembers: number;
  monthlyCount: number;
  monthlyGoal: number;
  topStreak: number;
  topStreakName: string | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    todayCheckIns: 0,
    currentlyIn: 0,
    totalMembers: 0,
    monthlyCount: 0,
    monthlyGoal: 1000,
    topStreak: 0,
    topStreakName: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [checkIns, currentIn, members, monthlyCheckIns, goal, topStreak] = await Promise.all([
        supabase
          .from("check_ins")
          .select("id", { count: "exact" })
          .gte("check_in_time", `${today}T00:00:00`),
        supabase
          .from("check_ins")
          .select("id", { count: "exact" })
          .eq("status", "checked_in"),
        supabase.from("members").select("id", { count: "exact" }),
        supabase
          .from("check_ins")
          .select("id", { count: "exact" })
          .gte("check_in_time", startOfMonth.toISOString()),
        supabase
          .from("community_goals")
          .select("target_count")
          .eq("is_active", true)
          .eq("goal_type", "monthly_checkins")
          .single(),
        supabase
          .from("members")
          .select("current_streak, name")
          .order("current_streak", { ascending: false })
          .limit(1)
          .single(),
      ]);

      setStats({
        todayCheckIns: checkIns.count || 0,
        currentlyIn: currentIn.count || 0,
        totalMembers: members.count || 0,
        monthlyCount: monthlyCheckIns.count || 0,
        monthlyGoal: goal.data?.target_count || 1000,
        topStreak: topStreak.data?.current_streak || 0,
        topStreakName: topStreak.data?.name?.split(" ")[0] || null,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  const progress = Math.min((stats.monthlyCount / stats.monthlyGoal) * 100, 100);

  const statCards = [
    {
      label: "Today's Check-Ins",
      value: stats.todayCheckIns,
      icon: UserCheck,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      label: "Currently In Building",
      value: stats.currentlyIn,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      label: "Total Members",
      value: stats.totalMembers,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of visitor management activity
        </p>
      </div>

      {/* Community Goal Progress */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-100">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Monthly Community Goal</h2>
              <p className="text-sm text-gray-600">Track collective check-in progress</p>
            </div>
          </div>
          <a
            href="/admin/community"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Settings
          </a>
        </div>

        <div className="flex items-end gap-4 mb-4">
          <div className="text-4xl font-bold text-gray-900">
            {loading ? "..." : stats.monthlyCount.toLocaleString()}
          </div>
          <div className="text-lg text-gray-500 mb-1">
            / {stats.monthlyGoal.toLocaleString()} check-ins
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-white/60 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600">
          {Math.round(progress)}% of monthly goal reached
        </p>

        {/* Streak highlight */}
        {stats.topStreak > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-gray-600">
              Top streak:{" "}
              <span className="font-semibold text-orange-600">
                {stats.topStreak} days
              </span>
              {stats.topStreakName && (
                <span className="text-gray-500"> by {stats.topStreakName}</span>
              )}
            </span>
          </div>
        )}
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <Card key={card.label} className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : card.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 hover:border-blue-300 cursor-pointer transition-colors">
            <a href="/admin/checkins" className="block">
              <h3 className="font-semibold text-gray-900">Check-In Log</h3>
              <p className="text-sm text-gray-600 mt-1">
                View today&apos;s visitor activity
              </p>
            </a>
          </Card>
          <Card className="p-6 hover:border-blue-300 cursor-pointer transition-colors">
            <a href="/admin/members" className="block">
              <h3 className="font-semibold text-gray-900">Manage Members</h3>
              <p className="text-sm text-gray-600 mt-1">
                View and manage team members
              </p>
            </a>
          </Card>
          <Card className="p-6 hover:border-blue-300 cursor-pointer transition-colors">
            <a href="/admin/community" className="block">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Community Goals</h3>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Set monthly targets and milestones
              </p>
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}
