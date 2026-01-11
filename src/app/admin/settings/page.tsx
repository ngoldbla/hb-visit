"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RefreshCw, Save, Monitor, Quote, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface CycleConfig {
  enableStats: boolean;
  enableQuotes: boolean;
  cycleDuration: number;
}

const DEFAULT_CONFIG: CycleConfig = {
  enableStats: true,
  enableQuotes: true,
  cycleDuration: 15,
};

export default function SettingsPage() {
  const [config, setConfig] = useState<CycleConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalConfig, setOriginalConfig] = useState<CycleConfig>(DEFAULT_CONFIG);

  async function fetchSettings() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();
      if (data.success && data.settings?.attract_cycle_config) {
        const fetchedConfig = data.settings.attract_cycle_config as CycleConfig;
        const normalized = {
          enableStats: fetchedConfig.enableStats ?? true,
          enableQuotes: fetchedConfig.enableQuotes ?? true,
          cycleDuration: fetchedConfig.cycleDuration ?? 15,
        };
        setConfig(normalized);
        setOriginalConfig(normalized);
      }
    } catch {
      toast.error("Failed to fetch settings");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const changed =
      config.enableStats !== originalConfig.enableStats ||
      config.enableQuotes !== originalConfig.enableQuotes ||
      config.cycleDuration !== originalConfig.cycleDuration;
    setHasChanges(changed);
  }, [config, originalConfig]);

  async function saveSettings() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "attract_cycle_config",
          value: config,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Settings saved");
        setOriginalConfig(config);
        setHasChanges(false);
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  }

  function resetToDefaults() {
    setConfig(DEFAULT_CONFIG);
  }

  const enabledPanelCount =
    (config.enableStats ? 1 : 0) + (config.enableQuotes ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kiosk Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure the kiosk attract mode display
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <Button variant="outline" onClick={fetchSettings} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Loading settings...
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Attract Cycle Panels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Attract Mode Panels
              </CardTitle>
              <CardDescription>
                Choose which content to display when the kiosk is idle.
                {enabledPanelCount > 1 && " Panels will cycle automatically."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <Label htmlFor="stats" className="text-base font-medium">
                      Community Stats
                    </Label>
                    <p className="text-sm text-gray-500">
                      Monthly goal progress, recent check-ins, NFC tap zone
                    </p>
                  </div>
                </div>
                <Switch
                  id="stats"
                  checked={config.enableStats}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enableStats: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Quote className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <Label htmlFor="quotes" className="text-base font-medium">
                      Quote Carousel
                    </Label>
                    <p className="text-sm text-gray-500">
                      Inspirational quotes from your quotes library
                    </p>
                  </div>
                </div>
                <Switch
                  id="quotes"
                  checked={config.enableQuotes}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enableQuotes: checked })
                  }
                />
              </div>

              {enabledPanelCount === 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                  At least one panel should be enabled. Community Stats will be
                  shown as a fallback.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cycle Timing */}
          <Card>
            <CardHeader>
              <CardTitle>Cycle Timing</CardTitle>
              <CardDescription>
                How long to display each panel before switching.
                {enabledPanelCount <= 1 &&
                  " (Only applies when multiple panels are enabled)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Cycle Duration</Label>
                  <span className="text-2xl font-bold text-gray-900">
                    {config.cycleDuration}s
                  </span>
                </div>
                <Slider
                  value={[config.cycleDuration]}
                  onValueChange={([value]) =>
                    setConfig({ ...config, cycleDuration: value })
                  }
                  min={10}
                  max={30}
                  step={5}
                  disabled={enabledPanelCount <= 1}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>10s</span>
                  <span>20s</span>
                  <span>30s</span>
                </div>
              </div>

              {enabledPanelCount > 1 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Each panel will display for {config.cycleDuration} seconds
                    before transitioning to the next.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Button */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            onClick={saveSettings}
            disabled={saving}
            className="shadow-lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
