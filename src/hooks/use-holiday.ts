"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getActiveHoliday,
  getHolidayById,
  getHolidayTheme,
  getDefaultTheme,
  getChineseZodiac,
  type Holiday,
  type HolidayTheme,
} from "@/lib/holidays";

export interface HolidayState {
  // Current active holiday (null if no holiday)
  holiday: Holiday | null;

  // Which day of a multi-day holiday (1-indexed)
  dayOfHoliday: number;

  // Total days of the current holiday
  totalDays: number;

  // Theme for current holiday (or default theme)
  theme: HolidayTheme;

  // Whether we're in a holiday period
  isHoliday: boolean;

  // For Lunar New Year - the zodiac animal
  zodiacAnimal: string | null;

  // Loading state
  isLoading: boolean;
}

export interface HolidaySettings {
  // Timezone for date calculations (IANA format)
  timezone: string;

  // IDs of holidays to disable
  disabledHolidays: string[];

  // Force a specific holiday for preview (null = auto-detect)
  previewHoliday: string | null;

  // For preview: which day of the holiday to show
  previewDay: number;
}

const DEFAULT_SETTINGS: HolidaySettings = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  disabledHolidays: [],
  previewHoliday: null,
  previewDay: 1,
};

/**
 * Hook to detect the current holiday and provide theme information.
 *
 * Features:
 * - Automatically detects active holidays based on current date
 * - Supports timezone configuration
 * - Supports preview mode for testing any holiday
 * - Re-checks at midnight for day changes
 * - Handles multi-day holidays with day progression
 */
export function useHoliday(
  settings: Partial<HolidaySettings> = {}
): HolidayState {
  const config = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...settings }),
    [settings]
  );

  const [state, setState] = useState<HolidayState>({
    holiday: null,
    dayOfHoliday: 0,
    totalDays: 0,
    theme: getDefaultTheme(),
    isHoliday: false,
    zodiacAnimal: null,
    isLoading: true,
  });

  // Get current date in the configured timezone
  const getCurrentDateInTimezone = useCallback(() => {
    // Create a formatter for the target timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: config.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const now = new Date();
    const parts = formatter.formatToParts(now);
    const values: Record<string, number> = {};

    for (const part of parts) {
      if (part.type !== "literal") {
        values[part.type] = parseInt(part.value, 10);
      }
    }

    return new Date(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
      values.second
    );
  }, [config.timezone]);

  // Detect the current holiday
  const detectHoliday = useCallback(() => {
    // If preview mode is active, use the preview holiday
    if (config.previewHoliday) {
      const holiday = getHolidayById(config.previewHoliday);

      if (holiday) {
        const theme = getHolidayTheme(holiday.id) || getDefaultTheme();
        const zodiac =
          holiday.id === "lunar-new-year"
            ? getChineseZodiac(new Date().getFullYear())
            : null;

        setState({
          holiday,
          dayOfHoliday: config.previewDay,
          totalDays: holiday.dateCalculator(new Date().getFullYear()).totalDays || 1,
          theme,
          isHoliday: true,
          zodiacAnimal: zodiac,
          isLoading: false,
        });
        return;
      }
    }

    // Auto-detect based on current date
    const currentDate = getCurrentDateInTimezone();
    const activeHoliday = getActiveHoliday(currentDate, config.disabledHolidays);

    if (activeHoliday) {
      const theme =
        getHolidayTheme(activeHoliday.holiday.id) || getDefaultTheme();
      const zodiac =
        activeHoliday.holiday.id === "lunar-new-year"
          ? getChineseZodiac(currentDate.getFullYear())
          : null;

      setState({
        holiday: activeHoliday.holiday,
        dayOfHoliday: activeHoliday.dayOfHoliday,
        totalDays: activeHoliday.totalDays,
        theme,
        isHoliday: true,
        zodiacAnimal: zodiac,
        isLoading: false,
      });
    } else {
      setState({
        holiday: null,
        dayOfHoliday: 0,
        totalDays: 0,
        theme: getDefaultTheme(),
        isHoliday: false,
        zodiacAnimal: null,
        isLoading: false,
      });
    }
  }, [
    config.previewHoliday,
    config.previewDay,
    config.disabledHolidays,
    getCurrentDateInTimezone,
  ]);

  // Calculate milliseconds until midnight in the configured timezone
  const getMsUntilMidnight = useCallback(() => {
    const now = getCurrentDateInTimezone();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime() - now.getTime();
  }, [getCurrentDateInTimezone]);

  // Initial detection and set up midnight refresh
  useEffect(() => {
    // Detect immediately
    detectHoliday();

    // Set up timer to re-check at midnight
    let timeoutId: NodeJS.Timeout;

    const scheduleNextCheck = () => {
      const msUntilMidnight = getMsUntilMidnight();
      // Add a small buffer (1 second) to ensure we're past midnight
      timeoutId = setTimeout(() => {
        detectHoliday();
        scheduleNextCheck();
      }, msUntilMidnight + 1000);
    };

    scheduleNextCheck();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [detectHoliday, getMsUntilMidnight]);

  // Re-detect when settings change
  useEffect(() => {
    detectHoliday();
  }, [
    config.timezone,
    config.disabledHolidays,
    config.previewHoliday,
    config.previewDay,
    detectHoliday,
  ]);

  return state;
}

/**
 * Get all available timezones for the admin settings dropdown.
 * Returns a curated list of common US and world timezones.
 */
export function getCommonTimezones(): { value: string; label: string }[] {
  return [
    // US Timezones
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Phoenix", label: "Arizona (no DST)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "America/Anchorage", label: "Alaska Time (AKT)" },
    { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },

    // Common international
    { value: "Europe/London", label: "London (GMT/BST)" },
    { value: "Europe/Paris", label: "Paris (CET)" },
    { value: "Europe/Berlin", label: "Berlin (CET)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Asia/Shanghai", label: "Shanghai (CST)" },
    { value: "Asia/Kolkata", label: "India (IST)" },
    { value: "Asia/Dubai", label: "Dubai (GST)" },
    { value: "Australia/Sydney", label: "Sydney (AEST)" },
    { value: "Pacific/Auckland", label: "Auckland (NZST)" },
  ];
}

/**
 * Get all IANA timezones (for advanced users)
 */
export function getAllTimezones(): string[] {
  // Modern browsers support Intl.supportedValuesOf
  if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
    return (Intl as unknown as { supportedValuesOf: (type: string) => string[] }).supportedValuesOf("timeZone");
  }

  // Fallback to common timezones
  return getCommonTimezones().map((tz) => tz.value);
}
