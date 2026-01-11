"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RefreshCw, Save, Monitor, Quote, BarChart3, Globe, Sparkles, Eye, Calendar } from "lucide-react";
import { toast } from "sonner";
import { HOLIDAYS, getHolidayTheme, type Holiday } from "@/lib/holidays";
import { getCommonTimezones } from "@/hooks/use-holiday";

interface CycleConfig {
  enableStats: boolean;
  enableQuotes: boolean;
  cycleDuration: number;
}

interface HolidayConfig {
  timezone: string;
  enableHolidayThemes: boolean;
  disabledHolidays: string[];
  previewHoliday: string | null;
  previewDay: number;
}

const DEFAULT_CONFIG: CycleConfig = {
  enableStats: true,
  enableQuotes: true,
  cycleDuration: 15,
};

const DEFAULT_HOLIDAY_CONFIG: HolidayConfig = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  enableHolidayThemes: true,
  disabledHolidays: [],
  previewHoliday: null,
  previewDay: 1,
};

export default function SettingsPage() {
  const [config, setConfig] = useState<CycleConfig>(DEFAULT_CONFIG);
  const [holidayConfig, setHolidayConfig] = useState<HolidayConfig>(DEFAULT_HOLIDAY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalConfig, setOriginalConfig] = useState<CycleConfig>(DEFAULT_CONFIG);
  const [originalHolidayConfig, setOriginalHolidayConfig] = useState<HolidayConfig>(DEFAULT_HOLIDAY_CONFIG);
  const [showHolidayManager, setShowHolidayManager] = useState(false);

  const timezones = useMemo(() => getCommonTimezones(), []);

  // Get holidays grouped by category for the manager
  const holidaysByCategory = useMemo(() => {
    const categories: Record<string, Holiday[]> = {};
    for (const holiday of HOLIDAYS) {
      if (!categories[holiday.category]) {
        categories[holiday.category] = [];
      }
      categories[holiday.category].push(holiday);
    }
    return categories;
  }, []);

  // Get the preview holiday details
  const previewHolidayDetails = useMemo(() => {
    if (!holidayConfig.previewHoliday) return null;
    const holiday = HOLIDAYS.find(h => h.id === holidayConfig.previewHoliday);
    if (!holiday) return null;
    const theme = getHolidayTheme(holiday.id);
    const dates = holiday.dateCalculator(new Date().getFullYear());
    return { holiday, theme, totalDays: dates.totalDays || 1 };
  }, [holidayConfig.previewHoliday]);

  async function fetchSettings() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();
      if (data.success) {
        // Cycle config
        if (data.settings?.attract_cycle_config) {
          const fetchedConfig = data.settings.attract_cycle_config as CycleConfig;
          const normalized = {
            enableStats: fetchedConfig.enableStats ?? true,
            enableQuotes: fetchedConfig.enableQuotes ?? true,
            cycleDuration: fetchedConfig.cycleDuration ?? 15,
          };
          setConfig(normalized);
          setOriginalConfig(normalized);
        }

        // Holiday config
        if (data.settings?.holiday_config) {
          const fetchedHoliday = data.settings.holiday_config as HolidayConfig;
          const normalizedHoliday = {
            timezone: fetchedHoliday.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            enableHolidayThemes: fetchedHoliday.enableHolidayThemes ?? true,
            disabledHolidays: fetchedHoliday.disabledHolidays || [],
            previewHoliday: fetchedHoliday.previewHoliday || null,
            previewDay: fetchedHoliday.previewDay || 1,
          };
          setHolidayConfig(normalizedHoliday);
          setOriginalHolidayConfig(normalizedHoliday);
        }
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
    const cycleChanged =
      config.enableStats !== originalConfig.enableStats ||
      config.enableQuotes !== originalConfig.enableQuotes ||
      config.cycleDuration !== originalConfig.cycleDuration;

    const holidayChanged =
      holidayConfig.timezone !== originalHolidayConfig.timezone ||
      holidayConfig.enableHolidayThemes !== originalHolidayConfig.enableHolidayThemes ||
      JSON.stringify(holidayConfig.disabledHolidays) !== JSON.stringify(originalHolidayConfig.disabledHolidays) ||
      holidayConfig.previewHoliday !== originalHolidayConfig.previewHoliday ||
      holidayConfig.previewDay !== originalHolidayConfig.previewDay;

    setHasChanges(cycleChanged || holidayChanged);
  }, [config, originalConfig, holidayConfig, originalHolidayConfig]);

  async function saveSettings() {
    setSaving(true);
    try {
      // Save cycle config
      const cycleResponse = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "attract_cycle_config",
          value: config,
        }),
      });

      // Save holiday config
      const holidayResponse = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "holiday_config",
          value: holidayConfig,
        }),
      });

      const cycleResult = await cycleResponse.json();
      const holidayResult = await holidayResponse.json();

      if (cycleResult.success && holidayResult.success) {
        toast.success("Settings saved");
        setOriginalConfig(config);
        setOriginalHolidayConfig(holidayConfig);
        setHasChanges(false);
      } else {
        toast.error("Failed to save some settings");
      }
    } catch {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  }

  function resetToDefaults() {
    setConfig(DEFAULT_CONFIG);
    setHolidayConfig(DEFAULT_HOLIDAY_CONFIG);
  }

  function toggleHoliday(holidayId: string) {
    setHolidayConfig(prev => {
      const isDisabled = prev.disabledHolidays.includes(holidayId);
      return {
        ...prev,
        disabledHolidays: isDisabled
          ? prev.disabledHolidays.filter(id => id !== holidayId)
          : [...prev.disabledHolidays, holidayId],
      };
    });
  }

  function clearPreview() {
    setHolidayConfig(prev => ({
      ...prev,
      previewHoliday: null,
      previewDay: 1,
    }));
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

          {/* Timezone Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Timezone
              </CardTitle>
              <CardDescription>
                Set the timezone for holiday date calculations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={holidayConfig.timezone}
                  onChange={(e) =>
                    setHolidayConfig({ ...holidayConfig, timezone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  Current: {holidayConfig.timezone}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Holiday Themes */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Holiday Themes
              </CardTitle>
              <CardDescription>
                Enable seasonal themes that automatically activate on holidays.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <Label htmlFor="holiday-themes" className="text-base font-medium">
                      Enable Holiday Themes
                    </Label>
                    <p className="text-sm text-gray-500">
                      Show themed visuals, sounds, and messages on holidays
                    </p>
                  </div>
                </div>
                <Switch
                  id="holiday-themes"
                  checked={holidayConfig.enableHolidayThemes}
                  onCheckedChange={(checked) =>
                    setHolidayConfig({ ...holidayConfig, enableHolidayThemes: checked })
                  }
                />
              </div>

              {holidayConfig.enableHolidayThemes && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Manage Holidays</h4>
                      <p className="text-sm text-gray-500">
                        {HOLIDAYS.length - holidayConfig.disabledHolidays.length} of {HOLIDAYS.length} holidays enabled
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHolidayManager(!showHolidayManager)}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      {showHolidayManager ? "Hide" : "Manage"}
                    </Button>
                  </div>

                  {showHolidayManager && (
                    <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4">
                      {Object.entries(holidaysByCategory).map(([category, holidays]) => (
                        <div key={category}>
                          <h5 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                            {category} Holidays
                          </h5>
                          <div className="grid gap-2">
                            {holidays.map((holiday) => {
                              const theme = getHolidayTheme(holiday.id);
                              const isEnabled = !holidayConfig.disabledHolidays.includes(holiday.id);
                              return (
                                <div
                                  key={holiday.id}
                                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{theme?.decorations.iconEmoji || "🎉"}</span>
                                    <span className={isEnabled ? "" : "text-gray-400"}>
                                      {holiday.name}
                                    </span>
                                    {holiday.type === "variable" && (
                                      <span className="text-xs text-gray-400">(varies)</span>
                                    )}
                                  </div>
                                  <Switch
                                    checked={isEnabled}
                                    onCheckedChange={() => toggleHoliday(holiday.id)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Holiday Preview */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Holiday Preview
              </CardTitle>
              <CardDescription>
                Preview any holiday theme without waiting for the actual date.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="preview-holiday">Select Holiday</Label>
                  <select
                    id="preview-holiday"
                    value={holidayConfig.previewHoliday || ""}
                    onChange={(e) =>
                      setHolidayConfig({
                        ...holidayConfig,
                        previewHoliday: e.target.value || null,
                        previewDay: 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Auto-detect (no preview)</option>
                    {HOLIDAYS.map((holiday) => {
                      const theme = getHolidayTheme(holiday.id);
                      return (
                        <option key={holiday.id} value={holiday.id}>
                          {theme?.decorations.iconEmoji || "🎉"} {holiday.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {previewHolidayDetails && previewHolidayDetails.totalDays > 1 && (
                  <div className="space-y-2">
                    <Label htmlFor="preview-day">Day of Holiday</Label>
                    <select
                      id="preview-day"
                      value={holidayConfig.previewDay}
                      onChange={(e) =>
                        setHolidayConfig({
                          ...holidayConfig,
                          previewDay: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Array.from({ length: previewHolidayDetails.totalDays }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Day {i + 1} of {previewHolidayDetails.totalDays}
                          {previewHolidayDetails.theme?.decorations.progressionEmoji?.[i]
                            ? ` - ${previewHolidayDetails.theme.decorations.progressionEmoji[i]}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {previewHolidayDetails && (
                <div
                  className="p-4 rounded-lg border-2 border-dashed"
                  style={{
                    background: previewHolidayDetails.theme?.colors.background || "#f9f9f9",
                    borderColor: previewHolidayDetails.theme?.colors.primary || "#ccc",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {previewHolidayDetails.theme?.decorations.iconEmoji || "🎉"}
                      </span>
                      <div>
                        <h4
                          className="font-bold"
                          style={{ color: previewHolidayDetails.theme?.colors.text }}
                        >
                          {previewHolidayDetails.holiday.name}
                        </h4>
                        <p
                          className="text-sm opacity-80"
                          style={{ color: previewHolidayDetails.theme?.colors.text }}
                        >
                          {previewHolidayDetails.holiday.description}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={clearPreview}>
                      Clear Preview
                    </Button>
                  </div>

                  {previewHolidayDetails.theme?.decorations.progressionEmoji &&
                    previewHolidayDetails.totalDays > 1 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p
                          className="text-sm"
                          style={{ color: previewHolidayDetails.theme?.colors.text }}
                        >
                          Day {holidayConfig.previewDay}: {previewHolidayDetails.theme.decorations.progressionEmoji[holidayConfig.previewDay - 1] || ""}
                        </p>
                      </div>
                    )}
                </div>
              )}

              {holidayConfig.previewHoliday && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Preview Mode Active:</strong> The kiosk will display the {previewHolidayDetails?.holiday.name} theme until you clear the preview.
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
