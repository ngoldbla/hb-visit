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
import { RefreshCw, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CheckIn {
  id: string;
  check_in_time: string;
  check_in_method: string;
  check_out_time: string | null;
  duration_minutes: number | null;
  status: string | null;
  visitor_name: string | null;
  location: string | null;
  is_overtap: boolean | null;
}

export default function CheckInsPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchCheckIns() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("check_ins")
      .select(`
        id,
        check_in_time,
        check_in_method,
        check_out_time,
        duration_minutes,
        status,
        visitor_name,
        location,
        is_overtap
      `)
      .order("check_in_time", { ascending: false })
      .limit(100);

    setCheckIns((data as CheckIn[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchCheckIns();
  }, []);

  function formatDateTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function formatDuration(minutes: number | null) {
    if (!minutes) return "-";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Check-In Log</h1>
          <p className="text-gray-600 mt-1">
            View visitor check-in and check-out activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => window.location.href = "/api/admin/export/checkins"}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={fetchCheckIns} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visitor</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Check-In</TableHead>
              <TableHead>Check-Out</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading check-ins...
                </TableCell>
              </TableRow>
            ) : checkIns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No check-ins found.
                </TableCell>
              </TableRow>
            ) : (
              checkIns.map((checkIn) => (
                <TableRow key={checkIn.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {checkIn.visitor_name || "Unknown Visitor"}
                      </p>
                      {checkIn.is_overtap && (
                        <Badge className="bg-amber-100 text-amber-800 text-xs">
                          Overtap
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{checkIn.location || "-"}</TableCell>
                  <TableCell>{formatDateTime(checkIn.check_in_time)}</TableCell>
                  <TableCell>
                    {checkIn.check_out_time
                      ? formatDateTime(checkIn.check_out_time)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {formatDuration(checkIn.duration_minutes)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {checkIn.check_in_method.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        checkIn.status === "checked_in"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {checkIn.status === "checked_in" ? "In Building" : "Left"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
