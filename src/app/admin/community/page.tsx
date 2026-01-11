"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Save, RefreshCw, Flame, Users, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface CommunityGoal {
  id: string;
  target_count: number;
  current_count: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean | null;
}

interface StreakLeader {
  name: string;
  avatar_emoji: string | null;
  current_streak: number | null;
  longest_streak: number | null;
}

export default function CommunityPage() {
  const [goal, setGoal] = useState<CommunityGoal | null>(null);
  const [targetCount, setTargetCount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [streakLeaders, setStreakLeaders] = useState<StreakLeader[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalCheckIns: 0,
    uniqueVisitors: 0,
    averagePerDay: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const supabase = createClient();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const dayOfMonth = now.getDate();

    const [goalResult, leadersResult, checkInsResult] = await Promise.all([
      // Get active community goal
      supabase
        .from("community_goals")
        .select("*")
        .eq("is_active", true)
        .eq("goal_type", "monthly_checkins")
        .single(),

      // Get top streak leaders (only active members)
      supabase
        .from("members")
        .select("name, avatar_emoji, current_streak, longest_streak")
        .gt("current_streak", 0)
        .neq("is_active", false)
        .order("current_streak", { ascending: false })
        .limit(5),

      // Get monthly check-in count (excluding overtaps)
      supabase
        .from("check_ins")
        .select("id, member_id", { count: "exact" })
        .gte("check_in_time", startOfMonth.toISOString())
        .eq("is_overtap", false),
    ]);

    if (goalResult.data) {
      setGoal(goalResult.data);
      setTargetCount(goalResult.data.target_count.toString());
    } else {
      // Create default goal if none exists
      const { data: newGoal } = await supabase
        .from("community_goals")
        .insert({
          goal_type: "monthly_checkins",
          target_count: 1000,
          current_count: 0,
          start_date: startOfMonth.toISOString().split("T")[0],
          end_date: endOfMonth.toISOString().split("T")[0],
          is_active: true,
        })
        .select()
        .single();
      if (newGoal) {
        setGoal(newGoal);
        setTargetCount("1000");
      }
    }

    setStreakLeaders(leadersResult.data || []);

    // Calculate unique visitors from member_ids
    const uniqueMembers = new Set(
      (checkInsResult.data || [])
        .map((c) => c.member_id)
        .filter(Boolean)
    );

    setMonthlyStats({
      totalCheckIns: checkInsResult.count || 0,
      uniqueVisitors: uniqueMembers.size,
      averagePerDay: dayOfMonth > 0 ? Math.round((checkInsResult.count || 0) / dayOfMonth) : 0,
    });

    setLoading(false);
  }

  async function saveGoal() {
    if (!targetCount || parseInt(targetCount) < 1) {
      toast.error("Please enter a valid target count");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    if (goal) {
      // Update existing goal
      const { error } = await supabase
        .from("community_goals")
        .update({ target_count: parseInt(targetCount) })
        .eq("id", goal.id);

      if (error) {
        toast.error("Failed to update goal");
      } else {
        toast.success("Community goal updated!");
        setGoal({ ...goal, target_count: parseInt(targetCount) });
      }
    } else {
      // Create new goal
      const { data, error } = await supabase
        .from("community_goals")
        .insert({
          goal_type: "monthly_checkins",
          target_count: parseInt(targetCount),
          current_count: 0,
          start_date: startOfMonth.toISOString().split("T")[0],
          end_date: endOfMonth.toISOString().split("T")[0],
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        toast.error("Failed to create goal");
      } else {
        toast.success("Community goal created!");
        setGoal(data);
      }
    }

    setSaving(false);
  }

  const progress = goal
    ? Math.min(((goal.current_count || monthlyStats.totalCheckIns) / goal.target_count) * 100, 100)
    : 0;

  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community Goals</h1>
          <p className="text-gray-600 mt-1">
            Set monthly targets and track collective progress
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Current Goal Card */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-blue-100">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {currentMonth} Goal
            </h2>
            <p className="text-sm text-gray-600">
              Monthly check-in target for the community
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Goal Setting */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="target">Target Check-Ins</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="target"
                  type="number"
                  min="1"
                  value={targetCount}
                  onChange={(e) => setTargetCount(e.target.value)}
                  placeholder="1000"
                  className="max-w-[200px]"
                />
                <Button onClick={saveGoal} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                This goal will be displayed on the kiosk attract screen
              </p>
            </div>

            {/* Quick presets */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Quick presets:</p>
              <div className="flex gap-2">
                {[500, 1000, 1500, 2000].map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => setTargetCount(preset.toString())}
                    className={targetCount === preset.toString() ? "border-blue-500 bg-blue-50" : ""}
                  >
                    {preset}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Display */}
          <div>
            <div className="flex items-end gap-4 mb-4">
              <div className="text-4xl font-bold text-gray-900">
                {loading ? "..." : monthlyStats.totalCheckIns.toLocaleString()}
              </div>
              <div className="text-lg text-gray-500 mb-1">
                / {(goal?.target_count || 1000).toLocaleString()}
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              {Math.round(progress)}% complete
            </p>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average per Day</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? "..." : monthlyStats.averagePerDay}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unique Visitors</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? "..." : monthlyStats.uniqueVisitors}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-100">
              <Flame className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Streaks</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? "..." : streakLeaders.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Streak Leaders */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-orange-100">
            <Flame className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Streak Leaders
            </h2>
            <p className="text-sm text-gray-600">
              Members with active check-in streaks
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : streakLeaders.length === 0 ? (
          <p className="text-gray-500">No active streaks yet. Check-ins build streaks!</p>
        ) : (
          <div className="space-y-3">
            {streakLeaders.map((leader, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      i === 0
                        ? "bg-yellow-100 text-yellow-700"
                        : i === 1
                          ? "bg-gray-200 text-gray-700"
                          : i === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{leader.avatar_emoji || "😊"}</span>
                    <div>
                      <p className="font-medium text-gray-900">{leader.name}</p>
                      <p className="text-sm text-gray-500">
                        Best: {leader.longest_streak} days
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className={`w-5 h-5 ${(leader.current_streak || 0) >= 7 ? "text-orange-500" : "text-gray-400"}`} />
                  <span className="text-xl font-bold text-gray-900">
                    {leader.current_streak || 0}
                  </span>
                  <span className="text-gray-500 text-sm">days</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
