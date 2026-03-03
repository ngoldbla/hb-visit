"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, BarChart3, Users, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Activity {
  id: string;
  name: string;
  slug: string;
  event_date: string | null;
  series_id: string | null;
  location_name: string;
  series_name: string | null;
}

interface Series {
  id: string;
  name: string;
  slug: string;
}

interface CheckInRecord {
  activity_id: string;
  member_id: string;
  visitor_name: string;
  check_in_time: string;
}

type ViewMode = "activity" | "series";

export default function ActivityReportsPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [allSeries, setAllSeries] = useState<Series[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("activity");
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("");

  async function fetchData() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/activities");
      const data = await response.json();
      if (data.success) {
        setActivities(data.activities || []);
        setAllSeries(data.series || []);
      }
    } catch {
      toast.error("Failed to fetch activities");
    }
    setLoading(false);
  }

  async function fetchCheckIns(activityIds: string[]) {
    if (activityIds.length === 0) {
      setCheckIns([]);
      return;
    }

    try {
      const params = new URLSearchParams();
      activityIds.forEach((id) => params.append("activity_id", id));
      const response = await fetch(`/api/admin/activities/checkins?${params}`);
      const data = await response.json();
      if (data.success) {
        setCheckIns(data.checkIns || []);
      }
    } catch {
      toast.error("Failed to fetch check-in data");
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch check-ins when selection changes
  useEffect(() => {
    if (viewMode === "activity" && selectedActivityId) {
      fetchCheckIns([selectedActivityId]);
    } else if (viewMode === "series" && selectedSeriesId) {
      const seriesActivities = activities.filter((a) => a.series_id === selectedSeriesId);
      fetchCheckIns(seriesActivities.map((a) => a.id));
    }
  }, [viewMode, selectedActivityId, selectedSeriesId, activities]);

  // Per-activity view helpers
  const selectedActivity = activities.find((a) => a.id === selectedActivityId);
  const activityAttendees = checkIns
    .filter((c) => c.activity_id === selectedActivityId)
    .reduce<Record<string, { name: string; time: string }>>((acc, c) => {
      if (!acc[c.member_id]) {
        acc[c.member_id] = { name: c.visitor_name, time: c.check_in_time };
      }
      return acc;
    }, {});

  // Series view helpers
  const seriesActivities = activities
    .filter((a) => a.series_id === selectedSeriesId)
    .sort((a, b) => {
      if (!a.event_date) return 1;
      if (!b.event_date) return -1;
      return a.event_date.localeCompare(b.event_date);
    });

  // Build member x activity matrix for series
  const seriesMembers: Record<string, { name: string; attended: Set<string> }> = {};
  for (const c of checkIns) {
    if (!seriesMembers[c.member_id]) {
      seriesMembers[c.member_id] = { name: c.visitor_name, attended: new Set() };
    }
    seriesMembers[c.member_id].attended.add(c.activity_id);
  }

  const memberList = Object.entries(seriesMembers)
    .map(([id, data]) => ({
      id,
      name: data.name,
      attended: data.attended,
      completionRate: seriesActivities.length > 0
        ? Math.round((data.attended.size / seriesActivities.length) * 100)
        : 0,
    }))
    .sort((a, b) => b.attended.size - a.attended.size);

  // Series stats
  const avgAttendance = seriesActivities.length > 0
    ? Math.round(
        seriesActivities.reduce((sum, a) => {
          const count = checkIns.filter((c) => c.activity_id === a.id).length;
          return sum + count;
        }, 0) / seriesActivities.length
      )
    : 0;

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(timeStr: string): string {
    return new Date(timeStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const activitiesWithSeries = activities.filter((a) => a.series_id);
  const seriesWithActivities = allSeries.filter((s) =>
    activitiesWithSeries.some((a) => a.series_id === s.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Reports</h1>
          <p className="text-gray-600 mt-1">
            Attendance tracking and completion metrics
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("activity")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === "activity"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Per Activity
          </button>
          <button
            onClick={() => setViewMode("series")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === "series"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Series View
          </button>
        </div>

        {viewMode === "activity" && (
          <Select
            value={selectedActivityId}
            onValueChange={setSelectedActivityId}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select an activity" />
            </SelectTrigger>
            <SelectContent>
              {activities.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name} {a.event_date ? `(${formatDate(a.event_date)})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {viewMode === "series" && (
          <Select
            value={selectedSeriesId}
            onValueChange={setSelectedSeriesId}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a series" />
            </SelectTrigger>
            <SelectContent>
              {seriesWithActivities.length === 0 ? (
                <SelectItem value="none" disabled>
                  No series with activities
                </SelectItem>
              ) : (
                seriesWithActivities.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Per-Activity View */}
      {viewMode === "activity" && (
        <>
          {!selectedActivityId ? (
            <Card className="p-12 text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Select an activity to view attendance</p>
            </Card>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-gray-500">Total Attendance</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {Object.keys(activityAttendees).length}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-gray-500">Activity</p>
                  <p className="text-lg font-semibold text-gray-900 truncate">
                    {selectedActivity?.name}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-gray-500">Event Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(selectedActivity?.event_date || null)}
                  </p>
                </Card>
              </div>

              {/* Attendee List */}
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Check-In Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.keys(activityAttendees).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8">
                          <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">No check-ins yet</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      Object.entries(activityAttendees)
                        .sort(([, a], [, b]) => a.time.localeCompare(b.time))
                        .map(([memberId, data]) => (
                          <TableRow key={memberId}>
                            <TableCell className="font-medium">{data.name}</TableCell>
                            <TableCell>{formatTime(data.time)}</TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </>
      )}

      {/* Series View */}
      {viewMode === "series" && (
        <>
          {!selectedSeriesId ? (
            <Card className="p-12 text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Select a series to view completion matrix</p>
            </Card>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-gray-500">Activities in Series</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {seriesActivities.length}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-gray-500">Unique Attendees</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {memberList.length}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-gray-500">Avg Attendance</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {avgAttendance}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-gray-500">100% Completion</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {memberList.filter((m) => m.completionRate === 100).length}
                  </p>
                </Card>
              </div>

              {/* Completion Matrix */}
              <Card className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-white z-10 min-w-[180px]">
                        Member
                      </TableHead>
                      {seriesActivities.map((a) => (
                        <TableHead key={a.id} className="text-center min-w-[100px]">
                          <div className="text-xs">
                            <div className="font-medium truncate max-w-[100px]">{a.name}</div>
                            <div className="text-gray-400">{formatDate(a.event_date)}</div>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center">Completion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberList.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={seriesActivities.length + 2}
                          className="text-center py-8"
                        >
                          <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">No attendance data yet</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      memberList.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="sticky left-0 bg-white font-medium">
                            {member.name}
                          </TableCell>
                          {seriesActivities.map((a) => (
                            <TableCell key={a.id} className="text-center">
                              {member.attended.has(a.id) ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="text-center">
                            <Badge
                              variant={member.completionRate === 100 ? "default" : "secondary"}
                            >
                              {member.completionRate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
