"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  Copy,
  QrCode,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface Activity {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location_id: string;
  series_id: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  is_active: boolean;
  created_at: string | null;
  check_in_count: number;
  location_name: string;
  series_name: string | null;
}

interface LocationOption {
  id: string;
  name: string;
  slug: string;
}

interface SeriesOption {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

interface ActivityForm {
  name: string;
  slug: string;
  description: string;
  location_id: string;
  series_id: string;
  event_date: string;
  start_time: string;
  end_time: string;
}

interface SeriesForm {
  name: string;
  slug: string;
  description: string;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [series, setSeries] = useState<SeriesOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState("https://visit.hatchbridge.com");
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState<Activity | null>(null);
  const [showNewSeriesDialog, setShowNewSeriesDialog] = useState(false);
  const [activityForm, setActivityForm] = useState<ActivityForm>({
    name: "",
    slug: "",
    description: "",
    location_id: "",
    series_id: "",
    event_date: "",
    start_time: "",
    end_time: "",
  });
  const [seriesForm, setSeriesForm] = useState<SeriesForm>({
    name: "",
    slug: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  async function fetchActivities() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/activities");
      const data = await response.json();
      if (data.success) {
        setActivities(data.activities || []);
        setLocations(data.locations || []);
        setSeries(data.series || []);
        setBaseUrl(data.baseUrl || "https://visit.hatchbridge.com");
      }
    } catch {
      toast.error("Failed to fetch activities");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchActivities();
  }, []);

  function getActivityUrl(locationSlug: string, activitySlug: string) {
    return `${baseUrl}/tap?loc=${locationSlug}&activity=${activitySlug}`;
  }

  function getLocationSlug(locationId: string): string {
    return locations.find((l) => l.id === locationId)?.slug || "unknown";
  }

  function openEditDialog(activity: Activity) {
    setActivityForm({
      name: activity.name,
      slug: activity.slug,
      description: activity.description || "",
      location_id: activity.location_id,
      series_id: activity.series_id || "",
      event_date: activity.event_date || "",
      start_time: activity.start_time || "",
      end_time: activity.end_time || "",
    });
    setEditingActivity(activity);
  }

  function openAddDialog() {
    setActivityForm({
      name: "",
      slug: "",
      description: "",
      location_id: locations[0]?.id || "",
      series_id: "",
      event_date: "",
      start_time: "",
      end_time: "",
    });
    setShowAddDialog(true);
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  async function saveActivity() {
    if (!activityForm.name.trim()) {
      toast.error("Activity name is required");
      return;
    }
    if (!activityForm.slug.trim()) {
      toast.error("Activity slug is required");
      return;
    }
    if (!activityForm.location_id) {
      toast.error("Location is required");
      return;
    }

    setSaving(true);
    try {
      const isEditing = !!editingActivity;
      const response = await fetch("/api/admin/activities", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing && { id: editingActivity.id }),
          name: activityForm.name,
          slug: activityForm.slug,
          description: activityForm.description || null,
          location_id: activityForm.location_id,
          series_id: activityForm.series_id || null,
          event_date: activityForm.event_date || null,
          start_time: activityForm.start_time || null,
          end_time: activityForm.end_time || null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(isEditing ? "Activity updated" : "Activity added");
        setEditingActivity(null);
        setShowAddDialog(false);
        fetchActivities();
      } else {
        toast.error(result.error || "Failed to save activity");
      }
    } catch {
      toast.error("Failed to save activity");
    }
    setSaving(false);
  }

  async function deleteActivity() {
    if (!deletingActivity) return;

    setSaving(true);
    try {
      const response = await fetch("/api/admin/activities", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingActivity.id }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Activity deleted");
        setDeletingActivity(null);
        fetchActivities();
      } else {
        toast.error(result.error || "Failed to delete activity");
      }
    } catch {
      toast.error("Failed to delete activity");
    }
    setSaving(false);
  }

  async function toggleActivityActive(activity: Activity) {
    try {
      const response = await fetch("/api/admin/activities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activity.id,
          is_active: !activity.is_active,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(activity.is_active ? "Activity disabled" : "Activity enabled");
        fetchActivities();
      } else {
        toast.error(result.error || "Failed to update activity");
      }
    } catch {
      toast.error("Failed to update activity");
    }
  }

  async function createSeries() {
    if (!seriesForm.name.trim() || !seriesForm.slug.trim()) {
      toast.error("Series name and slug are required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/activities/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: seriesForm.name,
          slug: seriesForm.slug,
          description: seriesForm.description || null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Series created");
        setSeries([...series, result.series]);
        setActivityForm({ ...activityForm, series_id: result.series.id });
        setShowNewSeriesDialog(false);
        setSeriesForm({ name: "", slug: "", description: "" });
      } else {
        toast.error(result.error || "Failed to create series");
      }
    } catch {
      toast.error("Failed to create series");
    }
    setSaving(false);
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Failed to copy URL");
    }
  }

  function openTestUrl(activity: Activity) {
    const locSlug = getLocationSlug(activity.location_id);
    window.open(getActivityUrl(locSlug, activity.slug), "_blank");
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const activeActivities = activities.filter((a) => a.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activities</h1>
          <p className="text-gray-600 mt-1">
            Manage activity check-ins ({activeActivities.length} active)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={openAddDialog} disabled={locations.length === 0}>
            <Plus className="w-4 h-4 mr-2" />
            Add Activity
          </Button>
          <Button variant="outline" onClick={fetchActivities} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {locations.length === 0 && !loading && (
        <Card className="p-4">
          <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
            You need to create at least one location before adding activities.
          </p>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[25%]">Activity</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Series</TableHead>
              <TableHead>Check-ins</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading activities...
                </TableCell>
              </TableRow>
            ) : activities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <CalendarDays className="w-8 h-8 text-gray-400" />
                    <p className="text-gray-500">No activities yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openAddDialog}
                      disabled={locations.length === 0}
                    >
                      Add your first activity
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              activities.map((activity) => (
                <TableRow
                  key={activity.id}
                  className={!activity.is_active ? "opacity-50" : ""}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{activity.name}</p>
                      {activity.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {activity.description}
                        </p>
                      )}
                      <Badge variant="outline" className="font-mono text-xs mt-1">
                        {activity.slug}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{activity.location_name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatDate(activity.event_date)}</span>
                  </TableCell>
                  <TableCell>
                    {activity.series_name ? (
                      <Badge variant="secondary">{activity.series_name}</Badge>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{activity.check_in_count}</span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={activity.is_active}
                      onCheckedChange={() => toggleActivityActive(activity)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const locSlug = getLocationSlug(activity.location_id);
                          copyUrl(getActivityUrl(locSlug, activity.slug));
                        }}
                        className="h-8 w-8 p-0"
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowQrDialog(activity)}
                        className="h-8 w-8 p-0"
                        title="Show QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openTestUrl(activity)}
                        className="h-8 w-8 p-0"
                        title="Test Check-in"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(activity)}
                        className="h-8 w-8 p-0"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingActivity(activity)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Activity Dialog */}
      <Dialog
        open={showAddDialog || !!editingActivity}
        onOpenChange={() => {
          setShowAddDialog(false);
          setEditingActivity(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingActivity ? "Edit Activity" : "Add Activity"}
            </DialogTitle>
            <DialogDescription>
              {editingActivity
                ? "Update the activity details."
                : "Add a new activity. The slug is used in the check-in URL."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="name">Activity Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Build-It March 2026"
                value={activityForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setActivityForm({
                    ...activityForm,
                    name,
                    slug: !editingActivity ? generateSlug(name) : activityForm.slug,
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                placeholder="e.g., build-it-march-2026"
                value={activityForm.slug}
                onChange={(e) =>
                  setActivityForm({
                    ...activityForm,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  })
                }
              />
              <p className="text-xs text-gray-500">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                rows={2}
                placeholder="e.g., Monthly build session for incubator members"
                value={activityForm.description}
                onChange={(e) =>
                  setActivityForm({ ...activityForm, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Location *</Label>
              <Select
                value={activityForm.location_id}
                onValueChange={(v) => setActivityForm({ ...activityForm, location_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Series (optional)</Label>
              <div className="flex gap-2">
                <Select
                  value={activityForm.series_id}
                  onValueChange={(v) =>
                    setActivityForm({ ...activityForm, series_id: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {series.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewSeriesDialog(true)}
                  className="shrink-0"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="event_date">Event Date</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={activityForm.event_date}
                  onChange={(e) =>
                    setActivityForm({ ...activityForm, event_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={activityForm.start_time}
                  onChange={(e) =>
                    setActivityForm({ ...activityForm, start_time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={activityForm.end_time}
                  onChange={(e) =>
                    setActivityForm({ ...activityForm, end_time: e.target.value })
                  }
                />
              </div>
            </div>
            {activityForm.slug && activityForm.location_id && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Check-in URL Preview</p>
                <code className="text-sm text-blue-600 break-all">
                  {getActivityUrl(getLocationSlug(activityForm.location_id), activityForm.slug)}
                </code>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setEditingActivity(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveActivity}
              disabled={saving || !activityForm.name.trim() || !activityForm.slug.trim() || !activityForm.location_id}
            >
              {saving ? "Saving..." : editingActivity ? "Save Changes" : "Add Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingActivity} onOpenChange={() => setDeletingActivity(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Activity
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this activity? This action cannot be
              undone. Existing check-ins will have their activity reference cleared.
            </DialogDescription>
          </DialogHeader>
          {deletingActivity && (
            <div className="bg-gray-50 rounded-lg p-4 my-4">
              <p className="font-medium">{deletingActivity.name}</p>
              <p className="text-sm text-gray-500 font-mono">{deletingActivity.slug}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingActivity(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteActivity} disabled={saving}>
              {saving ? "Deleting..." : "Delete Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!showQrDialog} onOpenChange={() => setShowQrDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              QR Code - {showQrDialog?.name}
            </DialogTitle>
            <DialogDescription>
              Scan this QR code to check in for this activity.
            </DialogDescription>
          </DialogHeader>
          {showQrDialog && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-4 rounded-lg shadow-inner">
                <QRCodeSVG
                  value={getActivityUrl(
                    getLocationSlug(showQrDialog.location_id),
                    showQrDialog.slug
                  )}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="w-full">
                <Label className="text-xs text-gray-500">URL</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-xs bg-gray-100 p-2 rounded font-mono break-all">
                    {getActivityUrl(
                      getLocationSlug(showQrDialog.location_id),
                      showQrDialog.slug
                    )}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyUrl(
                        getActivityUrl(
                          getLocationSlug(showQrDialog.location_id),
                          showQrDialog.slug
                        )
                      )
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Right-click the QR code to save as image
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQrDialog(null)}>
              Close
            </Button>
            <Button onClick={() => openTestUrl(showQrDialog!)}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Test Check-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Series Dialog */}
      <Dialog open={showNewSeriesDialog} onOpenChange={setShowNewSeriesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Series</DialogTitle>
            <DialogDescription>
              Group related activities together for tracking completion across events.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="series_name">Series Name *</Label>
              <Input
                id="series_name"
                placeholder="e.g., Hatching Success Spring 2026"
                value={seriesForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setSeriesForm({
                    ...seriesForm,
                    name,
                    slug: generateSlug(name),
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="series_slug">Slug *</Label>
              <Input
                id="series_slug"
                placeholder="e.g., hatching-success-spring-2026"
                value={seriesForm.slug}
                onChange={(e) =>
                  setSeriesForm({
                    ...seriesForm,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="series_description">Description (optional)</Label>
              <Textarea
                id="series_description"
                rows={2}
                placeholder="Description of the series"
                value={seriesForm.description}
                onChange={(e) =>
                  setSeriesForm({ ...seriesForm, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSeriesDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={createSeries}
              disabled={saving || !seriesForm.name.trim() || !seriesForm.slug.trim()}
            >
              {saving ? "Creating..." : "Create Series"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
