"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { UserCheck, Users, Clock, Target, Flame, TrendingUp, BarChart3, Timer, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatDisplayName } from "@/lib/utils";

interface Stats {
  todayCheckIns: number;
  currentlyIn: number;
  totalMembers: number;
  monthlyCount: number;
  monthlyGoal: number;
  topStreak: number;
  topStreakName: string | null;
}

interface DailyCount {
  day: string;
  count: number;
}

interface HourCount {
  hour: number;
  count: number;
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
  const [weeklyTrend, setWeeklyTrend] = useState<DailyCount[]>([]);
  const [peakHours, setPeakHours] = useState<HourCount[]>([]);
  const [avgDuration, setAvgDuration] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Danger zone state
  const [showDangerDialog, setShowDangerDialog] = useState(false);
  const [resetType, setResetType] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Calculate 7 days ago
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      const [checkIns, currentIn, members, monthlyCheckIns, goal, topStreak, weeklyData, durationData] = await Promise.all([
        supabase
          .from("check_ins")
          .select("id", { count: "exact" })
          .gte("check_in_time", `${today}T00:00:00`)
          .eq("is_overtap", false),
        supabase
          .from("check_ins")
          .select("id", { count: "exact" })
          .eq("status", "checked_in")
          .eq("is_overtap", false),
        supabase.from("members").select("id", { count: "exact" }).neq("is_active", false),
        supabase
          .from("check_ins")
          .select("id", { count: "exact" })
          .gte("check_in_time", startOfMonth.toISOString())
          .eq("is_overtap", false),
        supabase
          .from("community_goals")
          .select("target_count")
          .eq("is_active", true)
          .eq("goal_type", "monthly_checkins")
          .single(),
        supabase
          .from("members")
          .select("current_streak, name")
          .neq("is_active", false)
          .order("current_streak", { ascending: false })
          .limit(1)
          .single(),
        // Weekly trend data
        supabase
          .from("check_ins")
          .select("check_in_time")
          .gte("check_in_time", weekAgo.toISOString())
          .eq("is_overtap", false),
        // Duration data
        supabase
          .from("check_ins")
          .select("duration_minutes")
          .not("duration_minutes", "is", null),
      ]);

      setStats({
        todayCheckIns: checkIns.count || 0,
        currentlyIn: currentIn.count || 0,
        totalMembers: members.count || 0,
        monthlyCount: monthlyCheckIns.count || 0,
        monthlyGoal: goal.data?.target_count || 1000,
        topStreak: topStreak.data?.current_streak || 0,
        topStreakName: topStreak.data?.name
          ? formatDisplayName(topStreak.data.name)
          : null,
      });

      // Process weekly trend
      const dailyCounts: Record<string, number> = {};
      const hourCounts: Record<number, number> = {};

      (weeklyData.data || []).forEach((c) => {
        const date = new Date(c.check_in_time);
        const dayKey = date.toISOString().split("T")[0];
        const hour = date.getHours();

        dailyCounts[dayKey] = (dailyCounts[dayKey] || 0) + 1;
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      // Create 7-day array
      const trend: DailyCount[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayKey = d.toISOString().split("T")[0];
        const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
        trend.push({ day: dayLabel, count: dailyCounts[dayKey] || 0 });
      }
      setWeeklyTrend(trend);

      // Get top 3 peak hours
      const sortedHours = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      setPeakHours(sortedHours);

      // Calculate average duration
      const durations = (durationData.data || []).map((d) => d.duration_minutes).filter(Boolean) as number[];
      if (durations.length > 0) {
        const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        setAvgDuration(Math.round(avg));
      }

      setLoading(false);
    }

    fetchStats();
  }, []);

  const progress = Math.min((stats.monthlyCount / stats.monthlyGoal) * 100, 100);
  const maxWeeklyCount = Math.max(...weeklyTrend.map((d) => d.count), 1);

  const resetOptions = [
    { value: "check_ins", label: "Check-ins only", description: "Delete all check-in records, keep members" },
    { value: "streaks", label: "Streaks only", description: "Reset all member streaks to 0" },
    { value: "members", label: "Members & Check-ins", description: "Delete all members and check-ins" },
    { value: "all", label: "Everything", description: "Complete system reset including tokens" },
  ];

  async function handleReset() {
    if (confirmText !== "DELETE ALL DATA" || !resetType) return;

    setResetting(true);
    try {
      const response = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetType, confirmationText: confirmText }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Successfully reset: ${resetType}`);
        setShowDangerDialog(false);
        setResetType("");
        setConfirmText("");
        // Refresh stats
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to reset data");
      }
    } catch {
      toast.error("Failed to reset data");
    }
    setResetting(false);
  }

  function formatHour(hour: number): string {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
  }

  function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

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

      {/* Analytics Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weekly Trend */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Weekly Trend</h3>
            </div>
            <div className="flex items-end gap-2 h-32">
              {weeklyTrend.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all duration-500"
                    style={{
                      height: `${(day.count / maxWeeklyCount) * 100}%`,
                      minHeight: day.count > 0 ? "4px" : "0"
                    }}
                  />
                  <span className="text-xs text-gray-500">{day.day}</span>
                  <span className="text-xs font-medium">{day.count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Peak Hours & Avg Duration */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-gray-900">Peak Hours</h3>
              </div>
              {peakHours.length === 0 ? (
                <p className="text-sm text-gray-500">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {peakHours.map((h, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {formatHour(h.hour)}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {h.count} check-ins
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-cyan-100">
                  <Timer className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Visit Duration</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "..." : avgDuration > 0 ? formatDuration(avgDuration) : "N/A"}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
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

      {/* Danger Zone */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>
        <Card className="p-6 border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Danger Zone</h3>
                <p className="text-sm text-gray-600">Reset or delete data from the system</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setShowDangerDialog(true)}
            >
              Reset Data
            </Button>
          </div>
        </Card>
      </div>

      {/* Danger Zone Dialog */}
      <Dialog open={showDangerDialog} onOpenChange={setShowDangerDialog}>
        <DialogContent className="border-red-200">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone - Reset Data
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please proceed with extreme caution.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">What do you want to reset?</Label>
              <div className="space-y-2 mt-2">
                {resetOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      resetType === opt.value
                        ? "border-red-500 bg-red-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="resetType"
                      value={opt.value}
                      checked={resetType === opt.value}
                      onChange={(e) => setResetType(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{opt.label}</p>
                      <p className="text-sm text-gray-500">{opt.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {resetType && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <Label className="text-sm font-medium text-red-800">
                  Type &quot;DELETE ALL DATA&quot; to confirm:
                </Label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE ALL DATA"
                  className="mt-2 border-red-300"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDangerDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText !== "DELETE ALL DATA" || !resetType || resetting}
              onClick={handleReset}
            >
              {resetting ? "Resetting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
