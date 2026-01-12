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
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Copy,
  QrCode,
  ExternalLink,
  Sparkles,
  Link as LinkIcon,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import type { Database } from "@/lib/supabase/types";

type Location = Database["public"]["Tables"]["locations"]["Row"] & {
  check_in_count?: number;
};

interface LocationForm {
  name: string;
  slug: string;
  description: string;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState("https://visit.hatchbridge.com");
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState<Location | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [locationForm, setLocationForm] = useState<LocationForm>({
    name: "",
    slug: "",
    description: "",
  });
  const [newBaseUrl, setNewBaseUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [discovering, setDiscovering] = useState(false);

  async function fetchLocations() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/locations");
      const data = await response.json();
      if (data.success) {
        setLocations(data.locations || []);
        setBaseUrl(data.baseUrl || "https://visit.hatchbridge.com");
      }
    } catch {
      toast.error("Failed to fetch locations");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchLocations();
  }, []);

  function getTapUrl(slug: string) {
    return `${baseUrl}/tap?loc=${slug}`;
  }

  function openEditDialog(location: Location) {
    setLocationForm({
      name: location.name,
      slug: location.slug,
      description: location.description || "",
    });
    setEditingLocation(location);
  }

  function openAddDialog() {
    setLocationForm({
      name: "",
      slug: "",
      description: "",
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

  async function saveLocation() {
    if (!locationForm.name.trim()) {
      toast.error("Location name is required");
      return;
    }
    if (!locationForm.slug.trim()) {
      toast.error("Location slug is required");
      return;
    }

    setSaving(true);
    try {
      const isEditing = !!editingLocation;
      const response = await fetch("/api/admin/locations", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing && { id: editingLocation.id }),
          name: locationForm.name,
          slug: locationForm.slug,
          description: locationForm.description || null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(isEditing ? "Location updated" : "Location added");
        setEditingLocation(null);
        setShowAddDialog(false);
        fetchLocations();
      } else {
        toast.error(result.error || "Failed to save location");
      }
    } catch {
      toast.error("Failed to save location");
    }
    setSaving(false);
  }

  async function deleteLocation() {
    if (!deletingLocation) return;

    setSaving(true);
    try {
      const response = await fetch("/api/admin/locations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingLocation.id }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Location deleted");
        setDeletingLocation(null);
        fetchLocations();
      } else {
        toast.error(result.error || "Failed to delete location");
      }
    } catch {
      toast.error("Failed to delete location");
    }
    setSaving(false);
  }

  async function toggleLocationActive(location: Location) {
    try {
      const response = await fetch("/api/admin/locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: location.id,
          is_active: !location.is_active,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(location.is_active ? "Location disabled" : "Location enabled");
        fetchLocations();
      } else {
        toast.error(result.error || "Failed to update location");
      }
    } catch {
      toast.error("Failed to update location");
    }
  }

  async function discoverLocations() {
    setDiscovering(true);
    try {
      const response = await fetch("/api/admin/locations/discover", {
        method: "POST",
      });
      const result = await response.json();
      if (result.success) {
        if (result.added > 0) {
          toast.success(`Discovered ${result.added} new location(s)`);
          fetchLocations();
        } else {
          toast.info("No new locations to discover");
        }
      } else {
        toast.error(result.error || "Failed to discover locations");
      }
    } catch {
      toast.error("Failed to discover locations");
    }
    setDiscovering(false);
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Failed to copy URL");
    }
  }

  function openTestUrl(slug: string) {
    window.open(getTapUrl(slug), "_blank");
  }

  async function saveBaseUrl() {
    if (!newBaseUrl.trim()) {
      toast.error("Base URL is required");
      return;
    }

    // Validate URL format
    try {
      new URL(newBaseUrl);
    } catch {
      toast.error("Invalid URL format");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "base_url",
          value: newBaseUrl.replace(/\/$/, ""), // Remove trailing slash
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Base URL updated");
        setBaseUrl(newBaseUrl.replace(/\/$/, ""));
        setShowSettingsDialog(false);
      } else {
        toast.error(result.error || "Failed to save base URL");
      }
    } catch {
      toast.error("Failed to save base URL");
    }
    setSaving(false);
  }

  const activeLocations = locations.filter((l) => l.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-600 mt-1">
            Manage NFC tap locations ({activeLocations.length} active)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => {
            setNewBaseUrl(baseUrl);
            setShowSettingsDialog(true);
          }}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" onClick={discoverLocations} disabled={discovering}>
            <Sparkles className={`w-4 h-4 mr-2 ${discovering ? "animate-pulse" : ""}`} />
            {discovering ? "Discovering..." : "Auto-Discover"}
          </Button>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </Button>
          <Button variant="outline" onClick={fetchLocations} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Base URL Info */}
      <Card className="p-4">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <LinkIcon className="w-4 h-4" />
          <span>Base URL:</span>
          <code className="bg-gray-100 px-2 py-1 rounded font-mono text-gray-900">
            {baseUrl}
          </code>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => copyUrl(baseUrl)}
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[25%]">Location</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Check-ins</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading locations...
                </TableCell>
              </TableRow>
            ) : locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <MapPin className="w-8 h-8 text-gray-400" />
                    <p className="text-gray-500">No locations yet</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={openAddDialog}>
                        Add your first location
                      </Button>
                      <Button variant="outline" size="sm" onClick={discoverLocations}>
                        <Sparkles className="w-4 h-4 mr-1" />
                        Auto-discover
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              locations.map((location) => (
                <TableRow
                  key={location.id}
                  className={!location.is_active ? "opacity-50" : ""}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{location.name}</p>
                      {location.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {location.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {location.slug}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{location.check_in_count || 0}</span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={location.is_active}
                      onCheckedChange={() => toggleLocationActive(location)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyUrl(getTapUrl(location.slug))}
                        className="h-8 w-8 p-0"
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowQrDialog(location)}
                        className="h-8 w-8 p-0"
                        title="Show QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openTestUrl(location.slug)}
                        className="h-8 w-8 p-0"
                        title="Test Check-in"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(location)}
                        className="h-8 w-8 p-0"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingLocation(location)}
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

      {/* Add/Edit Location Dialog */}
      <Dialog
        open={showAddDialog || !!editingLocation}
        onOpenChange={() => {
          setShowAddDialog(false);
          setEditingLocation(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? "Edit Location" : "Add Location"}
            </DialogTitle>
            <DialogDescription>
              {editingLocation
                ? "Update the location details."
                : "Add a new NFC tap location. The slug is used in the tap URL."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Location Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Main Entrance"
                value={locationForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setLocationForm({
                    ...locationForm,
                    name,
                    // Auto-generate slug for new locations only
                    slug: !editingLocation ? generateSlug(name) : locationForm.slug,
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                placeholder="e.g., main-entrance"
                value={locationForm.slug}
                onChange={(e) =>
                  setLocationForm({
                    ...locationForm,
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
                placeholder="e.g., NFC sticker on front door"
                value={locationForm.description}
                onChange={(e) =>
                  setLocationForm({ ...locationForm, description: e.target.value })
                }
              />
            </div>
            {locationForm.slug && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Tap URL Preview</p>
                <code className="text-sm text-blue-600 break-all">
                  {getTapUrl(locationForm.slug)}
                </code>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setEditingLocation(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveLocation}
              disabled={saving || !locationForm.name.trim() || !locationForm.slug.trim()}
            >
              {saving ? "Saving..." : editingLocation ? "Save Changes" : "Add Location"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingLocation} onOpenChange={() => setDeletingLocation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Location
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this location? This action cannot be
              undone. Existing check-ins will not be affected.
            </DialogDescription>
          </DialogHeader>
          {deletingLocation && (
            <div className="bg-gray-50 rounded-lg p-4 my-4">
              <p className="font-medium">{deletingLocation.name}</p>
              <p className="text-sm text-gray-500 font-mono">{deletingLocation.slug}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingLocation(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteLocation} disabled={saving}>
              {saving ? "Deleting..." : "Delete Location"}
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
              Scan this QR code to check in at this location.
            </DialogDescription>
          </DialogHeader>
          {showQrDialog && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-4 rounded-lg shadow-inner">
                <QRCodeSVG
                  value={getTapUrl(showQrDialog.slug)}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="w-full">
                <Label className="text-xs text-gray-500">URL</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-xs bg-gray-100 p-2 rounded font-mono break-all">
                    {getTapUrl(showQrDialog.slug)}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyUrl(getTapUrl(showQrDialog.slug))}
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
            <Button onClick={() => openTestUrl(showQrDialog!.slug)}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Test Check-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Location Settings
            </DialogTitle>
            <DialogDescription>
              Configure the base URL for tap links.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                placeholder="https://visit.hatchbridge.com"
                value={newBaseUrl}
                onChange={(e) => setNewBaseUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                The domain used for all tap URLs (without trailing slash)
              </p>
            </div>
            {newBaseUrl && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Example URL</p>
                <code className="text-sm text-blue-600 break-all">
                  {newBaseUrl.replace(/\/$/, "")}/tap?loc=entrance
                </code>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveBaseUrl} disabled={saving || !newBaseUrl.trim()}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
