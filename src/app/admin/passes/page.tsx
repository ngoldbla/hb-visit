"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { Plus, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Pass = Database["public"]["Tables"]["passes"]["Row"];

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  used: "bg-blue-100 text-blue-800",
  expired: "bg-gray-100 text-gray-800",
  revoked: "bg-red-100 text-red-800",
};

export default function PassesPage() {
  const [passes, setPasses] = useState<Pass[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchPasses() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("passes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    setPasses(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchPasses();
  }, []);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(time: string | null) {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Visitor Passes</h1>
          <p className="text-gray-600 mt-1">
            Create and manage visitor passes
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchPasses} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/admin/passes/new">
            <Button className="bg-[#2153ff] hover:bg-[#1a42cc]">
              <Plus className="w-4 h-4 mr-2" />
              Create Pass
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pass Code</TableHead>
              <TableHead>Visitor</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Date/Time</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading passes...
                </TableCell>
              </TableRow>
            ) : passes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No passes found.{" "}
                  <Link
                    href="/admin/passes/new"
                    className="text-blue-600 hover:underline"
                  >
                    Create your first pass
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              passes.map((pass) => (
                <TableRow key={pass.id}>
                  <TableCell className="font-mono font-semibold">
                    {pass.pass_code}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{pass.visitor_name}</p>
                      <p className="text-sm text-gray-500">
                        {pass.visitor_email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{pass.visitor_company || "-"}</TableCell>
                  <TableCell>
                    <div>
                      <p>{formatDate(pass.scheduled_date)}</p>
                      <p className="text-sm text-gray-500">
                        {formatTime(pass.scheduled_time)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{pass.host_name || "-"}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[pass.status ?? "active"]}>
                      {pass.status ?? "active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {pass.created_at ? formatDate(pass.created_at) : "-"}
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
