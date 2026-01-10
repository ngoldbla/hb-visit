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
import { RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CheckInWithPass {
  id: string;
  check_in_time: string;
  check_in_method: string;
  check_out_time: string | null;
  duration_minutes: number | null;
  status: string;
  passes: {
    visitor_name: string;
    visitor_email: string;
    visitor_company: string | null;
    host_name: string | null;
  } | null;
}

export default function CheckInsPage() {
  const [checkIns, setCheckIns] = useState<CheckInWithPass[]>([]);
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
        passes (
          visitor_name,
          visitor_email,
          visitor_company,
          host_name
        )
      `)
      .order("check_in_time", { ascending: false })
      .limit(100);

    setCheckIns((data as CheckInWithPass[]) || []);
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
        <Button variant="outline" onClick={fetchCheckIns} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visitor</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Host</TableHead>
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
                <TableCell colSpan={8} className="text-center py-8">
                  Loading check-ins...
                </TableCell>
              </TableRow>
            ) : checkIns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No check-ins found.
                </TableCell>
              </TableRow>
            ) : (
              checkIns.map((checkIn) => (
                <TableRow key={checkIn.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {checkIn.passes?.visitor_name || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {checkIn.passes?.visitor_email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {checkIn.passes?.visitor_company || "-"}
                  </TableCell>
                  <TableCell>{checkIn.passes?.host_name || "-"}</TableCell>
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
