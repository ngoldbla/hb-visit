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
import { RefreshCw, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Member = Database["public"]["Tables"]["members"]["Row"];

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchMembers() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    setMembers(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-600 mt-1">
            Regular visitors with streak tracking
          </p>
        </div>
        <Button variant="outline" onClick={fetchMembers} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Current Streak</TableHead>
              <TableHead>Best Streak</TableHead>
              <TableHead>Last Check-In</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading members...
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No members yet. Members are created automatically when
                  returning visitors check in.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.company || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {(member.current_streak ?? 0) > 0 && (
                        <Flame className="w-4 h-4 text-orange-500" />
                      )}
                      <span
                        className={
                          (member.current_streak ?? 0) > 0
                            ? "text-orange-600 font-semibold"
                            : ""
                        }
                      >
                        {member.current_streak ?? 0} days
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{member.longest_streak ?? 0} days</Badge>
                  </TableCell>
                  <TableCell>
                    {member.last_check_in
                      ? formatDate(member.last_check_in)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {member.created_at ? formatDate(member.created_at) : "-"}
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
