"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCw, Flame, Pencil, UserX, UserCheck, AlertTriangle, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase/types";
import { validateName } from "@/lib/validation/name-moderation";

type Member = Database["public"]["Tables"]["members"]["Row"];

interface EditForm {
  name: string;
  email: string;
  company: string;
  phone: string;
  current_streak: number;
  longest_streak: number;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deactivatingMember, setDeactivatingMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    email: "",
    company: "",
    phone: "",
    current_streak: 0,
    longest_streak: 0,
  });
  const [saving, setSaving] = useState(false);

  async function fetchMembers() {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!showInactive) {
      query = query.neq("is_active", false);
    }

    const { data } = await query;
    setMembers(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchMembers();
  }, [showInactive]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function openEditDialog(member: Member) {
    setEditForm({
      name: member.name,
      email: member.email,
      company: member.company || "",
      phone: member.phone || "",
      current_streak: member.current_streak || 0,
      longest_streak: member.longest_streak || 0,
    });
    setEditingMember(member);
  }

  async function saveMember() {
    if (!editingMember) return;

    // Validate name for inappropriate content
    const nameValidation = validateName(editForm.name);
    if (!nameValidation.isValid) {
      toast.error(nameValidation.userMessage || "Invalid name");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingMember.id,
          name: editForm.name,
          email: editForm.email,
          company: editForm.company || null,
          phone: editForm.phone || null,
          current_streak: editForm.current_streak,
          longest_streak: editForm.longest_streak,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Member updated successfully");
        setEditingMember(null);
        fetchMembers();
      } else {
        toast.error(result.error || "Failed to update member");
      }
    } catch {
      toast.error("Failed to update member");
    }
    setSaving(false);
  }

  async function deactivateMember() {
    if (!deactivatingMember) return;

    setSaving(true);
    try {
      const response = await fetch("/api/admin/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deactivatingMember.id }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Member deactivated");
        setDeactivatingMember(null);
        fetchMembers();
      } else {
        toast.error(result.error || "Failed to deactivate member");
      }
    } catch {
      toast.error("Failed to deactivate member");
    }
    setSaving(false);
  }

  async function reactivateMember(member: Member) {
    try {
      const response = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id, action: "reactivate" }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Member reactivated");
        fetchMembers();
      } else {
        toast.error(result.error || "Failed to reactivate member");
      }
    } catch {
      toast.error("Failed to reactivate member");
    }
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
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            Show inactive
          </label>
          <Button
            variant="outline"
            onClick={() => window.location.href = "/api/admin/export/members"}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={fetchMembers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
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
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading members...
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No members yet. Members are created automatically when
                  returning visitors check in.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow
                  key={member.id}
                  className={member.is_active === false ? "opacity-50" : ""}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {member.name}
                      {member.is_active === false && (
                        <Badge variant="outline" className="text-gray-500">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </TableCell>
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
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(member)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {member.is_active === false ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => reactivateMember(member)}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <UserCheck className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeactivatingMember(member)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update member information and streak data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={editForm.company}
                  onChange={(e) =>
                    setEditForm({ ...editForm, company: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 text-amber-600 mb-3">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Streak Override (use with caution)</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current_streak">Current Streak</Label>
                  <Input
                    id="current_streak"
                    type="number"
                    min="0"
                    value={editForm.current_streak}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        current_streak: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longest_streak">Longest Streak</Label>
                  <Input
                    id="longest_streak"
                    type="number"
                    min="0"
                    value={editForm.longest_streak}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        longest_streak: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancel
            </Button>
            <Button onClick={saveMember} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={!!deactivatingMember} onOpenChange={() => setDeactivatingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <UserX className="w-5 h-5" />
              Deactivate Member
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate{" "}
              <span className="font-semibold">{deactivatingMember?.name}</span>?
              They will no longer appear in the member list and their check-ins
              will not be counted. This action can be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivatingMember(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deactivateMember} disabled={saving}>
              {saving ? "Deactivating..." : "Deactivate Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
