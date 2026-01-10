"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Ticket, UserCheck, Users, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  activePasses: number;
  todayCheckIns: number;
  currentlyIn: number;
  totalMembers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    activePasses: 0,
    todayCheckIns: 0,
    currentlyIn: 0,
    totalMembers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];

      const [passes, checkIns, currentIn, members] = await Promise.all([
        supabase
          .from("passes")
          .select("id", { count: "exact" })
          .eq("status", "active"),
        supabase
          .from("check_ins")
          .select("id", { count: "exact" })
          .gte("check_in_time", `${today}T00:00:00`),
        supabase
          .from("check_ins")
          .select("id", { count: "exact" })
          .eq("status", "checked_in"),
        supabase.from("members").select("id", { count: "exact" }),
      ]);

      setStats({
        activePasses: passes.count || 0,
        todayCheckIns: checkIns.count || 0,
        currentlyIn: currentIn.count || 0,
        totalMembers: members.count || 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Active Passes",
      value: stats.activePasses,
      icon: Ticket,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
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

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <a href="/admin/passes/new" className="block">
              <h3 className="font-semibold text-gray-900">Create New Pass</h3>
              <p className="text-sm text-gray-600 mt-1">
                Invite a visitor to HatchBridge
              </p>
            </a>
          </Card>
          <Card className="p-6 hover:border-blue-300 cursor-pointer transition-colors">
            <a href="/admin/passes" className="block">
              <h3 className="font-semibold text-gray-900">Manage Passes</h3>
              <p className="text-sm text-gray-600 mt-1">
                View and manage all visitor passes
              </p>
            </a>
          </Card>
          <Card className="p-6 hover:border-blue-300 cursor-pointer transition-colors">
            <a href="/admin/checkins" className="block">
              <h3 className="font-semibold text-gray-900">Check-In Log</h3>
              <p className="text-sm text-gray-600 mt-1">
                View today&apos;s visitor activity
              </p>
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}
